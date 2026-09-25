begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- P4 policies, exercised as real sessions (auth.uid() from request.jwt.claims).
-- Transaction-only fixtures, isolated from the demo seed by their ids.
--   Brands: A (scooters), B (packaging), C (coffee).
--   s1 specialist in A+B; s2 specialist in B; s3 specialist in C.
--   lead_ab leads A+B; lead_b leads B only; lead_c leads C.
insert into auth.users (id) values
  ('61000000-0000-0000-0000-000000000001'), ('61000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000003'), ('61000000-0000-0000-0000-000000000004'),
  ('61000000-0000-0000-0000-000000000005'), ('61000000-0000-0000-0000-000000000006');
insert into public.people (id, full_name, role) values
  ('61000000-0000-0000-0000-000000000001', 's1', 'specialist'),
  ('61000000-0000-0000-0000-000000000002', 's2', 'specialist'),
  ('61000000-0000-0000-0000-000000000003', 's3', 'specialist'),
  ('61000000-0000-0000-0000-000000000004', 'lead_ab', 'lead'),
  ('61000000-0000-0000-0000-000000000005', 'lead_b', 'lead'),
  ('61000000-0000-0000-0000-000000000006', 'lead_c', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('62000000-0000-0000-0000-000000000001', 'authz-a', 'A', 'Technical', 'Diagnose first.'),
  ('62000000-0000-0000-0000-000000000002', 'authz-b', 'B', 'Brief', 'Exact figures.'),
  ('62000000-0000-0000-0000-000000000003', 'authz-c', 'C', 'Warm', 'Replace, do not return.');
insert into public.brand_memberships (person_id, brand_id) values
  ('61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001'),
  ('61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000003'),
  ('61000000-0000-0000-0000-000000000004', '62000000-0000-0000-0000-000000000001'),
  ('61000000-0000-0000-0000-000000000004', '62000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000005', '62000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000006', '62000000-0000-0000-0000-000000000003');
insert into public.replies (id, brand_id, specialist_id, customer_message, body, sent_at, external_id) values
  ('63000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '3 days', 'authz-1'),
  ('63000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '3 days', 'authz-2'),
  ('63000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'Q', 'A', now() - interval '3 days', 'authz-3'),
  ('63000000-0000-0000-0000-000000000004', '62000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000003', 'Q', 'A', now() - interval '3 days', 'authz-4'),
  ('63000000-0000-0000-0000-000000000005', '62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'Q', 'A', now() - interval '1 day', 'authz-5');
insert into public.issue_tags (id, brand_id, code, label, severity) values
  ('64000000-0000-0000-0000-000000000001', null, 'authz-global', 'Global', 'major'),
  ('64000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000001', 'authz-a', 'Brand A', 'critical'),
  ('64000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000003', 'authz-c', 'Brand C', 'minor');
insert into public.reviews (id, reply_id, reviewer_id, score, comment) values
  ('65000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000004', 2, 'r1'),
  ('65000000-0000-0000-0000-000000000003', '63000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000004', 3, 'r3'),
  ('65000000-0000-0000-0000-000000000004', '63000000-0000-0000-0000-000000000004', '61000000-0000-0000-0000-000000000006', 4, 'r4');
insert into public.review_tags (review_id, tag_id) values
  ('65000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000002'),
  ('65000000-0000-0000-0000-000000000003', '64000000-0000-0000-0000-000000000001'),
  ('65000000-0000-0000-0000-000000000004', '64000000-0000-0000-0000-000000000003');
insert into public.brand_changes (brand_id, author_id, happened_on, note) values
  ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000004', current_date, 'A change'),
  ('62000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000006', current_date, 'C change');

select has_function('private', 'is_brand_member', array['uuid'], 'Membership helper exists');
select is((select prosecdef from pg_proc where oid = 'private.is_brand_lead(uuid)'::regprocedure), true,
  'Lead helper runs as definer to avoid policy recursion');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'private.is_brand_lead(uuid)'::regprocedure)
  and (select proconfig @> array['search_path=""'] from pg_proc where oid = 'private.is_brand_member(uuid)'::regprocedure)
  and (select proconfig @> array['search_path=""'] from pg_proc where oid = 'private.shares_brand_with(uuid)'::regprocedure),
  'Security-definer helpers pin an empty search_path');
select ok(not has_function_privilege('anon', 'private.is_brand_lead(uuid)', 'EXECUTE'), 'Anonymous cannot call helpers');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and cmd in ('INSERT', 'UPDATE', 'ALL') and with_check is null),
  'Every insert/update policy has WITH CHECK');

-- s1: specialist in A and B.
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select set_eq($$ select slug from public.brands $$, array['authz-a', 'authz-b'], 'Specialist sees only assigned brands');
select set_eq($$ select id::text from public.replies $$,
  array['63000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000002', '63000000-0000-0000-0000-000000000005'],
  'Specialist sees only own replies');
select is((select count(*) from public.replies where id = '63000000-0000-0000-0000-000000000003'), 0::bigint,
  'Specialist cannot read a colleague''s reply in a shared brand');
select set_eq($$ select id::text from public.reviews $$, array['65000000-0000-0000-0000-000000000001'],
  'Specialist sees reviews of own replies only');
select set_eq($$ select tag_id::text from public.review_tags $$, array['64000000-0000-0000-0000-000000000002'],
  'Specialist sees tags of own reviews only');
select set_eq($$ select code from public.issue_tags where id::text like '64000000-%' $$, array['authz-global', 'authz-a'],
  'Specialist sees global criteria and those of assigned brands');
select is((select count(*) from public.brand_changes), 0::bigint, 'Brand interventions are lead-only');
select set_eq($$ select full_name from public.people $$, array['s1', 's2', 'lead_ab', 'lead_b'],
  'People are visible only when sharing a brand');
select set_eq($$ select brand_id::text from public.brand_memberships $$,
  array['62000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000002'],
  'Specialist sees only own assignments');
select throws_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('63000000-0000-0000-0000-000000000005', '61000000-0000-0000-0000-000000000001', 4, 'Self-review');
$$, null, null, 'Specialist cannot insert a review (integrity trigger and RLS both deny)');
select throws_ok($$ update public.replies set body = 'Rewritten' $$, '42501', null, 'Specialist cannot edit sent replies');
select throws_ok($$ insert into public.review_tags values ('65000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'Specialist cannot tag own review');
reset role;

-- lead_ab: lead of A and B.
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select set_eq($$ select id::text from public.replies $$,
  array['63000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000002',
        '63000000-0000-0000-0000-000000000003', '63000000-0000-0000-0000-000000000005'],
  'Lead sees every specialist''s replies in own brands, none from others');
select is((select count(*) from public.reviews where id = '65000000-0000-0000-0000-000000000004'), 0::bigint,
  'Lead cannot read another lead''s brand reviews');
select is((select count(*) from public.brand_changes), 1::bigint, 'Lead sees interventions of own brands only');
-- lead_b is a valid reviewer for brand B, so only RLS can reject this.
select throws_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('63000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000005', 1, 'Signed as lead_b');
$$, '42501', null, 'reviewer_id must equal auth.uid(), even naming a valid co-lead');
select lives_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('63000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000004', 3, 'Own brand');
$$, 'Lead reviews a reply in own brand as themself');
select throws_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('63000000-0000-0000-0000-000000000004', '61000000-0000-0000-0000-000000000004', 1, 'Other brand');
$$, null, null, 'Lead cannot review another brand');
select results_eq($$ update public.reviews set score = 4 where id = '65000000-0000-0000-0000-000000000003' returning score $$,
  $$ values (4::smallint) $$, 'Lead edits own review');
select throws_ok($$ update public.reviews set reviewer_id = '61000000-0000-0000-0000-000000000005' $$,
  '42501', null, 'Review authorship cannot be reassigned');
select throws_ok($$ delete from public.reviews where id = '65000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'Reviews cannot be deleted through the API');
select lives_ok($$ insert into public.review_tags values ('65000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001') $$,
  'Lead tags own review with a global criterion');
select throws_ok($$ insert into public.review_tags values ('65000000-0000-0000-0000-000000000003', '64000000-0000-0000-0000-000000000003') $$,
  '23514', null, 'Another brand''s criterion is rejected on own review');
select lives_ok($$ delete from public.review_tags where review_id = '65000000-0000-0000-0000-000000000001' and tag_id = '64000000-0000-0000-0000-000000000001' $$,
  'Lead removes a tag from own review');
select throws_ok($$
  insert into public.brand_changes (brand_id, author_id, happened_on, note)
  values ('62000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000004', current_date, 'Not mine');
$$, null, null, 'Lead cannot log interventions for another brand');
select lives_ok($$
  insert into public.brand_changes (brand_id, author_id, happened_on, note)
  values ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000004', current_date, 'Mine');
$$, 'Lead logs an intervention for own brand');
reset role;

-- lead_b: shares brand B with lead_ab but did not write lead_ab's review.
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.reviews where id = '65000000-0000-0000-0000-000000000003'), 1::bigint,
  'Co-lead can read reviews in shared brand');
select is_empty($$ update public.reviews set score = 1 where id = '65000000-0000-0000-0000-000000000003' returning id $$,
  'Co-lead cannot edit another lead''s review');
select throws_ok($$ insert into public.review_tags values ('65000000-0000-0000-0000-000000000003', '64000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'Co-lead cannot tag another lead''s review');
select is((select count(*) from public.replies where brand_id = '62000000-0000-0000-0000-000000000001'), 0::bigint,
  'Global lead role grants nothing in a brand without membership');
reset role;

-- A lead removed from a brand loses access immediately, reviews persist.
delete from public.brand_memberships
  where person_id = '61000000-0000-0000-0000-000000000006' and brand_id = '62000000-0000-0000-0000-000000000003';
select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.replies), 0::bigint, 'Removed lead no longer reads the brand');
select is_empty($$ update public.reviews set score = 1 returning id $$, 'Removed lead cannot edit former reviews');
reset role;

select * from finish();
rollback;
