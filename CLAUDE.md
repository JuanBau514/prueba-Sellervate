# Working agreement

Read `01-problema.md`, `02-pipeline.md` and `docs/implementation-plan.md` before making changes.

- `main` is the principal integration and submission branch. Start working branches from updated main and explicitly target main in every PR.
- Use only Git over SSH in the terminal. Do not use `gh`, switch the working remote to HTTPS or alter SSH keys. PR creation, human review and merging happen on the GitHub website; provide comparison links and prepared descriptions.
- Keep README.md complete and equivalent in Spanish and English, including setup, demo data, role switching, status and actual time.
- Read `docs/delivery-checklist.md` and record the current task's evidence against Scoring, Delivery and Before you send it. Documented plans are not completed requirements.

- Work on only the current problem/prompt. Keep branches and follow-up commits intact.
- Describe the plan before implementing; the user's instruction to execute the scoped task authorizes its implementation.
- The human author writes the actual review on the PR before merge. Do not invent or impersonate that review.
- Merge commits only; no squash, rebase, force push or branch deletion.
- Do not claim a check passed when it was blocked. Record real time and unresolved limitations.
- Next.js App Router, TypeScript, Supabase Postgres and Tailwind are fixed. daisyUI is our choice.
- Use the service role key only in `scripts/seed.ts`, never in request-handling code.
- All application database reads go through `src/lib/data/*` with `import 'server-only'` and the user's JWT.
- Enforce brand isolation and specialist privacy through RLS. UI filtering is not authorization.
- Enable RLS when creating tables; grant access in P4. Do not leave an exposed schema before P4.
- Use text/check constraints or lookup tables instead of Postgres enums.
- SQL views use `security_invoker = true`. Security-definer functions use `set search_path = ''`.
- Derive `reviewer_id` from the session. Save reviews and tags atomically and reject tags from other brands.
- Seed dates are relative to today. Keep secrets, machine paths and the supplied exercise PDF out of commits.
- Keep the six-hour cap, including planning, setup and human review. Prior work duration is still to be supplied by the user.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
