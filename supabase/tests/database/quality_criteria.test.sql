begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Isolated fixtures, not a demo seed. All changes and grants roll back.
insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003');
insert into public.people (id, full_name, role) values
  ('10000000-0000-0000-0000-000000000001', 'Specialist', 'specialist'),
  ('10000000-0000-0000-0000-000000000002', 'Scooter lead', 'lead'),
  ('10000000-0000-0000-0000-000000000003', 'Packaging lead', 'lead');
insert into public.brands (id, slug, name, voice_summary, procedures_md) values
  ('20000000-0000-0000-0000-000000000001', 'scooters', 'Scooters', 'Technical', 'Diagnose first.'),
  ('20000000-0000-0000-0000-000000000002', 'packaging', 'Packaging', 'Brief', 'Confirm quantities.');
insert into public.brand_memberships (person_id, brand_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002');
insert into public.replies (id, brand_id, specialist_id, customer_message, body, sent_at, external_id) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Will not charge', 'Return it.', now() - interval '1 day', 'one'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Pack size?', '50 boxes.', now() - interval '1 day', 'two'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Charger light?', 'Is the light red?', now(), 'three');

select lives_ok($$
  insert into public.issue_tags (id, brand_id, code, label, severity) values
    ('40000000-0000-0000-0000-000000000001', null, 'incorrect-info', 'Incorrect product information', 'critical'),
    ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'missed-check', 'Skipped diagnosis', 'major'),
    ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'missed-check', 'Missing quantity', 'minor');
$$, 'Global and brand criteria support all severities and reuse codes across brands');
select throws_ok($$ insert into public.issue_tags (code, label, severity) values ('incorrect-info', 'Duplicate', 'critical'); $$,
  '23505', null, 'NULL global scope still enforces unique codes');
select throws_ok($$
  insert into public.issue_tags (brand_id, code, label, severity)
  values ('20000000-0000-0000-0000-000000000001', 'missed-check', 'Duplicate', 'minor');
$$, '23505', null, 'A brand cannot duplicate its criterion code');
select throws_ok($$ insert into public.issue_tags (code, label, severity) values ('new', 'New', 'urgent'); $$,
  '23514', null, 'Severity accepts only the three declared levels');
select throws_ok($$ insert into public.issue_tags (code, label, severity) values ('Bad code', 'New', 'minor'); $$,
  '23514', null, 'Criterion codes are normalized');
select throws_ok($$ update public.issue_tags set label = ' '; $$,
  '23514', null, 'Labels cannot be blank');

set local role service_role;
select lives_ok($$
  insert into public.reviews (id, reply_id, reviewer_id, score, comment, created_at, updated_at) values
    ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Diagnose before offering a return.', now() - interval '1 day', now() - interval '1 day'),
    ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 4, 'Brief and accurate.', now() - interval '1 day', now() - interval '1 day');
$$, 'Service seed can record reviews by assigned leads, including scores 1 and 4');
select throws_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3, 'Self review');
$$, '23514', null, 'Even service_role cannot record a specialist as reviewer');
select throws_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 3, 'Foreign review');
$$, '23503', null, 'Lead role alone does not authorize authorship for another brand');
select lives_ok($$
  insert into public.review_tags (review_id, tag_id) values
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'),
    ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001');
$$, 'Reviews accept global and matching-brand tags');
select throws_ok($$
  insert into public.review_tags values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003');
$$, '23514', null, 'Foreign-brand tags are rejected even with RLS bypass');
reset role;

select throws_ok($$
  insert into public.reviews (reply_id, reviewer_id, score, comment)
  values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 2, 'Duplicate review');
$$, '23505', null, 'V1 permits only one review per reply');
select throws_ok($$ update public.reviews set score = 0; $$, '23514', null, 'Score zero is rejected');
select throws_ok($$ update public.reviews set score = 5; $$, '23514', null, 'Score five is rejected');
select throws_ok($$ update public.reviews set comment = ' '; $$, '23514', null, 'Feedback must include a nonblank comment');
select is((select bool_or(is_example) from public.reviews), false, 'Reviews are not examples by default');
select lives_ok($$ update public.reviews set score = 3, comment = 'Edited feedback', is_example = true; $$,
  'Current feedback and example marker can be edited');
select ok((select bool_and(updated_at > created_at) from public.reviews), 'Review edits advance updated_at automatically');
select throws_ok($$ update public.reviews set reply_id = '30000000-0000-0000-0000-000000000003'; $$,
  '23514', null, 'Reviews cannot move to another reply');
select throws_ok($$ update public.reviews set reviewer_id = '10000000-0000-0000-0000-000000000001'; $$,
  '23514', null, 'Reviewer attribution cannot be rewritten');
select throws_ok($$ update public.reviews set created_at = now(); $$,
  '23514', null, 'Original review date cannot be rewritten');
select throws_ok($$ update public.replies set brand_id = '20000000-0000-0000-0000-000000000002'; $$,
  '23514', null, 'Even a multi-brand specialist reply cannot change tenant');
select throws_ok($$ update public.issue_tags set brand_id = '20000000-0000-0000-0000-000000000002' where brand_id is null; $$,
  '23514', null, 'Changing global scope cannot invalidate historical associations');
select throws_ok($$ update public.issue_tags set severity = 'minor' where severity = 'critical'; $$,
  '23514', null, 'Severity cannot silently reclassify historical critical issues');
select throws_ok($$ update public.issue_tags set code = 'renamed'; $$,
  '23514', null, 'Criterion code is stable');
select lives_ok($$ update public.issue_tags set label = label || ' (clarified)'; $$,
  'Labels may receive wording corrections');
select throws_ok($$
  update public.review_tags set tag_id = '40000000-0000-0000-0000-000000000003'
  where review_id = '50000000-0000-0000-0000-000000000001';
$$, '23514', null, 'Tag scope is rechecked on update');
select throws_ok($$
  update public.review_tags set review_id = '50000000-0000-0000-0000-000000000002'
  where tag_id = '40000000-0000-0000-0000-000000000002';
$$, '23514', null, 'Changing the association review also rechecks scope');
select throws_ok($$ insert into public.review_tags select * from public.review_tags limit 1; $$,
  '23505', null, 'A review cannot repeat the same tag');
select throws_ok($$ insert into public.review_tags values ('50000000-0000-0000-0000-000000000099', '40000000-0000-0000-0000-000000000001'); $$,
  '23503', null, 'Association requires an existing review');
select throws_ok($$ insert into public.review_tags values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000099'); $$,
  '23503', null, 'Association requires an existing tag');
select throws_ok($$ delete from public.replies where id = '30000000-0000-0000-0000-000000000001'; $$,
  '23503', null, 'Deleting a reply cannot erase its review');
select throws_ok($$ delete from public.issue_tags where id = '40000000-0000-0000-0000-000000000001'; $$,
  '23503', null, 'Used criteria cannot be deleted');

select lives_ok($$
  insert into public.brand_changes (brand_id, author_id, happened_on, note)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', current_date, 'Clarified charger diagnosis.');
$$, 'Assigned leads can record dated brand interventions');
select throws_ok($$
  insert into public.brand_changes (brand_id, author_id, happened_on, note)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', current_date, 'Wrong brand');
$$, '23503', null, 'Brand change authors must belong to the brand');
select throws_ok($$ update public.brand_changes set note = ' '; $$,
  '23514', null, 'Brand change notes cannot be blank');
select throws_ok($$ update public.brand_changes set author_id = '10000000-0000-0000-0000-000000000003'; $$,
  '23514', null, 'Brand change authorship is fixed');
select lives_ok($$ delete from public.brand_memberships where person_id = '10000000-0000-0000-0000-000000000002'; $$,
  'Later lead reassignment does not erase historical reviews or interventions');
select is((select count(*) from public.reviews), 2::bigint, 'Historical reviews survive membership removal');

select hasnt_column('public', 'reviews', 'brand_id', 'Review brand is derived, not duplicated');
select hasnt_column('public', 'review_tags', 'severity', 'Severity lives only in the criterion catalog');
select hasnt_column('public', 'review_tags', 'brand_id', 'Join table does not duplicate tag/reply scope');
select is((select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('issue_tags', 'reviews', 'review_tags', 'brand_changes') and c.relrowsecurity),
  4::bigint, 'All P2 tables enable RLS');
select is((select count(*) from pg_policies where schemaname = 'public'
  and tablename in ('issue_tags', 'reviews', 'review_tags', 'brand_changes')),
  0::bigint, 'No access policies are opened before P4');
select ok(not exists (
  select 1 from (values ('anon'), ('authenticated')) as roles(name)
  cross join (values ('issue_tags'), ('reviews'), ('review_tags'), ('brand_changes')) as tables(name)
  where has_table_privilege(roles.name, 'public.' || tables.name, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
), 'API roles have no P2 table privileges');
select ok(not exists (
  select 1 from (values ('anon'), ('authenticated'), ('service_role')) as roles(name)
  cross join (values ('private.keep_quality_identity()'), ('private.check_quality_lead()'),
    ('private.check_review_tag_scope()'), ('private.touch_review()')) as funcs(name)
  where has_function_privilege(roles.name, funcs.name, 'EXECUTE')
), 'Internal trigger functions cannot be executed directly by API roles');

grant select, insert, update, delete on public.issue_tags, public.reviews,
  public.review_tags, public.brand_changes to anon, authenticated;
set local role anon;
select is((select count(*) from public.issue_tags), 0::bigint, 'RLS hides criteria from anonymous users');
select is((select count(*) from public.reviews), 0::bigint, 'RLS hides reviews from anonymous users');
select is((select count(*) from public.review_tags), 0::bigint, 'RLS hides review tags from anonymous users');
select is((select count(*) from public.brand_changes), 0::bigint, 'RLS hides brand changes from anonymous users');
select throws_ok($$ insert into public.issue_tags (code, label, severity) values ('forbidden', 'Forbidden', 'minor'); $$,
  '42501', null, 'Anonymous inserts fail even with transaction-only table grants');
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select is((select count(*) from public.issue_tags), 0::bigint, 'Authenticated criteria access stays closed until P4');
select is((select count(*) from public.reviews), 0::bigint, 'Authenticated review access stays closed until P4');
select is((select count(*) from public.review_tags), 0::bigint, 'Authenticated review-tag access stays closed until P4');
select is((select count(*) from public.brand_changes), 0::bigint, 'Authenticated brand-change access stays closed until P4');
select throws_ok($$
  insert into public.brand_changes (brand_id, author_id, happened_on, note)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', current_date, 'Valid lead, no policy');
$$, '42501', null, 'A legitimate lead cannot write through RLS before P4');
select results_eq($$ update public.reviews set score = 1 returning id $$,
  $$ select null::uuid where false $$, 'RLS blocks review edits');
select results_eq($$ delete from public.review_tags returning review_id $$,
  $$ select null::uuid where false $$, 'RLS blocks removing review tags');
reset role;
select lives_ok($$ delete from public.reviews where id = '50000000-0000-0000-0000-000000000001'; $$,
  'Explicit admin review deletion removes dependent join rows only');
select is((select count(*) from public.review_tags), 1::bigint, 'Cascade preserves other review associations');
select is((select count(*) from public.replies), 3::bigint, 'Deleting a review does not delete replies');
select is((select count(*) from public.issue_tags), 3::bigint, 'Deleting a review does not delete criteria');

select * from finish();
rollback;
