-- P8: evidence for the brand. Every aggregate is a security_invoker view keyed
-- by brand_id (never mixing brands), limited to brands the caller leads, and
-- always carrying its sample size. Nothing is stored; all figures come from
-- replies, reviews and tags on each read.

-- Weekly quality of the replies SENT that week (not of when they were reviewed),
-- so a brand change lines up with the work it was meant to affect.
create view public.brand_weekly_scores with (security_invoker = true) as
select
  reply.brand_id,
  date_trunc('week', reply.sent_at)::date as week_start,
  count(review.id)::integer as reviews,
  round(avg(review.score), 2) as average_score,
  count(review.id) filter (where exists (
    select 1 from public.review_tags as review_tag
    join public.issue_tags as tag on tag.id = review_tag.tag_id
    where review_tag.review_id = review.id and tag.severity = 'critical'
  ))::integer as reviews_with_critical
from public.reviews as review
join public.replies as reply on reply.id = review.reply_id
where private.is_brand_lead(reply.brand_id)
  and reply.sent_at >= date_trunc('week', now()) - interval '7 weeks'
group by reply.brand_id, date_trunc('week', reply.sent_at)::date;

-- Reviews with at least one critical issue, one row per critical tag.
create view public.brand_critical_reviews with (security_invoker = true) as
select
  reply.brand_id,
  review.id as review_id,
  reply.id as reply_id,
  reply.sent_at,
  person.full_name as specialist_name,
  review.score,
  tag.label as issue_label
from public.reviews as review
join public.replies as reply on reply.id = review.reply_id
join public.people as person on person.id = reply.specialist_id
join public.review_tags as review_tag on review_tag.review_id = review.id
join public.issue_tags as tag on tag.id = review_tag.tag_id and tag.severity = 'critical'
where private.is_brand_lead(reply.brand_id);

-- Issue × specialist over the last 6 weeks. `weeks` counts distinct weeks with
-- the issue: repeated across weeks is a pattern, not a bad day.
create view public.brand_issue_patterns with (security_invoker = true) as
select
  reply.brand_id,
  tag.id as tag_id,
  tag.label as issue_label,
  tag.severity,
  reply.specialist_id,
  person.full_name as specialist_name,
  count(*)::integer as occurrences,
  count(distinct date_trunc('week', reply.sent_at))::integer as weeks,
  min(reply.sent_at) as first_seen,
  max(reply.sent_at) as last_seen
from public.review_tags as review_tag
join public.reviews as review on review.id = review_tag.review_id
join public.replies as reply on reply.id = review.reply_id
join public.people as person on person.id = reply.specialist_id
join public.issue_tags as tag on tag.id = review_tag.tag_id
where private.is_brand_lead(reply.brand_id)
  and reply.sent_at >= now() - interval '6 weeks'
group by reply.brand_id, tag.id, tag.label, tag.severity, reply.specialist_id, person.full_name;

comment on view public.brand_weekly_scores is 'Per brand and ISO week of sending: n, average score, reviews with a critical issue. Leads only.';
comment on view public.brand_critical_reviews is 'Reviews with a critical issue, per brand. Leads only.';
comment on view public.brand_issue_patterns is 'Issue × specialist in the last 6 weeks with occurrences and distinct weeks. Leads only.';

revoke all on public.brand_weekly_scores, public.brand_critical_reviews, public.brand_issue_patterns
  from public, anon, authenticated;
grant select on public.brand_weekly_scores, public.brand_critical_reviews, public.brand_issue_patterns
  to authenticated;

-- "What we changed": the author comes from the session, like a reviewer.
-- The column is no longer writable by API users; RLS still checks it.
alter table public.brand_changes alter column author_id set default auth.uid();
revoke insert (author_id) on public.brand_changes from authenticated;
