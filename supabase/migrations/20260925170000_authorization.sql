-- P4: session-based authorization. RLS is the authority; the application only
-- forwards the user's JWT. Brand access always requires a current membership;
-- the global role alone never grants cross-brand access. anon gets nothing.

-- Membership lookups run as the definer so policies on brand_memberships do not
-- recurse. They only answer about the caller (auth.uid()) and expose no rows.
create function private.is_brand_member(target_brand uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.brand_memberships as membership
    where membership.brand_id = target_brand
      and membership.person_id = (select auth.uid())
  );
$$;

create function private.is_brand_lead(target_brand uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.brand_memberships as membership
    join public.people as person on person.id = membership.person_id
    where membership.brand_id = target_brand
      and membership.person_id = (select auth.uid())
      and person.role = 'lead'
  );
$$;

-- True when the caller and target_person are assigned to at least one common brand.
create function private.shares_brand_with(target_person uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.brand_memberships as mine
    join public.brand_memberships as theirs on theirs.brand_id = mine.brand_id
    where mine.person_id = (select auth.uid())
      and theirs.person_id = target_person
  );
$$;

revoke all on function private.is_brand_member(uuid), private.is_brand_lead(uuid),
  private.shares_brand_with(uuid) from public, anon, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_brand_member(uuid), private.is_brand_lead(uuid),
  private.shares_brand_with(uuid) to authenticated;

-- Privileges: reads on every table, writes only where a lead records judgement.
-- Reviews expose only their editable columns to UPDATE; identity is set once.
grant select on table public.people, public.brands, public.brand_memberships,
  public.replies, public.issue_tags, public.reviews, public.review_tags,
  public.brand_changes to authenticated;
grant insert (reply_id, reviewer_id, score, comment, is_example) on table public.reviews to authenticated;
grant update (score, comment, is_example) on table public.reviews to authenticated;
grant insert, delete on table public.review_tags to authenticated;
grant insert (brand_id, author_id, happened_on, note) on table public.brand_changes to authenticated;

-- people: yourself and colleagues who share a brand (the lead who reviewed you,
-- the specialists a lead supervises). Not the whole staff directory.
create policy people_select on public.people for select to authenticated
using (id = (select auth.uid()) or private.shares_brand_with(id));

create policy brands_select on public.brands for select to authenticated
using (private.is_brand_member(id));

-- Specialists see their own assignments; leads see their brand's team.
create policy brand_memberships_select on public.brand_memberships for select to authenticated
using (person_id = (select auth.uid()) or private.is_brand_lead(brand_id));

-- Specialists see only their own replies, even within a shared brand.
create policy replies_select on public.replies for select to authenticated
using (
  (specialist_id = (select auth.uid()) and private.is_brand_member(brand_id))
  or private.is_brand_lead(brand_id)
);

create policy issue_tags_select on public.issue_tags for select to authenticated
using (brand_id is null or private.is_brand_member(brand_id));

-- Review visibility follows reply visibility: the author of the reply or a
-- lead of its brand. The replies subquery is itself filtered by RLS.
create policy reviews_select on public.reviews for select to authenticated
using (exists (select 1 from public.replies as reply where reply.id = reviews.reply_id));

create policy reviews_insert on public.reviews for insert to authenticated
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1 from public.replies as reply
    where reply.id = reviews.reply_id and private.is_brand_lead(reply.brand_id)
  )
);

create policy reviews_update on public.reviews for update to authenticated
using (
  reviewer_id = (select auth.uid())
  and exists (
    select 1 from public.replies as reply
    where reply.id = reviews.reply_id and private.is_brand_lead(reply.brand_id)
  )
)
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1 from public.replies as reply
    where reply.id = reviews.reply_id and private.is_brand_lead(reply.brand_id)
  )
);

create policy review_tags_select on public.review_tags for select to authenticated
using (exists (select 1 from public.reviews as review where review.id = review_tags.review_id));

-- Only the reviewing lead, still assigned to the brand, changes a review's tags.
-- The P2 trigger additionally rejects tags from another brand.
create policy review_tags_insert on public.review_tags for insert to authenticated
with check (exists (
  select 1 from public.reviews as review
  join public.replies as reply on reply.id = review.reply_id
  where review.id = review_tags.review_id
    and review.reviewer_id = (select auth.uid())
    and private.is_brand_lead(reply.brand_id)
));

create policy review_tags_delete on public.review_tags for delete to authenticated
using (exists (
  select 1 from public.reviews as review
  join public.replies as reply on reply.id = review.reply_id
  where review.id = review_tags.review_id
    and review.reviewer_id = (select auth.uid())
    and private.is_brand_lead(reply.brand_id)
));

create policy brand_changes_select on public.brand_changes for select to authenticated
using (private.is_brand_lead(brand_id));

create policy brand_changes_insert on public.brand_changes for insert to authenticated
with check (author_id = (select auth.uid()) and private.is_brand_lead(brand_id));

comment on function private.is_brand_lead(uuid) is
  'RLS helper: caller is a lead assigned to the brand. Role alone never grants access.';
