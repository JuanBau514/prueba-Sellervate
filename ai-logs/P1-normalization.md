# P1 follow-up · Normalization correction

User instruction: correct P1 normalization, then leave the commit/push to the user. P2 starts later on a new branch. No commit, push, merge or P2 implementation is authorized for this turn.

## Finding and correction

The initial model repeated `people.role` in `brand_memberships` despite declaring one role per person. `person_id → role` is a partial dependency of the membership key `(person_id, brand_id)`, violating 2NF. Referential constraints prevented inconsistent copies but did not normalize them. The 38 passing integrity tests were not proof of normalization.

Add a forward migration; do not rewrite the published P1 migration. Keep the role only in `people`, remove the generated reply role and both supporting redundant unique constraints, and keep the person/brand assignment FK. Replace the cross-table role FK with a narrow private validation trigger. For V1, roles are immutable at profile creation; this stricter limitation is explicit, while name edits remain allowed. The author row is key-share locked during validation so it cannot be replaced concurrently. API permissions and RLS remain closed until P4.

## Validation record

- Confirmed the local database had only the original P1 migration and zero application rows before the upgrade.
- Tested the upgrade with a temporary Auth identity, brand, membership and reply. JSON comparisons confirmed all business rows survived; only redundant role fields disappeared. Rolled the entire rehearsal back, including DDL.
- Applied the forward migration with `supabase migration up --local`, without resetting the database.
- First test run found an organization error: the CLI discovered the non-pgTAP upgrade rehearsal files under `supabase/tests/`. Moved those scripts to `scripts/sql/`; the final-schema suite then passed 45 assertions. Added service-role ingestion checks for the final run.
- Final suite: **47 assertions passed**, including service-role ingestion and rejection of lead authors.
- Schema lint for `public,private`: no errors. RLS and API grant checks continue to pass.
- `git diff --check`: passed. Original migration unchanged; no commit or push performed. No frontend code or dependencies changed.

## Review and handoff

This is a response to the user's normalization review, not an invented GitHub review. The user will create the follow-up commit on `feat/data-model`. After publication, review and integration of P1, P2 uses `feat/quality-criteria` from updated `main`. No P2 objects have been added.
