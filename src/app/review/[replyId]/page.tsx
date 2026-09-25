import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProcedureText } from "@/components/procedure-text";
import { scoreLabels, severityStyles } from "@/components/review-labels";
import { getViewer } from "@/lib/data/viewer";
import { getReviewContext, listCriteria, nextInQueue, type ReviewContext } from "@/lib/data/workspace";
import { ReviewForm } from "./review-form";

const sentFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function ExistingReview({ review }: { review: NonNullable<ReviewContext["review"]> }) {
  return (
    <section aria-labelledby="existing-review" className="rounded-box border border-rule bg-sheet p-5">
      <h2 id="existing-review" className="text-sm font-semibold">
        Reviewed by {review.reviewer.full_name} on {dayFormat.format(new Date(review.created_at))}
      </h2>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">{review.score}</span>
        <span className="text-muted">/ 4 · {scoreLabels[review.score]}</span>
        {review.is_example && <span className="badge badge-sm badge-outline ml-2">Training example</span>}
      </p>
      {review.review_tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Issues found">
          {review.review_tags.map(({ tag }) => (
            <li key={tag.label} className="flex items-center gap-1.5 rounded-field border border-rule px-2 py-0.5 text-xs">
              <span className={`size-2 rounded-full ${severityStyles[tag.severity].dot}`} aria-hidden />
              <span className="sr-only">{severityStyles[tag.severity].name}: </span>
              {tag.label}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 whitespace-pre-line">{review.comment}</p>
    </section>
  );
}

export default async function ReviewWorkspacePage({ params, searchParams }: PageProps<"/review/[replyId]">) {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "lead") redirect("/review");

  const { replyId } = await params;
  const { saved } = await searchParams;
  const reply = await getReviewContext(replyId);
  if (!reply) notFound();

  const [criteria, next] = await Promise.all([listCriteria(reply.brand.id), nextInQueue(reply.id)]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/review" className="hover:text-base-content">
          ← Review queue
        </Link>
        <span aria-hidden> / </span>
        {reply.brand.name}
      </nav>

      {saved && (
        <p role="status" className="mt-4 rounded-field border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          Review saved. This is the next reply in your queue.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <header>
            <h1 className="text-xl font-semibold tracking-tight">{reply.specialist.full_name}</h1>
            <p className="mt-1 text-sm text-muted">
              {reply.brand.name} · sent <time dateTime={reply.sent_at}>{sentFormat.format(new Date(reply.sent_at))}</time>
              {reply.first_response_minutes !== null && <> · first response in {reply.first_response_minutes} min</>}
            </p>
          </header>

          <section aria-labelledby="customer-message">
            <h2 id="customer-message" className="mb-2 text-xs font-semibold text-muted">
              Customer wrote
            </h2>
            <blockquote className="rounded-box bg-base-200 px-4 py-3 text-sm whitespace-pre-line">{reply.customer_message}</blockquote>
          </section>

          <section aria-labelledby="reply-sent">
            <h2 id="reply-sent" className="mb-2 text-xs font-semibold text-muted">
              Reply sent by {reply.specialist.full_name}
            </h2>
            <article className="rounded-box border border-rule bg-sheet px-6 py-5 font-serif text-base whitespace-pre-line sm:px-8 sm:py-7">
              {reply.body}
            </article>
          </section>

          {reply.review ? (
            <>
              <ExistingReview review={reply.review} />
              <Link href={next ? `/review/${next}` : "/review"} className="btn btn-primary">
                {next ? "Next in queue" : "Back to the queue"}
              </Link>
            </>
          ) : (
            <section aria-labelledby="your-review" className="border-t border-rule pt-6">
              <h2 id="your-review" className="mb-4 text-lg font-semibold">
                Your review
              </h2>
              <ReviewForm
                replyId={reply.id}
                criteria={criteria}
                skipHref={next ? `/review/${next}` : null}
              />
            </section>
          )}
        </div>

        <aside aria-labelledby="brand-procedure" className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-box border border-rule bg-sheet p-5">
            <h2 id="brand-procedure" className="text-base font-semibold">
              {reply.brand.name}
            </h2>
            <p className="mt-2 text-sm text-muted">{reply.brand.voice_summary}</p>
            <hr className="my-4 border-rule" />
            <ProcedureText markdown={reply.brand.procedures_md} />
          </div>
        </aside>
      </div>
    </main>
  );
}
