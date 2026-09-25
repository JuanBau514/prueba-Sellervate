# P0: establish the application scaffold and review workflow

Prepared PR description. Publication is pending GitHub authentication. This is not a human review.

Base: `main`. Head: `chore/scaffold`.

## Problem and result

The repository contained the product interpretation and pipeline, but no executable application or database configuration. This change adds the minimum Next.js App Router/TypeScript application, Tailwind/daisyUI integration, local Supabase configuration, reproducible dependency lockfile and project scripts. It records how each subsequent problem will be handled as an independent prompt.

## Decisions

- The initial main commit contains only the original planning documents and ignore rules. All application work is on this branch.
- Configure the framework manually to preserve the existing directory. No starter kit is used.
- Install Supabase CLI as a pinned project dependency. No global CLI installation is needed.
- Keep the landing page minimal; custom visual foundations belong to P9a.
- Disable the nonexistent SQL seed; P3 will introduce the TypeScript seed.
- Preserve the existing product analysis and document clarifications separately.
- Pin ESLint 9.39.5: the current Next.js React/import/accessibility plugins reject ESLint 10, which also failed at runtime during linting. The unsupported-tooling warning remains documented.

## Validation

- `npm run check`: lint without warnings, TypeScript and production build passed.
- `npm run dev`: ready; `GET /` returns HTTP 200 and the expected page content.
- `.env.local` and the source PDF are ignored; `.env.example` is trackable.
- `npm run db:start`: passed; containers are running and Auth health returns HTTP 200.
- `npm ci --dry-run --ignore-scripts --offline`: passed; a fresh remote clone remains untested until publication.
- Domain tests are deferred until there is domain behavior; direct authorization tests are part of P4.

## Human review focus

- Is the scope limited to P0?
- Are the independent prompts and review-before-merge agreement correct?
- Are any secrets or personal environment files included?
- Is the temporary ESLint compatibility limitation acceptable?

Write your actual review on the GitHub PR before merging. Keep all commits and branches; use a merge commit.
