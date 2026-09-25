begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- P6 atomic review submission. Brands A and B; s1 specialist in A; lead_a leads A;
-- lead_b leads B. Transaction-only fixtures.
insert into auth.users (id) values
  ('81000000-0000-0000-0000-000000000001'), ('81000000-0000-0000-0000-000000000002'),
  ('81000000-0000-0000-0000-000000000003');
insert into public.people (id, full_name, role) values
  ('81000000-0000-0000-0000-000000000001', 's1', 'specialist'),
  ('81000000-0000-0000-0000-000000000002', 'lead_a', 'lead'),
  ('81000000-0000-0000-0000-000000000003', 'lead_b', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('82000000-0000-0000-0000-000000000001', 'submit-a', 'A', 'Technical', 'Diagnose first.'),
  ('82000000-0000-0000-0000-000000000002', 'submit-b', 'B', 'Brief', 'Exact figures.');
insert into public.brand_memberships (person_id, brand_id) values
  ('81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001'),
  ('81000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001'),
  ('81000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000002');
insert into public.replies (id, brand_id, specialist_id, customer_message, body, sent_at, external_id) values
  ('83000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '1 day', 'sub-1'),
  ('83000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '1 day', 'sub-2');
insert into public.issue_tags (id, brand_id, code, label, severity) values
  ('84000000-0000-0000-0000-000000000001', null, 'submit-global', 'Global', 'major'),
  ('84000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', 'submit-a', 'Brand A', 'critical'),
  ('84000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000002', 'submit-b', 'Brand B', 'minor');

select is((select prosecdef from pg_proc where oid = 'public.submit_review(uuid, smallint, text, boolean, uuid[])'::regprocedure),
  false, 'submit_review runs with the caller''s rights, so RLS applies');
select ok(not has_function_privilege('anon', 'public.submit_review(uuid, smallint, text, boolean, uuid[])', 'EXECUTE'),
  'Anonymous cannot call submit_review');
select ok(not exists (select 1 from information_schema.parameters
  where specific_schema = 'public' and specific_name like 'submit_review%' and parameter_name ilike '%reviewer%'),
  'There is no reviewer parameter to spoof');

select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000001', 2::smallint, 'Mixed tags',
    false, array['84000000-0000-0000-0000-000000000001', '84000000-0000-0000-0000-000000000003']::uuid[])
$$, '23514', null, 'A tag from another brand rejects the whole submission');
select is((select count(*) from public.reviews where reply_id = '83000000-0000-0000-0000-000000000001'), 0::bigint,
  'No partial review survives a rejected tag');

select lives_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000001', 2::smallint, '  Check the order history first.  ',
    true, array['84000000-0000-0000-0000-000000000001', '84000000-0000-0000-0000-000000000002', '84000000-0000-0000-0000-000000000002']::uuid[])
$$, 'Lead submits a review with global and brand tags');
select results_eq($$
  select reviewer_id::text, score, comment, is_example from public.reviews where reply_id = '83000000-0000-0000-0000-000000000001'
$$, $$ values ('81000000-0000-0000-0000-000000000002', 2::smallint, 'Check the order history first.', true) $$,
  'Reviewer comes from the session; comment is trimmed');
select is((select count(*) from public.review_tags rt join public.reviews r on r.id = rt.review_id
  where r.reply_id = '83000000-0000-0000-0000-000000000001'), 2::bigint, 'Tags saved once each, duplicates ignored');

select throws_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000001', 3::smallint, 'Again', false, '{}')
$$, '23505', null, 'A reply cannot be reviewed twice');
select throws_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000002', 5::smallint, 'Too high', false, '{}')
$$, '23514', null, 'Scores outside 1–4 are rejected');
select throws_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000002', 3::smallint, '   ', false, '{}')
$$, '23514', null, 'A blank comment is rejected');
reset role;

select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000002', 3::smallint, 'Not my brand', false, '{}')
$$, null, null, 'A lead of another brand cannot submit');
reset role;

select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$
  select public.submit_review('83000000-0000-0000-0000-000000000002', 4::smallint, 'Self review', false, '{}')
$$, null, null, 'A specialist cannot submit a review');
reset role;

select is((select count(*) from public.reviews where reply_id = '83000000-0000-0000-0000-000000000002'), 0::bigint,
  'Rejected submissions leave no review behind');

select * from finish();
rollback;
