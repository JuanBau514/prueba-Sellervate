import 'server-only';

import type { Coverage } from './queue';
import { insert, select } from './rest';
import { isUuid, type Severity } from './workspace';

export type BrandHeader = { id: string; slug: string; name: string; voice_summary: string };
export type WeeklyScore = { week_start: string; reviews: number; average_score: number; reviews_with_critical: number };
export type CriticalReview = {
  review_id: string;
  reply_id: string;
  sent_at: string;
  specialist_name: string;
  score: number;
  issue_label: string;
};
export type IssuePattern = {
  tag_id: string;
  issue_label: string;
  severity: Severity;
  specialist_id: string;
  specialist_name: string;
  occurrences: number;
  weeks: number;
  last_seen: string;
};
export type BrandChange = { id: string; happened_on: string; note: string; author: { full_name: string } };

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The brand if the viewer is assigned to it (RLS), else null. */
export async function getBrandBySlug(slug: string): Promise<BrandHeader | null> {
  if (!slugPattern.test(slug)) return null;
  const [brand] = await select<BrandHeader>(`brands?select=id,slug,name,voice_summary&slug=eq.${slug}`);
  return brand ?? null;
}

// Every query below is scoped to one brand_id: aggregates never mix brands.
// The views themselves only return brands the viewer leads.

export function listWeeklyScores(brandId: string) {
  return select<WeeklyScore>(
    `brand_weekly_scores?select=week_start,reviews,average_score,reviews_with_critical&brand_id=eq.${brandId}&order=week_start.asc`,
  );
}

export function listCriticalReviews(brandId: string, sinceDays = 28) {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  return select<CriticalReview>(
    'brand_critical_reviews?select=review_id,reply_id,sent_at,specialist_name,score,issue_label' +
      `&brand_id=eq.${brandId}&sent_at=gte.${since}&order=sent_at.desc`,
  );
}

export function listIssuePatterns(brandId: string) {
  return select<IssuePattern>(
    'brand_issue_patterns?select=tag_id,issue_label,severity,specialist_id,specialist_name,occurrences,weeks,last_seen' +
      `&brand_id=eq.${brandId}&order=weeks.desc,occurrences.desc,severity.asc`,
  );
}

export function listBrandCoverage(brandId: string) {
  return select<Coverage>(
    'review_coverage?select=brand_id,brand_name,specialist_id,specialist_name,days_since_review,waiting,replies_28d,reviewed_28d' +
      `&brand_id=eq.${brandId}&order=last_reviewed_at.asc.nullsfirst,specialist_name.asc`,
  );
}

export function listBrandChanges(brandId: string) {
  return select<BrandChange>(
    `brand_changes?select=id,happened_on,note,author:people(full_name)&brand_id=eq.${brandId}&order=happened_on.desc`,
  );
}

/** The author is not sent: the database fills it from the session (auth.uid()). */
export function logBrandChange(input: { brandId: string; happenedOn: string; note: string }) {
  if (!isUuid(input.brandId)) throw new Error('Invalid brand');
  return insert('brand_changes', { brand_id: input.brandId, happened_on: input.happenedOn, note: input.note });
}
