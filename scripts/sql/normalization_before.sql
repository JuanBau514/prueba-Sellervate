-- Run against the original P1 schema, followed by the normalization migration
-- and normalization_after.sql in the SAME psql session. Everything is rolled back.
begin;
insert into auth.users (id) values ('90000000-0000-0000-0000-000000000001');
insert into public.people (id, full_name, role)
values ('90000000-0000-0000-0000-000000000001', 'Upgrade fixture', 'specialist');
insert into public.brands (id, slug, name, voice_summary, procedures_md)
values ('90000000-0000-0000-0000-000000000002', 'normalization-fixture', 'Upgrade brand', 'Precise', 'Check the order.');
insert into public.brand_memberships (person_id, brand_id, role)
values ('90000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', 'specialist');
insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, external_id)
values ('90000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001',
  'Has my order shipped?', 'Your order is awaiting dispatch.', now() - interval '1 day', 'upgrade-message');

create temporary table p1_upgrade_before as
select 'people' as entity, jsonb_agg(to_jsonb(p) order by id) as rows from public.people p
union all select 'brands', jsonb_agg(to_jsonb(b) order by id) from public.brands b
union all select 'memberships', jsonb_agg(to_jsonb(m) - 'role' order by person_id, brand_id) from public.brand_memberships m
union all select 'replies', jsonb_agg(to_jsonb(r) - 'specialist_role' order by id) from public.replies r;
