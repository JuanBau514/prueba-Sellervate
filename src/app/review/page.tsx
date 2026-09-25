import Link from "next/link";

import { listCoverage, listQueue, type Coverage, type QueueItem } from "@/lib/data/queue";
import { getViewer } from "@/lib/data/viewer";

const sentFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function lastReview(days: number | null) {
  if (days === null) return "never reviewed";
  if (days === 0) return "reviewed today";
  if (days === 1) return "last review yesterday";
  return `last review ${days} days ago`;
}

type BrandGroup = { id: string; name: string; coverage: Coverage[]; items: QueueItem[] };

// Groups already-ordered rows; the order itself comes from SQL.
function groupByBrand(coverage: Coverage[], items: QueueItem[]): BrandGroup[] {
  const groups = new Map<string, BrandGroup>();
  for (const row of coverage) {
    const group = groups.get(row.brand_id) ?? { id: row.brand_id, name: row.brand_name, coverage: [], items: [] };
    group.coverage.push(row);
    groups.set(row.brand_id, group);
  }
  for (const item of items) groups.get(item.brand_id)?.items.push(item);
  return [...groups.values()];
}

export default async function ReviewQueuePage() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-3">Choose a team lead above to see what is waiting for review.</p>
      </main>
    );
  }

  if (viewer.role !== "lead") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
        <p className="mt-3">
          The queue belongs to team leads. Your own replies and feedback are on <Link href="/" className="link">your page</Link>.
        </p>
      </main>
    );
  }

  const [coverage, items] = await Promise.all([listCoverage(), listQueue()]);
  const brands = groupByBrand(coverage, items);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
      <p className="mt-1 text-neutral-600">
        Unreviewed replies from the last 14 days. Specialists who have gone longest without a review in each brand come first,
        then the oldest reply.
      </p>

      {brands.length === 0 && (
        <p className="mt-8">You are not leading any brand yet, so there is nothing to review.</p>
      )}

      {brands.map((brand) => (
        <section key={brand.id} className="mt-10" aria-labelledby={`brand-${brand.id}`}>
          <h2 id={`brand-${brand.id}`} className="text-xl font-semibold">
            {brand.name} <span className="font-normal text-neutral-500">· {brand.items.length} waiting</span>
          </h2>

          <ul className="mt-3 space-y-1 text-sm" aria-label={`Review coverage in ${brand.name}`}>
            {brand.coverage.map((row) => (
              <li key={row.specialist_id}>
                <span className="font-medium">{row.specialist_name}</span> · {lastReview(row.days_since_review)} ·{" "}
                {row.reviewed_28d} of {row.replies_28d} replies reviewed in 4 weeks
                {row.waiting > 0 && <> · {row.waiting} waiting</>}
              </li>
            ))}
          </ul>

          {brand.items.length === 0 ? (
            <p className="mt-4 text-neutral-600">
              Nothing waiting in {brand.name}: every reply from the last 14 days has been reviewed.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
              {brand.items.map((item) => (
                <li key={item.reply_id} className="py-4">
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">{item.specialist_name}</span> ·{" "}
                    <time dateTime={item.sent_at}>{sentFormat.format(new Date(item.sent_at))}</time>
                    {item.first_response_minutes !== null && <> · first response {item.first_response_minutes} min</>}
                  </p>
                  <p className="mt-2 line-clamp-2 text-neutral-600">
                    <span className="sr-only">Customer: </span>“{item.customer_message}”
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line">{item.body}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </main>
  );
}
