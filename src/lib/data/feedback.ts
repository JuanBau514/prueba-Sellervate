import 'server-only';

import { select } from './rest';
import { isUuid, type Severity } from './workspace';

export type FeedbackItem = {
  id: string;
  score: number;
  comment: string;
  is_example: boolean;
  created_at: string;
  reviewer: { full_name: string };
  reply: {
    sent_at: string;
    customer_message: string;
    body: string;
    brand: { id: string; name: string };
  };
  review_tags: { tag: { label: string; severity: Severity } }[];
};

export type BrandSummary = {
  brand_id: string;
  brand_name: string;
  reviews: number;
  average_score: number;
  reviews_with_critical: number;
  last_reviewed_at: string;
};

/**
 * Reviews the viewer may read, newest first. There is deliberately no
 * specialist filter: RLS returns a specialist's own reviews only. The brand
 * filter narrows the view; it does not grant or restrict access.
 */
export function listFeedback(brandId?: string) {
  const brandFilter = brandId && isUuid(brandId) ? `&reply.brand_id=eq.${brandId}` : '';
  return select<FeedbackItem>(
    'reviews?select=id,score,comment,is_example,created_at,reviewer:people(full_name),' +
      'reply:replies!inner(sent_at,customer_message,body,brand:brands(id,name)),' +
      `review_tags(tag:issue_tags(label,severity))&order=created_at.desc${brandFilter}`,
  );
}

/** Average score with its sample size, per brand (and specialist, per RLS). */
export function listBrandSummary() {
  return select<BrandSummary>(
    'review_summary?select=brand_id,brand_name,reviews,average_score,reviews_with_critical,last_reviewed_at&order=brand_name',
  );
}
