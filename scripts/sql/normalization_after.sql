-- Upgrade smoke check, intentionally outside Supabase's pgTAP discovery folder.
create temporary table p1_upgrade_after as
select 'people' as entity, jsonb_agg(to_jsonb(p) order by id) as rows from public.people p
union all select 'brands', jsonb_agg(to_jsonb(b) order by id) from public.brands b
union all select 'memberships', jsonb_agg(to_jsonb(m) order by person_id, brand_id) from public.brand_memberships m
union all select 'replies', jsonb_agg(to_jsonb(r) order by id) from public.replies r;

do $$
begin
  if exists (
    select 1 from p1_upgrade_before b full join p1_upgrade_after a using (entity)
    where b.rows is distinct from a.rows
  ) then
    raise exception 'Normalization changed existing business data';
  end if;
end;
$$;
select 'PASS: existing P1 rows preserved; only redundant role columns removed' as upgrade_result;
rollback;
