# Decisions

## Product

**The real problem.** Expert judgement about a reply disappears after a Slack message. Leads read a handful of replies a day out of hundreds, pick them without a method (one specialist skipped the order history for a month and the brand noticed first), and "good" depends on the brand: diagnose before a return for scooters, three exact lines for packaging. The brand only sees the outcome, so a lead needs evidence, not an impression.

**What I built first.** The loop, end to end, before any reporting: a queue that samples by coverage gaps per brand *and* specialist → a workspace to review against the brand's own procedure → the specialist's private feedback → brand evidence with sample sizes. Authorization came before the screens (P4), because a quality tool that leaks one brand's replies to another breaks the service promise.

**Left out, on purpose.** Helpdesk import (the model is ready: `source` + `external_id` unique per brand), coaching screens (only an `is_example` flag), editing a saved review, several reviews per reply, a login for the brand itself, notifications and a revision history of feedback.

**Where a model would go.** In triage, not in judgement: rank the unreviewed replies by the probability of a *critical* brand-specific issue (a return offered without diagnosis, a missing battery warning) so the five daily reviews land where they matter; and suggest tags for the lead to confirm. Before trusting it I would measure precision and recall on critical tags against lead-labelled reviews per brand, and keep the coverage rule so the model cannot create new blind spots.

**Questions before V2.** Does the brand want to see this directly or through the lead? How many reviews per week make a trend credible for a small account? Is brand × specialist the right unit of coverage? Who owns and versions each brand's criteria?

## Architecture

**Shape.** Next.js App Router with Server Components; reads go through `src/lib/data/*` (`server-only`), which calls PostgREST with the user's JWT; writes are Server Actions. Aggregates are SQL views with `security_invoker = true`; the review and its tags are saved by one `security invoker` function, `submit_review`, so both commit or neither does. At the author's request no dependencies were added after the scaffold, so Supabase is reached with `fetch` and the demo session lives in httpOnly cookies renewed by `src/proxy.ts`.

**Data model.** Eight tables in 3NF: `people` (the only place a role lives), `brands`, `brand_memberships`, `replies`, `issue_tags` (global or per brand, severity on the criterion), `reviews` (one per reply, brand derived from the reply), `review_tags`, `brand_changes`. Identity fields are immutable in V1, and triggers enforce "reviewer is a lead assigned to the brand" and "tag is global or of the reviewed brand" even for the service role used by the seed.

**Where authorization lives.** In Postgres. RLS policies require a brand membership (a global role grants nothing); helpers are `security definer` with an empty `search_path`; `reviewer_id` and `author_id` come from `auth.uid()`, never from a form; a reply you may not see returns 404, not 403. Evidence: 169 pgTAP assertions and `npm run authz-check` (29 cases against PostgREST and the running app, including same-brand privacy between specialists).

**Real authentication would need** a real sign-in (SSO or magic link) replacing the demo password switcher, an admin flow for memberships and offboarding, `Secure` cookies behind HTTPS, and swapping the hand-rolled session code for `@supabase/ssr`.

**What breaks first as it grows.** Every figure is computed on each request from all reviews: fine for hundreds of rows, not for a year of several brands (weekly aggregates would be materialized). RLS calls membership helpers per row. The session refresh is ours to maintain. One review per reply will not survive calibration between leads.

## AI

**How I worked.** One independent prompt per problem, one branch and one PR per problem into `main`, merged by the author after their review. Codex for P0–P2, Claude Code for P3–P10. Every prompt and its evidence is in `ai-logs/`.

**Where the author corrected the agent** (from the logs):
- P1 duplicated the role in `brand_memberships`, which violates 2NF; the author asked for normalization and committed the fix (`ae05513`).
- P1 and P2 were planned on one branch; the author asked for separate branches and PRs.
- P3: the agent asked to install `supabase-js` and `tsx`; the author ruled out new dependencies, which shaped every later problem.
- P6: the author's screenshot showed the queue cutting replies after the greeting; the fix came with the visual foundation.

**Where the agent caught itself**: a join that would have inflated averages when a review has several tags (P7), a chart marker clipped off the plot (P8), and `loading.tsx` turning 404s into 200s under streaming (P9b).

**A prompt I am proud of.** *[Draft for the author to confirm or replace]* The contract reused for every problem (`docs/implementation-plan.md`): "Implement only P… on its designated branch from reviewed main. State the scoped plan, inspect the existing implementation, preserve user changes… Run the acceptance checks, review the diff for security and scope, and report what passed and what was blocked… Leave actual PR creation, human review and merge pending; do not fabricate them."

## Status

**Done.** Seed, real sessions with role switching, RLS isolation with executable checks, review queue with coverage, review workspace with atomic save and keyboard shortcuts, specialist feedback with n, brand evidence (trend, critical issues, patterns, coverage, change log), loading, error and empty states.

**Half done.** Visual comparison with sellervate.com; a last phone screenshot after the final table fix; the clean-clone run was measured with warm caches (65 s), not on a fresh machine.

**Not touched.** Helpdesk import, editing reviews, CI, end-to-end browser tests, deployment, dark mode.

**Order to resume.** Run pgTAP and `authz-check` in CI; allow editing one's own review; import from the helpdesk; real authentication.

**The strongest objection to my own repository.** *[Draft for the author to confirm or replace]* The session layer is hand-written: cookie handling and token refresh that `@supabase/ssr` would own. I kept it because the no-dependency rule was an explicit decision and RLS still verifies every token, but it is the first thing I would replace before real users.
