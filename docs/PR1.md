# P1: represent brands, people, assignments and replies

Prepared description for pipeline PR1. Base: `main`; head: `feat/data-model`. P1 includes the normalization correction requested before review. The user will commit and push this correction. P2 is deferred to a separate branch, `feat/quality-criteria`, after P1 is integrated. This file is not a human review.

## Problem and result

There was no persistent model for who works for each brand or which support replies they sent. P1 adds four tables with foreign keys, required content, scoped import identity and query indexes. The database rejects a reply attributed to an unassigned specialist or a lead, and protects existing history from cascading deletion.

## Decisions to review

- Supabase Auth supplies identity; `people` stores the profile and memberships define brand assignments. V1 uses one consistent role per person.
- The follow-up migration removes the duplicated membership role, generated reply role and supporting redundant unique constraints. `people.role` is the single source of truth; the original published migration is preserved.
- A composite FK enforces assignment to the reply's brand. A private trigger validates that the author is a specialist, independently of caller RLS, with an empty search path and no direct API execution grants.
- V1 roles are fixed at profile creation, even before the first reply. An invoker trigger blocks changes; names remain editable. A key-share lock prevents deletion/replacement of an author during ingestion. Promotions require a future history model.
- `(brand_id, source, external_id)` identifies a reply for future idempotent imports. The identifier belongs to a message, not a ticket. Unknown response time is NULL, not zero.
- All four tables enable RLS; API grants are revoked and no policies are added until P4. This is the secure baseline, not finished role-based authorization.
- Referenced assignments and identities cannot be deleted. Offboarding and role changes with history need an archival design before they are offered in the product.
- README remains bilingual; workflow documentation now follows the user's Git-over-SSH-only requirement, with PR creation/review on GitHub's website.

## Validation

The original P1 migration passed 38 assertions. The normalization correction has a transactional upgrade check proving existing rows survive, updated pgTAP coverage for the normalized schema, and schema lint for both public and private objects. Final results are recorded in `ai-logs/P1-normalization.md`. No application source or dependencies changed.

## Remaining scope

P2: quality tags/reviews. P3: usable demo data. P4: user switching and authorization policies with positive/negative API checks. Product screens follow later tasks. See `docs/data-model.md` for the P1 model and its tradeoffs.
