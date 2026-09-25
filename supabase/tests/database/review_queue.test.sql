begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- P5 queue and coverage, exercised as real sessions. Transaction-only fixtures.
--   Brands A, B, C. s1 in A+B; s2 in B; s3 in B with no replies; s4 in C.
--   lead_ab leads A+B; lead_c leads C.
insert into auth.users (id) values
  ('71000000-0000-0000-0000-000000000001'), ('71000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000003'), ('71000000-0000-0000-0000-000000000004'),
  ('71000000-0000-0000-0000-000000000005'), ('71000000-0000-0000-0000-000000000006');
insert into public.people (id, full_name, role) values
  ('71000000-0000-0000-0000-000000000001', 's1', 'specialist'),
  ('71000000-0000-0000-0000-000000000002', 's2', 'specialist'),
  ('71000000-0000-0000-0000-000000000003', 's3', 'specialist'),
  ('71000000-0000-0000-0000-000000000004', 's4', 'specialist'),
  ('71000000-0000-0000-0000-000000000005', 'lead_ab', 'lead'),
  ('71000000-0000-0000-0000-000000000006', 'lead_c', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('72000000-0000-0000-0000-000000000001', 'queue-a', 'Queue A', 'Technical', 'Diagnose first.'),
  ('72000000-0000-0000-0000-000000000002', 'queue-b', 'Queue B', 'Brief', 'Exact figures.'),
  ('72000000-0000-0000-0000-000000000003', 'queue-c', 'Queue C', 'Warm', 'Replace.');
insert into public.brand_memberships (person_id, brand_id) values
  ('71000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001'),
  ('71000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000004', '72000000-0000-0000-0000-000000000003'),
  ('71000000-0000-0000-0000-000000000005', '72000000-0000-0000-0000-000000000001'),
  ('71000000-0000-0000-0000-000000000005', '72000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000006', '72000000-0000-0000-0000-000000000003');
insert into public.replies (id, brand_id, specialist_id, customer_message, body, sent_at, external_id) values
  ('73000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '5 days', 'q-1'),
  ('73000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '2 days', 'q-2'),
  ('73000000-0000-0000-0000-000000000003', '72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '3 days', 'q-3'),
  ('73000000-0000-0000-0000-000000000004', '72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'Q', 'A', now() - interval '6 days', 'q-4'),
  ('73000000-0000-0000-0000-000000000005', '72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'Q', 'A', now() - interval '4 days', 'q-5'),
  ('73000000-0000-0000-0000-000000000006', '72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'Q', 'A', now() - interval '20 days', 'q-6'),
  ('73000000-0000-0000-0000-000000000007', '72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000004', 'Q', 'A', now() - interval '1 day', 'q-7');
insert into public.reviews (reply_id, reviewer_id, score, comment, created_at, updated_at) values
  ('73000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000005', 3, 'A review', now() - interval '4 days', now() - interval '4 days'),
  ('73000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000005', 3, 'B review', now() - interval '1 day', now() - interval '1 day');

select ok((select reloptions @> array['security_invoker=true'] from pg_class where oid = 'public.review_queue'::regclass)
  and (select reloptions @> array['security_invoker=true'] from pg_class where oid = 'public.review_coverage'::regclass),
  'Queue views run with the caller''s rights');
select ok(not has_table_privilege('anon', 'public.review_queue', 'SELECT')
  and not has_table_privilege('anon', 'public.review_coverage', 'SELECT'), 'Anonymous cannot read queue views');

select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select results_eq($$
  select brand_name, specialist_name, days_since_review, waiting from public.review_coverage
  order by brand_name, last_reviewed_at asc nulls first, specialist_name
$$, $$ values
  ('Queue A', 's1', 4, 1),
  ('Queue B', 's1', null::integer, 1),
  ('Queue B', 's3', null::integer, 0),
  ('Queue B', 's2', 1, 1)
$$, 'Coverage is per brand: a review of s1 in A does not hide that s1 was never reviewed in B');
select results_eq($$
  select reply_id::text from public.review_queue
  order by brand_name, last_reviewed_at asc nulls first, specialist_name, sent_at
$$, array['73000000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000003', '73000000-0000-0000-0000-000000000005'],
  'Queue: unreviewed, last 14 days, longest-unreviewed specialist first within each brand');
select is((select count(*) from public.review_queue where reply_id = '73000000-0000-0000-0000-000000000006'), 0::bigint,
  'Replies older than 14 days leave the queue');
select is((select count(*) from public.review_queue where brand_id = '72000000-0000-0000-0000-000000000003'), 0::bigint,
  'Lead sees no queue from a brand they do not lead');
reset role;

select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
set local role authenticated;
select results_eq($$ select reply_id::text from public.review_queue $$, array['73000000-0000-0000-0000-000000000007'],
  'Another lead gets a different queue');
reset role;

select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.review_queue), 0::bigint, 'Specialists get an empty queue from the database');
select is((select count(*) from public.review_coverage), 0::bigint, 'Specialists cannot read coverage of colleagues or themselves');
reset role;

select * from finish();
rollback;
