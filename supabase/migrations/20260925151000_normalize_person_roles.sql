-- P1 follow-up: people is the sole source of the global V1 role.
-- Keep the published migration intact; upgrade existing databases in place.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Roles are fixed at profile creation in V1. This avoids both historical
-- reclassification and a race between role changes and reply ingestion.
-- A future promotion/offboarding workflow needs an explicit history model.
create function private.prevent_person_role_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise check_violation using message = 'Person roles are immutable in V1';
end;
$$;

create trigger people_role_immutable
before update of role on public.people
for each row when (old.role is distinct from new.role)
execute function private.prevent_person_role_change();

-- This narrow check must see the author independently of caller RLS. It exposes
-- no data and is not callable through the API (private schema, no EXECUTE grants).
create function private.check_reply_specialist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_role text;
begin
  select person.role into author_role
  from public.people as person
  where person.id = new.specialist_id
  for key share;

  if not found then
    raise foreign_key_violation using message = 'Reply author must have a person profile';
  end if;
  if author_role <> 'specialist' then
    raise check_violation using message = 'Reply author must be a specialist';
  end if;

  -- The row lock prevents deletion/replacement of the checked author until the
  -- transaction ends. Their role cannot change; name edits remain possible.
  return new;
end;
$$;

revoke all on function private.prevent_person_role_change(),
  private.check_reply_specialist() from public, anon, authenticated, service_role;

create trigger replies_author_is_specialist
before insert or update of specialist_id on public.replies
for each row execute function private.check_reply_specialist();

alter table public.brand_memberships
  drop constraint brand_memberships_person_role_fkey,
  add constraint brand_memberships_person_id_fkey
    foreign key (person_id) references public.people (id) on delete restrict;

alter table public.replies
  drop constraint replies_specialist_membership_fkey,
  add constraint replies_specialist_membership_fkey
    foreign key (specialist_id, brand_id)
    references public.brand_memberships (person_id, brand_id) on delete restrict;

alter table public.brand_memberships
  drop constraint brand_memberships_person_brand_role_key,
  drop column role;
alter table public.replies drop column specialist_role;
alter table public.people drop constraint people_id_role_key;

comment on column public.people.role is
  'Sole source of the global V1 role. Fixed at profile creation; memberships define brand access.';
comment on table public.brand_memberships is
  'Person-to-brand assignments, without a duplicated role. Referenced assignments cannot be deleted.';
