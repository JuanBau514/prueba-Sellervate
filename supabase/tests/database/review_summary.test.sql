begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- P7 feedback: a specialist reads only their own reviews and summary, via RLS.
-- Brand A: s1 and s2 (same brand), lead_a. Brand B: lead_b.
insert into auth.users (id) values
  ('91000000-0000-0000-0000-000000000001'), ('91000000-0000-0000-0000-000000000002'),
  ('91000000-0000-0000-0000-000000000003'), ('91000000-0000-0000-0000-000000000004');
insert into public.people (id, full_name, role) values
  ('91000000-0000-0000-0000-000000000001', 's1', 'specialist'),
  ('91000000-0000-0000-0000-000000000002', 's2', 'specialist'),
  ('91000000-0000-0000-0000-000000000003', 'lead_a', 'lead'),
  ('91000000-0000-0000-0000-000000000004', 'lead_b', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('92000000-0000-0000-0000-000000000001', 'summary-a', 'Summary A', 'Technical', 'Diagnose first.'),
  ('92000000-0000-0000-0000-000000000002', 'summary-b', 'Summary B', 'Brief', 'Exact figures.');
insert into public.brand_memberships (person_id, brand_id) values
  ('91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001'),
  ('91000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000001'),
  ('91000000-0000-0000-0000-000000000003', '92000000-0000-0000-0000-000000000001'),
  ('91000000-0000-0000-0000-000000000004', '92000000-0000-0000-0000-000000000002');
insert into public.replies (id, brand_id, specialist_id, customer_message, body, sent_at, external_id) values
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '3 days', 'sum-1'),
  ('93000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '2 days', 'sum-2'),
  ('93000000-0000-0000-0000-000000000003', '92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000002', 'Q', 'A', now() - interval '2 days', 'sum-3');
insert into public.issue_tags (id, brand_id, code, label, severity) values
  ('94000000-0000-0000-0000-000000000001', null, 'summary-critical', 'Critical', 'critical'),
  ('94000000-0000-0000-0000-000000000002', null, 'summary-major', 'Major', 'major'),
  ('94000000-0000-0000-0000-000000000003', null, 'summary-minor', 'Minor', 'minor');
insert into public.reviews (id, reply_id, reviewer_id, score, comment) values
  ('95000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000003', 1, 'Three tags'),
  ('95000000-0000-0000-0000-000000000002', '93000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000003', 4, 'No tags'),
  ('95000000-0000-0000-0000-000000000003', '93000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000003', 2, 'Peer');
insert into public.review_tags (review_id, tag_id) values
  ('95000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000001'),
  ('95000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000002'),
  ('95000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000003');

select ok((select reloptions @> array['security_invoker=true'] from pg_class where oid = 'public.review_summary'::regclass),
  'Summary view runs with the caller''s rights');
select ok(not has_table_privilege('anon', 'public.review_summary', 'SELECT'), 'Anonymous cannot read summaries');

select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select results_eq($$ select reviews, average_score, reviews_with_critical from public.review_summary $$,
  $$ values (2, 2.50::numeric, 1) $$,
  'Specialist summary: n = 2, average not inflated by a review with three tags, one critical');
select set_eq($$ select comment from public.reviews $$, array['Three tags', 'No tags'],
  'Specialist reads own reviews only, not a same-brand colleague''s');
reset role;

select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.review_summary), 2::bigint, 'Lead sees one summary row per specialist in the brand');
reset role;

select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.review_summary), 0::bigint, 'Lead of another brand sees no summary');
reset role;

select * from finish();
rollback;
