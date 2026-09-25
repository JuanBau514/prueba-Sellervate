-- P5: what to review next, without blind spots.
-- Both views run with the caller's rights (security_invoker), so the P4 RLS
-- policies still decide which rows exist; they additionally keep only brands
-- the caller leads, so specialists get an empty queue from the database itself.
-- Coverage is per brand AND specialist: reviewing Dani in Voltia must not hide
-- that nobody has read his Caja Norte replies.

create view public.review_coverage with (security_invoker = true) as
select
  membership.brand_id,
  brand.name as brand_name,
  person.id as specialist_id,
  person.full_name as specialist_name,
  max(review.created_at) as last_reviewed_at,
  floor(extract(epoch from now() - max(review.created_at)) / 86400)::integer as days_since_review,
  count(reply.id) filter (where review.id is null and reply.sent_at >= now() - interval '14 days')::integer
    as waiting,
  count(reply.id) filter (where reply.sent_at >= now() - interval '28 days')::integer as replies_28d,
  count(review.id) filter (where reply.sent_at >= now() - interval '28 days')::integer as reviewed_28d
from public.brand_memberships as membership
join public.people as person on person.id = membership.person_id and person.role = 'specialist'
join public.brands as brand on brand.id = membership.brand_id
left join public.replies as reply
  on reply.brand_id = membership.brand_id and reply.specialist_id = membership.person_id
left join public.reviews as review on review.reply_id = reply.id
where private.is_brand_lead(membership.brand_id)
group by membership.brand_id, brand.name, person.id, person.full_name;

-- Unreviewed replies from the last 14 days, carrying their specialist's
-- coverage in that brand so the API can order by it (oldest review first,
-- never-reviewed before everyone, then oldest reply first).
create view public.review_queue with (security_invoker = true) as
select
  reply.id as reply_id,
  reply.brand_id,
  coverage.brand_name,
  reply.specialist_id,
  coverage.specialist_name,
  reply.sent_at,
  reply.customer_message,
  reply.body,
  reply.first_response_minutes,
  coverage.last_reviewed_at,
  coverage.days_since_review
from public.replies as reply
join public.review_coverage as coverage
  on coverage.brand_id = reply.brand_id and coverage.specialist_id = reply.specialist_id
where reply.sent_at >= now() - interval '14 days'
  and not exists (select 1 from public.reviews as review where review.reply_id = reply.id);

comment on view public.review_coverage is
  'Per brand and specialist: days since last review and unreviewed replies (14 days). Leads only.';
comment on view public.review_queue is
  'Unreviewed replies from the last 14 days in brands the caller leads. Order by last_reviewed_at nulls first, sent_at.';

revoke all on public.review_coverage, public.review_queue from public, anon, authenticated;
grant select on public.review_coverage, public.review_queue to authenticated;
