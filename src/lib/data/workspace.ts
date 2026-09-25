import 'server-only';

import { listQueue } from './queue';
import { rpc, select } from './rest';

export type Severity = 'critical' | 'major' | 'minor';
export type Criterion = { id: string; code: string; label: string; severity: Severity; brand_id: string | null };

export type ReviewContext = {
  id: string;
  sent_at: string;
  customer_message: string;
  body: string;
  first_response_minutes: number | null;
  brand: { id: string; name: string; voice_summary: string; procedures_md: string };
  specialist: { full_name: string };
  review: {
    score: number;
    comment: string;
    is_example: boolean;
    created_at: string;
    reviewer: { full_name: string };
    review_tags: { tag: { label: string; severity: Severity } }[];
  } | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => uuidPattern.test(value);

/** Reply, brand procedures and any existing review, or null if RLS hides it. */
export async function getReviewContext(replyId: string): Promise<ReviewContext | null> {
  if (!isUuid(replyId)) return null;
  const [reply] = await select<ReviewContext>(
    'replies?select=id,sent_at,customer_message,body,first_response_minutes,' +
      'brand:brands(id,name,voice_summary,procedures_md),specialist:people(full_name),' +
      'review:reviews(score,comment,is_example,created_at,reviewer:people(full_name),' +
      `review_tags(tag:issue_tags(label,severity)))&id=eq.${replyId}`,
  );
  return reply ?? null;
}

/** Global criteria plus the brand's own, most severe first (critical < major < minor). */
export function listCriteria(brandId: string) {
  if (!isUuid(brandId)) return Promise.resolve([]);
  return select<Criterion>(
    `issue_tags?select=id,code,label,severity,brand_id&or=(brand_id.is.null,brand_id.eq.${brandId})&order=severity.asc,label.asc`,
  );
}

/** The next reply in the viewer's queue after `currentId`, wrapping to the top. */
export async function nextInQueue(currentId: string | null): Promise<string | null> {
  const queue = await listQueue();
  const others = queue.filter((item) => item.reply_id !== currentId);
  if (others.length === 0) return null;
  const position = queue.findIndex((item) => item.reply_id === currentId);
  const after = position >= 0 ? queue.slice(position + 1).find((item) => item.reply_id !== currentId) : undefined;
  return (after ?? others[0]).reply_id;
}

export type SubmitReviewInput = {
  replyId: string;
  score: number;
  comment: string;
  isExample: boolean;
  tagIds: string[];
};

/** Review + tags in one transaction; the reviewer is the session user (see submit_review). */
export function submitReview(input: SubmitReviewInput) {
  return rpc<string>('submit_review', {
    p_reply_id: input.replyId,
    p_score: input.score,
    p_comment: input.comment,
    p_is_example: input.isExample,
    p_tag_ids: input.tagIds,
  });
}
