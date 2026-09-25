import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { listBrands, type Brand } from "@/lib/data/brands";
import { listCoverage, listQueue, type Coverage, type QueueItem } from "@/lib/data/queue";
import { getViewer } from "@/lib/data/viewer";

const sentFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function lastReview(days: number | null) {
  if (days === null) return "never reviewed";
  if (days === 0) return "reviewed today";
  if (days === 1) return "last review yesterday";
  return `last review ${days} days ago`;
}

// A gap of a week or more (or none at all) is what the lead should notice first.
const isGap = (days: number | null) => days === null || days >= 7;

/** Collapses line breaks so a preview shows content, not a greeting and a blank line. */
const preview = (text: string) => text.replace(/\s*\n+\s*/g, " ").trim();

type BrandGroup = { id: string; name: string; slug: string; coverage: Coverage[]; items: QueueItem[] };

// Groups already-ordered rows; the order itself comes from SQL.
function groupByBrand(brands: Brand[], coverage: Coverage[], items: QueueItem[]): BrandGroup[] {
  const slugs = new Map(brands.map((brand) => [brand.id, brand.slug]));
  const groups = new Map<string, BrandGroup>();
  for (const row of coverage) {
    const group = groups.get(row.brand_id) ?? { id: row.brand_id, name: row.brand_name, slug: slugs.get(row.brand_id) ?? "", coverage: [], items: [] };
    group.coverage.push(row);
    groups.set(row.brand_id, group);
  }
  for (const item of items) groups.get(item.brand_id)?.items.push(item);
  return [...groups.values()];
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-3 max-w-prose">{children}</div>
    </main>
  );
}

function QueueEntry({ item }: { item: QueueItem }) {
  return (
    <li className="rounded-box border border-rule bg-sheet">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <p className="text-sm">
          <span className="font-semibold">{item.specialist_name}</span>
          <span className="text-muted">
            {" "}· <time dateTime={item.sent_at}>{sentFormat.format(new Date(item.sent_at))}</time>
            {item.first_response_minutes !== null && <> · first response {item.first_response_minutes} min</>}
          </span>
        </p>
        <Link href={`/review/${item.reply_id}`} className="btn btn-sm btn-primary">
          Review
        </Link>
      </div>
      <dl className="grid gap-3 px-5 pt-3 pb-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <dt className="text-xs font-semibold text-muted sm:pt-0.5">Customer</dt>
        <dd className="text-sm">{item.customer_message}</dd>
        <dt className="text-xs font-semibold text-muted sm:pt-1">Reply sent</dt>
        <dd>
          <p className="line-clamp-3 font-serif">{preview(item.body)}</p>
          <details className="mt-2 group">
            <summary className="cursor-pointer text-xs text-primary select-none">
              <span className="group-open:hidden">Read the full reply</span>
              <span className="hidden group-open:inline">Hide the full reply</span>
            </summary>
            <div className="mt-2 rounded-field bg-base-100 px-4 py-3 font-serif whitespace-pre-line">{item.body}</div>
          </details>
        </dd>
      </dl>
    </li>
  );
}

export default async function ReviewQueuePage({ searchParams }: PageProps<"/review">) {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <Message title="Review queue">
        <p>Choose a team lead in “Viewing as” to see what is waiting for review.</p>
      </Message>
    );
  }

  if (viewer.role !== "lead") {
    return (
      <Message title="Review queue">
        <p>
          The queue belongs to team leads. Your own replies and feedback are on{" "}
          <Link href="/me" className="link link-primary">your feedback page</Link>.
        </p>
      </Message>
    );
  }

  const [{ saved }, brandList, coverage, items] = await Promise.all([searchParams, listBrands(), listCoverage(), listQueue()]);
  const brands = groupByBrand(brandList, coverage, items);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Review queue</h1>
      <p className="mt-1 max-w-prose text-muted">
        Unreviewed replies from the last 14 days. In each brand, the specialists who have gone longest without a review come
        first, then the oldest reply.
      </p>

      {saved && (
        <p role="status" className="mt-4 rounded-field border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          Review saved. {items.length === 0 ? "Your queue is clear." : "The queue below is up to date."}
        </p>
      )}

      {brands.length === 0 && (
        <div className="mt-8">
          <EmptyState title="You are not leading any brand yet">
            Once you are assigned to a brand as its lead, its unreviewed replies and your team&apos;s coverage appear here.
          </EmptyState>
        </div>
      )}

      {brands.map((brand) => (
        <section key={brand.id} className="mt-10" aria-labelledby={`brand-${brand.id}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
            <h2 id={`brand-${brand.id}`} className="text-lg font-semibold">
              {brand.name}
            </h2>
            <p className="text-sm text-muted">
              {brand.items.length} waiting ·{" "}
              <Link href={`/brands/${brand.slug}`} className="text-primary hover:underline">
                Brand evidence
              </Link>
            </p>
          </div>

          <table className="mt-3 w-full text-sm" aria-label={`Review coverage in ${brand.name}`}>
            <thead className="sr-only">
              <tr>
                <th>Specialist</th>
                <th>Last review</th>
                <th>Reviewed in 4 weeks</th>
                <th>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {brand.coverage.map((row) => (
                <tr key={row.specialist_id} className="align-baseline">
                  <td className="py-1 pr-4 font-medium">{row.specialist_name}</td>
                  <td className={`py-1 pr-4 ${isGap(row.days_since_review) ? "font-semibold" : "text-muted"}`}>
                    {lastReview(row.days_since_review)}
                  </td>
                  <td className="hidden py-1 pr-4 text-muted sm:table-cell">
                    {row.reviewed_28d} of {row.replies_28d} reviewed in 4 weeks
                  </td>
                  <td className="py-1 text-right text-muted tabular-nums">{row.waiting} waiting</td>
                </tr>
              ))}
            </tbody>
          </table>

          {brand.items.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={`Nothing waiting in ${brand.name}`}
                action={brand.slug ? { href: `/brands/${brand.slug}`, label: "See the brand evidence" } : undefined}
              >
                Every reply from the last 14 days has been reviewed. The trend and recurring issues are on the brand page.
              </EmptyState>
            </div>
          ) : (
            <ol className="mt-4 space-y-3">
              {brand.items.map((item) => (
                <QueueEntry key={item.reply_id} item={item} />
              ))}
            </ol>
          )}
        </section>
      ))}
    </main>
  );
}
