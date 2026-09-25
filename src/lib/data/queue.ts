import 'server-only';

import { select } from './rest';

export type QueueItem = {
  reply_id: string;
  brand_id: string;
  brand_name: string;
  specialist_id: string;
  specialist_name: string;
  sent_at: string;
  customer_message: string;
  body: string;
  first_response_minutes: number | null;
  days_since_review: number | null;
};

export type Coverage = {
  brand_id: string;
  brand_name: string;
  specialist_id: string;
  specialist_name: string;
  days_since_review: number | null;
  waiting: number;
  replies_28d: number;
  reviewed_28d: number;
};

// Sampling heuristic, applied in SQL: within each brand, the specialist with the
// longest time since their last review in that brand comes first (never reviewed
// before anyone), then the oldest reply. Replaceable by a triage model in V2.
const byGap = 'order=brand_name.asc,last_reviewed_at.asc.nullsfirst,specialist_name.asc';

/** Unreviewed replies from the last 14 days in brands the viewer leads. */
export function listQueue() {
  return select<QueueItem>(
    'review_queue?select=reply_id,brand_id,brand_name,specialist_id,specialist_name,sent_at,' +
      `customer_message,body,first_response_minutes,days_since_review&${byGap},sent_at.asc`,
  );
}

/** One row per brand and specialist the viewer leads, including never-reviewed specialists. */
export function listCoverage() {
  return select<Coverage>(
    'review_coverage?select=brand_id,brand_name,specialist_id,specialist_name,' +
      `days_since_review,waiting,replies_28d,reviewed_28d&${byGap}`,
  );
}
