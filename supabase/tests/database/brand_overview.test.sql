begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- P8 brand evidence views. Brands A and B; s1 specialist in both; lead_ab leads
-- both; lead_b leads B only. Replies in two different weeks with a repeated issue.
insert into auth.users (id) values
  ('a1000000-0000-0000-0000-000000000001'), ('a1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000003');
insert into public.people (id, full_name, role) values
  ('a1000000-0000-0000-0000-000000000001', 's1', 'specialist'),
  ('a1000000-0000-0000-0000-000000000002', 'lead_ab', 'lead'),
  ('a1000000-0000-0000-0000-000000000003', 'lead_b', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('a2000000-0000-0000-0000-000000000001', 'overview-a', 'Overview A', 'Technical', 'Diagnose first.'),
  ('a2000000-0000-0000-0000-000000000002', 'overview-b', 'Overview B', 'Brief', 'Exact figures.');
insert into public.brand_memberships (person_id, brand_id) values
  ('a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002');
insert into public.replies (id, brand_id, specialist_id, customer_message, body, sent_at, external_id) values
  ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Q', 'A', date_trunc('week', now()) - interval '12 days', 'ov-1'),
  ('a3000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Q', 'A', date_trunc('week', now()) - interval '5 days', 'ov-2'),
  ('a3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Q', 'A', date_trunc('week', now()) - interval '4 days', 'ov-3'),
  ('a3000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Q', 'A', date_trunc('week', now()) - interval '4 days', 'ov-4');
insert into public.issue_tags (id, brand_id, code, label, severity) values
  ('a4000000-0000-0000-0000-000000000001', null, 'overview-history', 'History', 'major'),
  ('a4000000-0000-0000-0000-000000000002', null, 'overview-critical', 'Critical', 'critical');
insert into public.reviews (id, reply_id, reviewer_id, score, comment) values
  ('a5000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 2, 'w1'),
  ('a5000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 1, 'w2'),
  ('a5000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 4, 'w2 good'),
  ('a5000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 4, 'brand b');
insert into public.review_tags (review_id, tag_id) values
  ('a5000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000001'),
  ('a5000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000001'),
  ('a5000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000002'),
  ('a5000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000001');

select ok(not exists (
  select 1 from pg_class
  where oid in ('public.brand_weekly_scores'::regclass, 'public.brand_critical_reviews'::regclass, 'public.brand_issue_patterns'::regclass)
    and not coalesce(reloptions @> array['security_invoker=true'], false)
), 'Every evidence view runs with the caller''s rights');
select ok(not has_table_privilege('anon', 'public.brand_weekly_scores', 'SELECT')
  and not has_table_privilege('anon', 'public.brand_issue_patterns', 'SELECT')
  and not has_table_privilege('anon', 'public.brand_critical_reviews', 'SELECT'), 'Anonymous cannot read evidence');

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select results_eq($$
  select reviews, average_score, reviews_with_critical from public.brand_weekly_scores
  where brand_id = 'a2000000-0000-0000-0000-000000000001' order by week_start
$$, $$ values (1, 2.00::numeric, 0), (2, 2.50::numeric, 1) $$,
  'Weekly average per brand carries n and critical count; brand B is not mixed in');
select results_eq($$
  select occurrences, weeks from public.brand_issue_patterns
  where brand_id = 'a2000000-0000-0000-0000-000000000001' and tag_id = 'a4000000-0000-0000-0000-000000000001'
$$, $$ values (2, 2) $$, 'A repeated issue counts its distinct weeks');
select results_eq($$
  select reply_id::text from public.brand_critical_reviews where brand_id = 'a2000000-0000-0000-0000-000000000001'
$$, array['a3000000-0000-0000-0000-000000000002'], 'Critical reviews list the affected reply');
reset role;

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.brand_weekly_scores where brand_id = 'a2000000-0000-0000-0000-000000000001'), 0::bigint,
  'A lead of another brand gets no evidence for it');
select is((select count(*) from public.brand_issue_patterns), 1::bigint, 'Lead of B sees only B''s pattern');
reset role;

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.brand_weekly_scores) + (select count(*) from public.brand_issue_patterns)
  + (select count(*) from public.brand_critical_reviews), 0::bigint, 'Specialists get no brand evidence, not even their own');
reset role;

select * from finish();
rollback;
