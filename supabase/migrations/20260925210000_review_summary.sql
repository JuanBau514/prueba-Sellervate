-- P7: per brand and specialist summary of reviews, always with its sample size.
-- security_invoker: RLS decides the rows. A specialist gets only their own
-- summary; a lead gets the specialists of the brands they lead (used by P8).
-- No role or specialist filter here on purpose: a wrong policy must show up in
-- tests, not be masked by the view.

create view public.review_summary with (security_invoker = true) as
select
  reply.brand_id,
  brand.name as brand_name,
  reply.specialist_id,
  count(review.id)::integer as reviews,
  round(avg(review.score), 2) as average_score,
  count(review.id) filter (where exists (
    select 1 from public.review_tags as review_tag
    join public.issue_tags as tag on tag.id = review_tag.tag_id
    where review_tag.review_id = review.id and tag.severity = 'critical'
  ))::integer as reviews_with_critical,
  max(review.created_at) as last_reviewed_at
from public.reviews as review
join public.replies as reply on reply.id = review.reply_id
join public.brands as brand on brand.id = reply.brand_id
group by reply.brand_id, brand.name, reply.specialist_id;

comment on view public.review_summary is
  'Reviews per brand and specialist: n, average score, reviews with a critical issue. Rows follow RLS.';

revoke all on public.review_summary from public, anon, authenticated;
grant select on public.review_summary to authenticated;
