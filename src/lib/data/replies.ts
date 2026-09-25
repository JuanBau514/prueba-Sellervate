import 'server-only';

import { select } from './rest';

export type ReplySummary = {
  id: string;
  sent_at: string;
  brand: { name: string };
  specialist: { full_name: string };
  review: { score: number } | null;
};

export type ReplyDetail = ReplySummary & {
  customer_message: string;
  body: string;
  first_response_minutes: number | null;
};

const summaryColumns =
  'id,sent_at,brand:brands(name),specialist:people(full_name),review:reviews(score)';

/** Replies visible to the viewer under RLS: their own, or their brands' as a lead. */
export function listReplies(limit = 50) {
  return select<ReplySummary>(`replies?select=${summaryColumns}&order=sent_at.desc&limit=${limit}`);
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Null both when the reply does not exist and when RLS hides it. */
export async function getReply(id: string): Promise<ReplyDetail | null> {
  if (!uuidPattern.test(id)) return null;
  const [reply] = await select<ReplyDetail>(
    `replies?select=${summaryColumns},customer_message,body,first_response_minutes&id=eq.${id}`,
  );
  return reply ?? null;
}
