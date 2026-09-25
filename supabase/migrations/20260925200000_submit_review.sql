-- P6: save a review and its tags in one transaction.
-- SECURITY INVOKER: the caller's RLS policies from P4 apply to both inserts, and
-- the P2 triggers still reject tags from another brand. The reviewer is always
-- the session user; there is no parameter for it.

create function public.submit_review(
  p_reply_id uuid,
  p_score smallint,
  p_comment text,
  p_is_example boolean default false,
  p_tag_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_review_id uuid;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Sign in to submit a review';
  end if;

  insert into public.reviews (reply_id, reviewer_id, score, comment, is_example)
  values (p_reply_id, auth.uid(), p_score, btrim(p_comment), coalesce(p_is_example, false))
  returning id into new_review_id;

  insert into public.review_tags (review_id, tag_id)
  select distinct new_review_id, tag_id
  from unnest(coalesce(p_tag_ids, '{}'::uuid[])) as tag_id;

  return new_review_id;
end;
$$;

comment on function public.submit_review(uuid, smallint, text, boolean, uuid[]) is
  'Atomic review + tags as the session user. Any failure (RLS, foreign-brand tag, duplicate) rolls back both.';

revoke all on function public.submit_review(uuid, smallint, text, boolean, uuid[]) from public, anon, service_role;
grant execute on function public.submit_review(uuid, smallint, text, boolean, uuid[]) to authenticated;
