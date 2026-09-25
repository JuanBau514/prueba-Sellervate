-- P2: normalized quality criteria and review records. API access stays closed
-- until P4; session identity and atomic review submission belong to P4/P6.
create table public.issue_tags (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id) on delete restrict,
  code text not null check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (btrim(label) <> ''),
  severity text not null check (severity in ('critical', 'major', 'minor')),
  constraint issue_tags_scope_code_key unique nulls not distinct (brand_id, code)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null unique references public.replies (id) on delete restrict,
  reviewer_id uuid not null references public.people (id) on delete restrict,
  score smallint not null check (score between 1 and 4),
  comment text not null check (btrim(comment) <> ''),
  is_example boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (updated_at >= created_at)
);

create table public.review_tags (
  review_id uuid not null references public.reviews (id) on delete cascade,
  tag_id uuid not null references public.issue_tags (id) on delete restrict,
  primary key (review_id, tag_id)
);

create table public.brand_changes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  author_id uuid not null references public.people (id) on delete restrict,
  happened_on date not null,
  note text not null check (btrim(note) <> '')
);

create index reviews_reviewer_id_idx on public.reviews (reviewer_id);
create index reviews_created_at_idx on public.reviews (created_at desc);
create index review_tags_tag_id_idx on public.review_tags (tag_id);
create index brand_changes_brand_date_idx on public.brand_changes (brand_id, happened_on desc);
create index brand_changes_author_id_idx on public.brand_changes (author_id);

-- Fixed identity/scope prevents later parent edits from invalidating checked
-- relationships, including concurrent writes. No duplicated roles or brand in reviews.
create function private.keep_quality_identity()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare
  field_name text;
begin
  foreach field_name in array tg_argv loop
    if to_jsonb(new) -> field_name is distinct from to_jsonb(old) -> field_name then
      raise check_violation using message = 'Quality identity fields are immutable in V1: ' || field_name;
    end if;
  end loop;
  return new;
end;
$$;

create trigger replies_quality_identity
before update on public.replies for each row
execute function private.keep_quality_identity('brand_id');
create trigger issue_tags_quality_identity
before update on public.issue_tags for each row
execute function private.keep_quality_identity('brand_id', 'code', 'severity');
create trigger reviews_quality_identity
before update on public.reviews for each row
execute function private.keep_quality_identity('reply_id', 'reviewer_id', 'created_at');
create trigger brand_changes_quality_identity
before update on public.brand_changes for each row
execute function private.keep_quality_identity('brand_id', 'author_id');

-- This is domain integrity, NOT session authorization. P4 must additionally
-- enforce auth.uid() and current membership in RLS for every client write.
create function private.check_quality_lead()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target_brand uuid;
  author uuid;
  author_role text;
begin
  if tg_table_name = 'reviews' then
    select reply.brand_id into target_brand from public.replies as reply
    where reply.id = new.reply_id for key share;
    if not found then
      raise foreign_key_violation using message = 'Review requires an existing reply';
    end if;
    author := new.reviewer_id;
  else
    target_brand := new.brand_id;
    author := new.author_id;
  end if;

  select person.role into author_role from public.people as person
  where person.id = author for key share;
  if not found then
    raise foreign_key_violation using message = 'Quality author requires a person profile';
  end if;
  if author_role <> 'lead' then
    raise check_violation using message = 'Quality author must be a lead';
  end if;
  perform 1 from public.brand_memberships as membership
  where membership.person_id = author and membership.brand_id = target_brand
  for key share;
  if not found then
    raise foreign_key_violation using message = 'Quality author must be assigned to the brand';
  end if;
  return new;
end;
$$;

create trigger reviews_lead_assignment
before insert on public.reviews for each row execute function private.check_quality_lead();
create trigger brand_changes_lead_assignment
before insert on public.brand_changes for each row execute function private.check_quality_lead();

create function private.check_review_tag_scope()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  review_brand uuid;
  tag_brand uuid;
begin
  select reply.brand_id into review_brand
  from public.reviews as review join public.replies as reply on reply.id = review.reply_id
  where review.id = new.review_id for key share of review, reply;
  if not found then
    raise foreign_key_violation using message = 'Tag association requires an existing review';
  end if;
  select tag.brand_id into tag_brand from public.issue_tags as tag
  where tag.id = new.tag_id for key share;
  if not found then
    raise foreign_key_violation using message = 'Tag association requires an existing tag';
  end if;
  if tag_brand is not null and tag_brand <> review_brand then
    raise check_violation using message = 'Tag must be global or belong to the reviewed brand';
  end if;
  return new;
end;
$$;
create trigger review_tags_scope
before insert or update on public.review_tags for each row
execute function private.check_review_tag_scope();

create function private.touch_review()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at, new.created_at);
  return new;
end;
$$;
create trigger reviews_touch
before update on public.reviews for each row execute function private.touch_review();

revoke all on function private.keep_quality_identity(), private.check_quality_lead(),
  private.check_review_tag_scope(), private.touch_review()
  from public, anon, authenticated, service_role;

comment on table public.issue_tags is
  'Global (brand_id NULL) or brand-specific criteria. Code, scope and severity are fixed in V1; create a new code for changed criteria.';
comment on table public.reviews is
  'One current review per reply, no duplicated brand. Attribution is fixed; score/comment/example may be edited. No revision audit in V1.';
comment on table public.brand_changes is
  'Dated brand interventions recorded by an assigned lead. Historical authorship survives later membership removal.';
comment on column public.replies.brand_id is
  'Fixed tenant identity. Moving a reply would invalidate its review and tag scope.';

alter table public.issue_tags enable row level security;
alter table public.reviews enable row level security;
alter table public.review_tags enable row level security;
alter table public.brand_changes enable row level security;
revoke all privileges on table public.issue_tags, public.reviews,
  public.review_tags, public.brand_changes from public, anon, authenticated;
grant select, insert, update, delete on table public.issue_tags, public.reviews,
  public.review_tags, public.brand_changes to service_role;
