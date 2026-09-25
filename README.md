# Sellervate · Quality review

An internal tool for recording brand-specific judgement on customer support replies and returning that feedback to specialists.

**Current status: P0 scaffold implemented locally; publication and human review pending.** The review workflow, database schema, demo data and authorization are not implemented yet. This is not the finished exercise submission.

## Run the current scaffold

Requirements: Node.js 22 or newer (24 recommended), npm, and Docker Desktop running for local Supabase. Supabase CLI is a project dependency; no global install is required.

The clone instructions below become available after the branch is pushed. Until then, run the commands from `npm ci` onward in this local checkout.

```sh
git clone https://github.com/JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
git switch chore/scaffold
npm ci
npm run db:start
cp .env.example .env.local
npm run db:status
```

Copy the local API URL and anon key into `.env.local`. Keep the service role key server-only; its sole planned consumer is the future seed script. The P0 landing page does not need credentials. The first Supabase start downloads Docker images and depends on connection speed.

```sh
npm run dev
```

Open http://localhost:3000. Stop the local database with `npm run db:stop`.

```sh
npm run check
```

This runs ESLint, TypeScript and a production build. `npm run db:reset` is for the disposable local database and deletes its current data. Migrations arrive in P1/P2, the seed in P3, and role switching and authorization checks in P4.

## Scope and workflow

- [Product interpretation](01-problema.md)
- [Original problem map and pipeline](02-pipeline.md)
- [Execution agreement and independent prompts](docs/implementation-plan.md)
- [Agent working rules](CLAUDE.md)
- [P0 prompt and work record](ai-logs/P0.md)
- [Prepared P0 pull request](docs/P0-pr.md)

Each piece is developed on a branch, reviewed in writing by the human author, corrected on that same branch and merged with a merge commit. Branches and commits are retained. The source exercise PDF stays local. The framework setup is manual; no starter kit was used.

## Time and limitations

The exercise has a six-hour total cap, including planning and reviews. Time spent before this session is pending confirmation; no total is asserted yet. This session's record is in `docs/time-log.md`.

The first meaningful automated test will verify RLS isolation across brands and between specialists in the same brand, including direct API access and forbidden writes. P0 contains no domain behavior to test yet.

`DECISIONS.md`, demo accounts, seed commands and complete clone-to-running verification will be added as their corresponding problems are implemented.

ESLint is pinned to 9.39.5 because the plugins included with the current Next.js configuration are not compatible with ESLint 10. npm reports that ESLint 9 is out of support; the attempted upgrade and observed failure are recorded in the P0 work log.
