import Link from "next/link";
import { redirect } from "next/navigation";

import { scoreLabels, severityStyles } from "@/components/review-labels";
import { listBrands } from "@/lib/data/brands";
import { listBrandSummary, listFeedback, type FeedbackItem } from "@/lib/data/feedback";
import { getViewer } from "@/lib/data/viewer";

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const sentFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const formatAverage = (value: number) => value.toFixed(1);

function FeedbackEntry({ item }: { item: FeedbackItem }) {
  return (
    <li className="rounded-box border border-rule bg-sheet">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <p className="text-sm">
          <span className="font-semibold">{item.reply.brand.name}</span>
          <span className="text-muted">
            {" "}· reviewed by {item.reviewer.full_name} on{" "}
            <time dateTime={item.created_at}>{dayFormat.format(new Date(item.created_at))}</time>
          </span>
        </p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tabular-nums">{item.score}</span>
          <span className="text-sm text-muted">/ 4 · {scoreLabels[item.score]}</span>
        </p>
      </div>

      <div className="space-y-3 px-5 pt-3 pb-4">
        {item.is_example && (
          <p className="text-sm text-primary">Your lead kept this reply as a training example for the team.</p>
        )}
        {item.review_tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Issues found">
            {item.review_tags.map(({ tag }) => (
              <li key={tag.label} className="flex items-center gap-1.5 rounded-field border border-rule px-2 py-0.5 text-xs">
                <span className={`size-2 rounded-full ${severityStyles[tag.severity].dot}`} aria-hidden />
                <span className={`font-semibold ${severityStyles[tag.severity].text}`}>{severityStyles[tag.severity].name}</span>
                {tag.label}
              </li>
            ))}
          </ul>
        )}
        <blockquote className="border-l-2 border-primary pl-4 whitespace-pre-line">{item.comment}</blockquote>
        <details className="group">
          <summary className="cursor-pointer text-xs text-primary select-none">
            <span className="group-open:hidden">Show the reply it refers to</span>
            <span className="hidden group-open:inline">Hide the reply</span>
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted">
              Sent <time dateTime={item.reply.sent_at}>{sentFormat.format(new Date(item.reply.sent_at))}</time>
            </p>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Customer wrote</p>
              <p className="rounded-field bg-base-200 px-4 py-3 text-sm whitespace-pre-line">{item.reply.customer_message}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Your reply</p>
              <p className="rounded-field bg-base-100 px-4 py-3 font-serif whitespace-pre-line">{item.reply.body}</p>
            </div>
          </div>
        </details>
      </div>
    </li>
  );
}

// A specialist's feedback, visible to them alone (RLS). Leads have their queue.
export default async function MyFeedbackPage({ searchParams }: PageProps<"/me">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role === "lead") redirect("/review");

  const { brand } = await searchParams;
  const brandFilter = typeof brand === "string" ? brand : undefined;
  const [brands, summary, feedback] = await Promise.all([listBrands(), listBrandSummary(), listFeedback(brandFilter)]);
  const activeBrand = brands.find((item) => item.id === brandFilter);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Your feedback</h1>
      <p className="mt-1 max-w-prose text-muted">
        What your leads noted on your replies, brand by brand. Only you and the leads of each brand can see it.
      </p>

      <section aria-labelledby="summary" className="mt-8">
        <h2 id="summary" className="sr-only">Summary by brand</h2>
        {summary.length === 0 ? null : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((row) => (
              <li key={row.brand_id} className="rounded-box border border-rule bg-sheet px-5 py-4">
                <p className="text-sm font-semibold">{row.brand_name}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums">{formatAverage(row.average_score)}</span>
                  <span className="text-sm text-muted">average · n = {row.reviews}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {row.reviews_with_critical > 0
                    ? `${row.reviews_with_critical} with a critical issue · `
                    : "No critical issues · "}
                  last review {dayFormat.format(new Date(row.last_reviewed_at))}
                </p>
                {row.reviews < 5 && (
                  <p className="mt-1 text-xs text-muted">Few reviews yet: read the comments, not the average.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {brands.length > 1 && (
        <nav aria-label="Filter by brand" className="mt-8 flex flex-wrap gap-2 border-b border-rule pb-3">
          <Link
            href="/me"
            aria-current={!activeBrand ? "page" : undefined}
            className={`btn btn-sm ${!activeBrand ? "btn-primary" : "btn-ghost font-normal"}`}
          >
            All brands
          </Link>
          {brands.map((item) => (
            <Link
              key={item.id}
              href={`/me?brand=${item.id}`}
              aria-current={activeBrand?.id === item.id ? "page" : undefined}
              className={`btn btn-sm ${activeBrand?.id === item.id ? "btn-primary" : "btn-ghost font-normal"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      <section aria-labelledby="reviews" className="mt-6">
        <h2 id="reviews" className="sr-only">
          Reviews {activeBrand ? `in ${activeBrand.name}` : ""}
        </h2>
        {feedback.length === 0 ? (
          <p className="rounded-box border border-dashed border-rule px-5 py-6 text-muted">
            {activeBrand
              ? `You have no reviews in ${activeBrand.name} yet.`
              : "You have no reviews yet. When a lead reviews one of your replies, their score and comment will appear here."}
          </p>
        ) : (
          <ol className="space-y-3">
            {feedback.map((item) => (
              <FeedbackEntry key={item.id} item={item} />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
