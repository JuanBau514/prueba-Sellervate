# Execution agreement

The source of requirements is the seven-page exercise. `01-problema.md` is the product interpretation and section 1 of `02-pipeline.md` is the work map. Those original documents remain at the repository root so existing references keep working.

## Interpretation

The core problem is that expert judgement disappears after a Slack message. A lead reviews an already-sent reply against its brand's procedures; the specialist reads that feedback; the lead can reuse it as evidence. The first release prioritizes that complete loop. Reporting remains small. Coaching screens, helpdesk imports and model-based scoring are outside this release.

## Clarifications to the original pipeline

See the [scoring and delivery matrix](delivery-checklist.md) for required evidence and outstanding submission items.

- The brief allows Codex and other agents; Claude Code is not a requirement. This session uses Codex.
- Next.js App Router, TypeScript, Supabase and Tailwind are required. daisyUI, Recharts, local Supabase and the precise schema are implementation choices.
- The original map grouped P1/P2. The user's normalization review now requires separate branches and PRs: finish P1 on `feat/data-model`, then P2 on `feat/quality-criteria`. Keep the six-hour cap in mind; the brief says four or five real PRs are sufficient.
- P0 is configured manually from the official Next.js installation pattern because the directory already contains the user's planning files. No starter kit is used.
- Human review before merge is part of the evaluated deliverable. An agent self-check cannot substitute for it. P0 ends with a reviewable branch; subsequent dependent work follows its review and merge.
- RLS must be enabled at table creation in P1, with no client access until policies are added in P4.
- Authorization checks must cover another specialist **in the same brand**, another lead's brand, anonymous requests and forbidden writes, as well as the original API check.
- Brand membership requires its own policy. A global role must not grant cross-brand access. Brand-specific tags must be validated against the reviewed reply.
- Coverage is calculated per brand and specialist, including never-reviewed specialists. Reviewing a person for one brand must not conceal a gap for another.
- A review and its tags must be saved in one transaction. SQL aggregates must preserve RLS and visible sample sizes.

## Main as the integration and delivery branch

`main` is the permanent integration and submission branch. Every P0–P10 delivery (including P9a/P9b) reaches it through a reviewed PR. Working branches start from updated `main`; every PR explicitly uses `main` as its base. Keep merge commits, follow-up commits and working branches. Do not squash, rebase or replace main with an unreviewed feature branch.

P0 is merged into `main` through GitHub PR #1 (`1beec2a`), P1 including normalization through PR #2 (`2b7aba8`), and the remote HEAD points to `main`. P2 starts from that verified merge. The user requires Git over SSH exclusively in the terminal. Do not use `gh` or change the working remote to HTTPS. For P2:

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/quality-criteria
# Implement the scoped problem and commit the reviewed local diff.
git push -u origin feat/quality-criteria
```

The agent prepares a [PR description](P2-pr.md) and the [comparison link](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/quality-criteria); the author creates the PR on GitHub with base `main`, writes their review there and merges with a merge commit after corrections. This is an explicit workflow adaptation to the user's Git-only requirement; it does not replace human review with an agent's self-check. Keep the branch. The author committed P1's normalization correction as `ae05513`; it is included in the verified P1 merge. P2 is implemented on its separate branch; P3 must wait for the next independent prompt.

Keep README.md in Spanish and English with equivalent setup instructions, status, seed/role guidance, actual-time accounting and submission requirements. Maintain the scoring and delivery checklist against the PDF, without declaring unfinished requirements complete.

## Independent prompts and execution order

Use this contract for each new task, replacing `P…` with the entry below:

> Read CLAUDE.md, 01-problema.md, docs/implementation-plan.md, docs/delivery-checklist.md and the P… section of 02-pipeline.md. Implement only P… on its designated branch from reviewed main. State the scoped plan, inspect the existing implementation, preserve user changes, and record this prompt. Run the acceptance checks, review the diff for security and scope, and report what passed and what was blocked. Keep the Spanish and English README sections equivalent. Commit and push the branch to JuanBau514/prueba-Sellervate using Git over SSH only; prepare a comparison link and PR description targeting main for creation on the GitHub website. Leave actual PR creation, human review and merge pending; do not fabricate them. Record real time, decisions, affected scoring evidence and remaining delivery requirements. Do not begin the next problem in this turn.

| Order | Prompt scope | Branch | Acceptance focus |
| --- | --- | --- | --- |
| 1 | P0: project base and working rules | `chore/scaffold` | App starts; lint/types/build; local Supabase starts |
| 2 | P9a: custom visual foundations | `feat/design-tokens` | Theme, type scale and reading typography |
| 3 | P1: brands, people, memberships and replies | `feat/data-model` | Migration, constraints, indexes, default-deny RLS |
| 4 | P2: brand-relative criteria and severity | `feat/quality-criteria` (separate PR) | Tags/reviews model; migration reruns |
| 5 | P3: credible demo dataset | `feat/seed` | Three brands, two leads, three specialists and relative dates |
| 6 | P4: server authorization and user switching | `feat/authz` | Direct API/database checks, including same-brand privacy |
| 7 | P5: review queue and coverage | `feat/review-queue` | Per-brand prioritization and distinct lead queues |
| 8 | P6: contextual review workspace | `feat/review-workspace` | Atomic save, valid tags and next reply |
| 9 | P7: specialist feedback | `feat/specialist-view` | Own reviews only, sample sizes and empty state |
| 10 | P8: evidence per brand | `feat/brand-overview` | Trend with n, critical issues, recurring tags and coverage |
| 11 | P9b: states and interface polish | `chore/states-polish` | Loading/error/empty states, focus and small screens |
| 12 | P10: handoff documentation | `docs/decisions` | Fresh-clone instructions, actual time and two-page decisions |

P1 and P2 use separate prompts, branches and PRs per the user's latest instruction. The user selected P1 immediately after P0; P9a remains pending and is not a prerequisite for database work. Apply the original pipeline's cuts if time runs short.

## References consulted for P0

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase local development](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [daisyUI installation](https://daisyui.com/docs/install/)
