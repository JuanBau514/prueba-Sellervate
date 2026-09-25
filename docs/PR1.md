# P1: represent brands, people, assignments and replies

Prepared description for pipeline PR1. Base: `main`; head: `feat/data-model`. P1 is implemented; P2 will extend this same branch in a separate prompt before the combined PR is ready to merge. This file is not a human review.

## Problem and result

There was no persistent model for who works for each brand or which support replies they sent. P1 adds four tables with foreign keys, required content, scoped import identity and query indexes. The database rejects a reply attributed to an unassigned specialist or a lead, and protects existing history from cascading deletion.

## Decisions to review

- Supabase Auth supplies identity; `people` stores the profile and memberships define brand assignments. V1 uses one consistent role per person.
- A generated `specialist_role` constant enables a composite FK to the specialist's brand membership. It enforces the relationship on inserts and later edits without triggers; it is never a form field.
- `(brand_id, source, external_id)` identifies a reply for future idempotent imports. The identifier belongs to a message, not a ticket. Unknown response time is NULL, not zero.
- All four tables enable RLS; API grants are revoked and no policies are added until P4. This is the secure baseline, not finished role-based authorization.
- Referenced assignments and identities cannot be deleted. Offboarding and role changes with history need an archival design before they are offered in the product.
- README remains bilingual; workflow documentation now follows the user's Git-over-SSH-only requirement, with PR creation/review on GitHub's website.

## Validation

`npm run db:reset` applied the migration; `npm run db:test` passed 38 database assertions; Supabase's local schema lint found no errors. Post-test inspection confirmed all fixtures were rolled back. No application source or dependencies changed.

## Remaining scope

P2: quality tags/reviews. P3: usable demo data. P4: user switching and authorization policies with positive/negative API checks. Product screens follow later tasks. See `docs/data-model.md` for the P1 model and its tradeoffs.
