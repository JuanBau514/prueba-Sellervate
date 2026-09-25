begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Transaction-only fixtures: no passwords, login sessions or persistent demo data.
insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003');
insert into public.people (id, full_name, role) values
  ('10000000-0000-0000-0000-000000000001', 'Test specialist', 'specialist'),
  ('10000000-0000-0000-0000-000000000002', 'Other specialist', 'specialist'),
  ('10000000-0000-0000-0000-000000000003', 'Test lead', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('20000000-0000-0000-0000-000000000001', 'test-scooters', 'Test Scooters', 'Technical and calm', 'Diagnose before offering a return.'),
  ('20000000-0000-0000-0000-000000000002', 'test-packaging', 'Test Packaging', 'Brief and exact', 'Confirm dimensions and pack quantity.');
insert into public.brand_memberships (person_id, brand_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001');

select lives_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, first_response_minutes, external_id)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
    'My scooter will not charge.', 'Please check the charger indicator and tell us its color.', now() - interval '1 day', 0, 'message-1');
$$, 'An assigned specialist can have a reply; measured zero is valid');

select throws_ok($$
  insert into public.people (id, full_name, role)
  values ('10000000-0000-0000-0000-000000000099', 'Missing identity', 'specialist');
$$, '23503', null, 'A profile must reference an existing Auth identity');

select throws_ok($$
  update public.people set role = 'admin' where id = '10000000-0000-0000-0000-000000000001';
$$, '23514', null, 'Unknown roles are rejected');

select throws_ok($$
  insert into public.brand_memberships (person_id, brand_id)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
$$, '23505', null, 'Assignments cannot be duplicated');

select throws_ok($$
  insert into public.brand_memberships (person_id, brand_id)
  values ('10000000-0000-0000-0000-000000000099', '20000000-0000-0000-0000-000000000001');
$$, '23503', null, 'Membership must reference an existing person');

select throws_ok($$
  update public.replies set specialist_id = '10000000-0000-0000-0000-000000000003';
$$, '23514', null, 'A lead membership cannot be used as a reply author');

select throws_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, external_id)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
    'Help', 'A lead cannot author this reply.', now(), 'lead-reply');
$$, '23514', null, 'Lead authors are rejected on INSERT as well as UPDATE');

select throws_ok($$
  update public.replies set specialist_id = '10000000-0000-0000-0000-000000000099';
$$, '23503', null, 'A missing reply author is rejected');

select lives_ok($$
  update public.people set full_name = 'Renamed specialist', role = role
  where id = '10000000-0000-0000-0000-000000000001';
$$, 'Profile name edits and unchanged role values remain valid');

select throws_ok($$
  update public.replies set specialist_id = '10000000-0000-0000-0000-000000000002',
    brand_id = '20000000-0000-0000-0000-000000000002';
$$, '23514', null, 'P2 also rejects moving an existing reply to another brand');

select throws_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, source, external_id)
  select brand_id, specialist_id, customer_message, body, sent_at, source, external_id from public.replies;
$$, '23505', null, 'Repeated imports cannot duplicate the same reply');

select lives_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, external_id)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
    'How many boxes are in a pack?', 'Each pack contains 50 boxes.', now() - interval '1 day', 'message-1');
$$, 'Another brand may use the same external reply identifier; unknown timing stays NULL');

select throws_ok($$
  update public.replies set specialist_id = '10000000-0000-0000-0000-000000000002'
  where brand_id = '20000000-0000-0000-0000-000000000002';
$$, '23503', null, 'A specialist from another brand cannot be assigned to the reply');

select lives_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, source, external_id)
  select brand_id, specialist_id, customer_message, body, sent_at, 'helpdesk', external_id
  from public.replies where brand_id = '20000000-0000-0000-0000-000000000001';
$$, 'Another source may reuse an identifier within the same brand');

select lives_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, source, external_id)
  select brand_id, specialist_id, customer_message, body, sent_at, source, external_id from public.replies
  on conflict (brand_id, source, external_id) do nothing;
$$, 'The identity constraint supports idempotent import conflict handling');
select is((select count(*) from public.replies), 3::bigint, 'Idempotent imports preserve the reply count');

select throws_ok($$ update public.replies set first_response_minutes = -1; $$,
  '23514', null, 'Negative response times are rejected');
select throws_ok($$ update public.replies set sent_at = null; $$,
  '23502', null, 'Already-sent replies require a send timestamp');
select throws_ok($$ update public.replies set external_id = null; $$,
  '23502', null, 'Missing import identifiers cannot bypass deduplication');
select throws_ok($$ update public.replies set body = '   '; $$,
  '23514', null, 'An empty reply is rejected');
select throws_ok($$ update public.brands set slug = 'Not a URL slug'; $$,
  '23514', null, 'Brand slugs are normalized URL segments');
select throws_ok($$ update public.brands set slug = 'test-scooters' where slug = 'test-packaging'; $$,
  '23505', null, 'Brand slugs are unique');

select throws_ok($$
  delete from public.brand_memberships where person_id = '10000000-0000-0000-0000-000000000001';
$$, '23503', null, 'Deleting an assignment cannot orphan or cascade-delete its replies');
select throws_ok($$ delete from public.brands where slug = 'test-scooters'; $$,
  '23503', null, 'Deleting a brand cannot erase its history');
select throws_ok($$
  delete from auth.users where id = '10000000-0000-0000-0000-000000000001';
$$, '23503', null, 'Deleting an Auth identity cannot erase the author and their history');
select throws_ok($$
  update public.people set role = 'lead' where id = '10000000-0000-0000-0000-000000000001';
$$, '23514', null, 'Later role changes cannot invalidate historical replies');

select throws_ok($$
  update public.people set role = 'lead' where id = '10000000-0000-0000-0000-000000000002';
$$, '23514', null, 'V1 role immutability applies even before the first reply');

select hasnt_column('public', 'brand_memberships', 'role', 'Membership does not duplicate the person role');
select hasnt_column('public', 'replies', 'specialist_role', 'Replies do not store a constant role');
select ok(not exists (
  select 1 from (values ('anon'), ('authenticated'), ('service_role')) as roles(name)
  cross join (values ('private.check_reply_specialist()'), ('private.prevent_person_role_change()')) as funcs(name)
  where has_function_privilege(roles.name, funcs.name, 'EXECUTE')
), 'Internal trigger functions are not directly executable by API roles');

-- Verify both protections independently: table privileges and RLS. P4 must
-- replace this baseline with positive/negative tests for its actual policies.
select is((
  select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('people', 'brands', 'brand_memberships', 'replies')
    and c.relrowsecurity
), 4::bigint, 'All four tables enable RLS');
select is((
  select count(*) from pg_policies
  where schemaname = 'public' and tablename in ('people', 'brands', 'brand_memberships', 'replies')
), 0::bigint, 'P1 introduces no permissive policies before P4');
select ok(not exists (
  select 1 from (values ('anon'), ('authenticated')) as roles(name)
  cross join (values ('people'), ('brands'), ('brand_memberships'), ('replies')) as tables(name)
  where has_table_privilege(roles.name, 'public.' || tables.name,
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
), 'API roles have no application table privileges yet');

-- The seed uses service_role; author integrity must survive its RLS bypass.
set local role service_role;
select lives_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, external_id)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
    'Does the charger need replacing?', 'Please confirm whether the indicator lights up.', now(), 'service-fixture');
$$, 'The seed service role can ingest a valid specialist reply');
select throws_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, external_id)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003',
    'Help', 'A lead cannot author this reply.', now(), 'invalid-service-fixture');
$$, '23514', null, 'The service role bypasses RLS but cannot bypass author integrity');
reset role;
delete from public.replies where brand_id = '20000000-0000-0000-0000-000000000001'
  and source = 'seed' and external_id = 'service-fixture';

-- Grant only inside this rolled-back transaction to prove that RLS itself
-- denies access even if table privileges were accidentally reintroduced.
grant select, insert, update, delete on public.people, public.brands,
  public.brand_memberships, public.replies to anon, authenticated;

set local role anon;
select is((select count(*) from public.people), 0::bigint, 'Anonymous cannot read profiles');
select is((select count(*) from public.brands), 0::bigint, 'Anonymous cannot read brands');
select is((select count(*) from public.brand_memberships), 0::bigint, 'Anonymous cannot read assignments');
select is((select count(*) from public.replies), 0::bigint, 'Anonymous cannot read replies');
select throws_ok($$
  insert into public.brands (slug, name, voice_summary, procedures_md)
  values ('forbidden', 'Forbidden', 'Short', 'Check the order.');
$$, '42501', null, 'RLS rejects anonymous writes even with an INSERT grant');
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select is((select count(*) from public.people), 0::bigint, 'Authenticated cannot read profiles before P4');
select is((select count(*) from public.brands), 0::bigint, 'Authenticated cannot read brands before P4');
select is((select count(*) from public.brand_memberships), 0::bigint, 'Authenticated cannot read assignments before P4');
select is((select count(*) from public.replies), 0::bigint, 'Authenticated cannot read even their own replies before P4');
select throws_ok($$
  insert into public.replies (brand_id, specialist_id, customer_message, body, sent_at, external_id)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
    'Help', 'Please describe the problem.', now(), 'forbidden');
$$, '42501', null, 'RLS rejects authenticated writes even for a valid membership');
select results_eq($$ update public.replies set body = 'Changed' returning id $$,
  $$ select null::uuid where false $$, 'RLS hides rows from authenticated updates');
select results_eq($$ delete from public.replies returning id $$,
  $$ select null::uuid where false $$, 'RLS hides rows from authenticated deletes');
reset role;

select is((select count(*) from public.replies), 3::bigint, 'Denied deletes preserve all replies');
select * from finish();
rollback;
