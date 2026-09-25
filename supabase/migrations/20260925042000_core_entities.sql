-- P1: brands, people, assignments and already-sent support replies.
-- Authorization policies and application grants are deliberately deferred to P4.

create table public.people (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (btrim(full_name) <> ''),
  role text not null check (role in ('lead', 'specialist')),
  created_at timestamptz not null default now(),
  constraint people_id_role_key unique (id, role)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  voice_summary text not null check (btrim(voice_summary) <> ''),
  procedures_md text not null check (btrim(procedures_md) <> ''),
  created_at timestamptz not null default now()
);

create table public.brand_memberships (
  person_id uuid not null,
  brand_id uuid not null references public.brands (id) on delete restrict,
  role text not null check (role in ('lead', 'specialist')),
  created_at timestamptz not null default now(),
  primary key (person_id, brand_id),
  -- V1: a person's role is consistent across their assigned brands.
  constraint brand_memberships_person_role_fkey
    foreign key (person_id, role) references public.people (id, role) on delete restrict,
  constraint brand_memberships_person_brand_role_key unique (person_id, brand_id, role)
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  specialist_id uuid not null references public.people (id) on delete restrict,
  -- A generated constant lets a foreign key enforce specialist membership,
  -- including later assignment/role edits, without cross-table CHECKs or triggers.
  specialist_role text generated always as ('specialist'::text) stored not null,
  customer_message text not null check (btrim(customer_message) <> ''),
  body text not null check (btrim(body) <> ''),
  sent_at timestamptz not null,
  first_response_minutes integer check (first_response_minutes >= 0),
  source text not null default 'seed' check (btrim(source) <> ''),
  external_id text not null check (btrim(external_id) <> ''),
  created_at timestamptz not null default now(),
  constraint replies_specialist_membership_fkey
    foreign key (specialist_id, brand_id, specialist_role)
    references public.brand_memberships (person_id, brand_id, role) on delete restrict,
  constraint replies_import_identity_key unique (brand_id, source, external_id)
);

create index brand_memberships_brand_id_idx on public.brand_memberships (brand_id);
create index replies_brand_sent_at_idx on public.replies (brand_id, sent_at desc);
create index replies_specialist_id_idx on public.replies (specialist_id);

comment on column public.replies.external_id is
  'Source reply/message identifier, not a ticket identifier. Required for repeatable imports.';
comment on column public.replies.first_response_minutes is
  'Measured minutes until first response. NULL means unknown; zero is a measured zero.';
comment on column public.replies.specialist_role is
  'Internal generated discriminator for specialist membership integrity; never a form input.';
comment on table public.brand_memberships is
  'V1 assignments. Referenced assignments cannot be deleted; offboarding/history is a future migration.';

alter table public.people enable row level security;
alter table public.brands enable row level security;
alter table public.brand_memberships enable row level security;
alter table public.replies enable row level security;

-- Supabase defaults may grant API roles access to new public tables. Close those
-- grants explicitly; no permissive policies are introduced before P4.
revoke all privileges on table public.people, public.brands,
  public.brand_memberships, public.replies from public, anon, authenticated;
grant select, insert, update, delete on table public.people, public.brands,
  public.brand_memberships, public.replies to service_role;
