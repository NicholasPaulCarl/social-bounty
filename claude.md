# Social Bounty MVP

## Project Overview

Social Bounty is a bounty-based marketplace platform where businesses create tasks with rewards, users complete them and submit proof, businesses review submissions, and super admins manage the platform. This is a production-bound MVP.

**Specification**: See `md-files/social-bounty-mvp.md` for the full product spec.

## Tech Stack

- **Front-end**: Next.js 14 (App Router), PrimeReact 10, Tailwind CSS, TypeScript, TanStack Query 5
- **Back-end**: Node.js (NestJS), PostgreSQL, Prisma ORM, REST API, Redis (Stitch token cache + webhook replay guard)
- **Payments**: Stitch Express (inbound — live), TradeSafe (outbound — adapter scaffolded, `PAYOUTS_ENABLED=false` gate)
- **Webhooks**: Svix-verified (HMAC-SHA256, ≤5 min timestamp skew)
- **Infrastructure**: Local / Staging / Production, Sentry for error tracking
- **Auth**: JWT (access + refresh), email verification via OTP. Password-auth implementation is roadmap — see `docs/reviews/2026-04-15-team-lead-audit-batch-13.md` for the current gap.

## Hard Rules

1. **MVP only** - no feature creep. If it's not in the spec, don't build it.
2. **RBAC mandatory** on every screen and API endpoint.
3. **Audit logs required** for all admin actions and status changes.
4. **100% test pass rate** required before any release.
5. **PrimeReact + Tailwind CSS** must be used for all UI.
6. All destructive actions require confirmation dialogs.
7. Document assumptions; don't invent requirements.
8. **Use agents for every task and run them in paralell** md-files/agents/agent-overview.md

## User Roles

- **Participant**: Browse bounties, submit proof, track submissions
- **Business Admin**: Create/manage bounties, review submissions, manage payouts
- **Super Admin**: Full platform access, user/org management, audit logs, troubleshooting

## Data Model Entities

User, Brand, BrandMember, Bounty, Submission, AuditLog, FileUpload, LedgerEntry, LedgerTransactionGroup, WebhookEvent, StitchPaymentLink, StitchPayout, StitchBeneficiary, Subscription, SubscriptionPayment, Refund, RecurringIssue, JobRun, SystemSetting.

> Organisation was renamed to Brand in commit `539467e` (2026-04-15). A legacy JWT claim compatibility shim lives in commit `8c50d38` for existing sessions. The residual `/business/organisation/*` routes were consolidated into `/business/brands/*` in commit `8e4c21f` (2026-04-16).

## Project Structure

```
social-bounty/
  claude.md         # This file — project charter + financial non-negotiables
  apps/
    web/            # Next.js front-end
    api/            # NestJS back-end
  packages/
    shared/         # Shared types, DTOs, enums, ledger constants
    prisma/         # Prisma schema and migrations
  docs/             # Architecture docs, ADRs, reviews, runbooks
    adr/            # Architectural Decision Records (0001–0009)
    reviews/        # Team-lead audit reports (2026-04-15 batches 2–13)
    perf/           # Reconciliation benchmarks, perf evidence
  md-files/         # Product + domain specs and agent play-books
    agents/         # 9 per-role agent specs (entry: agent-overview.md)
    archive/        # Superseded historical docs (dated filenames)
    *.md            # Canonical specs: payment-gateway, financial-architecture,
                    # knowledge-base, admin-dashboard, implementation-phases,
                    # social-bounty-mvp, brand-profile-and-signup,
                    # AGENTS (team roster), SPRINT-PLAN, RELEASE-NOTES
                    # — design system lives at apps/web/src/styles/design-system/
  scripts/          # CLI tools (kb-context.ts, bench-reconciliation.ts)
```

## Conventions

- TypeScript strict mode everywhere
- Use Prisma for all database access
- REST API with consistent error response format
- Input validation at API boundary (class-validator / zod)
- All API routes protected by RBAC middleware
- Git conventional commits (feat:, fix:, docs:, test:, chore:)
- Tests colocated with source files (`*.spec.ts` / `*.test.ts`)

## Agent Team Roles

Full play-books in `md-files/agents/` (entry point: `agent-overview.md`). Routing rules in §3 below.

- **Team Lead** (`agent-team-lead.md`): Approval gates, RBAC sign-off, financial-non-negotiable enforcement
- **Architect** (`agent-architect.md`): Database schema, API contracts, system design decisions, ADRs
- **UX Designer** (`agent-ux-designer.md`): Flows, edge cases, destructive-action confirmation copy
- **UI Designer** (`agent-ui-designer.md`): PrimeReact composition, Tailwind tokens, screen inventory
- **Front-End** (`agent-frontend.md`): Next.js App Router, TanStack Query, routing, state
- **Back-End** (`agent-backend.md`): NestJS modules, Prisma, auth/RBAC, ledger writers, webhook handlers
- **QA/Testing** (`agent-qa-testing.md`): 5-test matrix per ledger handler, Playwright E2E, smoke gates
- **DevOps** (`agent-devops.md`): CI/CD, migrations, env validation, Docker/deployment

## Key Delivery Outputs

A) MVP backlog (epics, stories, tasks)
B) UX sitemap and flows
C) UI screen inventory + component list
D) Database schema (Prisma)
E) API contract with examples
F) Front-end routing and state strategy
G) Security checklist
H) Test plan + automation strategy
I) Deployment plan + runbook

---

## Current Implementation Status (2026-04-18)

HEAD: `d1b54c0 docs(deployment): close R34 in tradesafe live readiness doc` on main (Phase 3 shipped 2026-04-18; live-readiness docs pass + R32/R33/R34/R35/B2/B3 remediation landed same day). Test state: **1651 tests across 97 suites, 100% green** — api 1347 / 87 suites + web 304 / 10 suites (Hard Rule #4 held). API count grew 1294 → 1347 (+3 R32 reconciliation, +22 R33+R35 env+OAuth, +28 R34 webhook handlers, +0 B2+B3 docs). Working tree clean. Recent operational additions not reflected in the test count: `go-live-checklist.md`, `stitch-express-live-readiness.md`, `tradesafe-live-readiness.md` (all under `docs/deployment/`), plus ADR 0010, plus `next build` unblocked (`0c67252`) and dead lint scripts removed (`8378f5a`). New migration `20260418010000_add_payout_provider_rail` applied to staging Supabase 2026-04-18 (adds `PayoutRail` enum + `StitchPayout.provider` column defaulted to `STITCH`, minimum-viable slice for R32 rail discriminator; full `stitch_payouts` → `ProviderPayout` rename deferred to a future ADR).

**Live and tested:**
- **Stitch Express inbound rail** — brand funding (account debit → platform custody), idempotent via `UNIQUE(referenceId, actionType)`, Svix webhook ingestion with replay-safe handling.
- **Append-only ledger** — double-entry, integer minor units, plan snapshot per transaction, compensating-entry refunds (ADR 0005, 0006).
- **Reconciliation engine** — 7 checks (group balance, duplicate detection, missing legs, status consistency, wallet-projection drift, Stitch-vs-ledger, reserve-vs-bounty). Reserve check runs single GROUP BY (184×–494× faster than per-bounty aggregate). 15-min cadence safe to ~1M paid bounties. Fault-injection coverage for each check.
- **Finance admin dashboard** — kill switch, reconciliation drill-down, exception review, per-system confidence scores. Stat-card response key aligned with the Organisation→Brand rename (`data.brands.total`, fixed 2026-04-15). `getDashboard()` collapsed from 23 parallel `count()` round-trips to 6 `groupBy` queries (2026-04-16, commit `6e110ca`); response shape byte-identical, ~100-150ms → ~30-50ms dashboard load. Transaction-group drill-down audit log rendered a wrong shape (local type declared `auditLog` as array; backend returns single-or-null); swapped to shared `TransactionGroupDetail` and fixed consumer page (commit `2eb7a0a`).
- **KB automation (Phase 4)** — `recordRecurrence` signature-stable and called from reconciliation + webhook-failure paths, Ineffective-Fix auto-flag with AuditLog, `scripts/kb-context.ts` CLI.
- **Subscription lifecycle** — tier snapshot, auto-downgrade state machine, grace period, cancel-at-period-end UI, **live Upgrade CTA** wired to Stitch card-consent (POST `/subscription/upgrade` → hosted consent → `subscription_charged` ledger group).
- **TradeSafe payout adapter scaffold** (batch 10A) — behind `PAYOUT_PROVIDER` flag with mock mode; `PAYOUTS_ENABLED=false` remains the outbound gate; no ledger paths live.
- **Migration history reconciled** (batch 13A) — fresh-DB `prisma migrate deploy` green from empty Postgres; 16 tables, 16 enums, 23 columns, 56 indexes, 22 FKs brought back into migration history via idempotent SQL; `schema.prisma` untouched. **Correction (2026-04-17):** the "existing envs verified no-op via pg_dump snapshot diff" claim held for the ad-hoc env the audit ran against, but the staging Supabase DB had six unapplied migrations from this batch (13A) onward — see the 2026-04-17 "Migrations deployed + ledger idempotency hardening" entry below for the remediation.
- **Env validation hardened** (batches 13B + 14A) — 9 previously-unchecked flags now typed at boot; `BENEFICIARY_ENC_KEY` required when `PAYOUTS_ENABLED=true` with 32-char minimum + defence-in-depth throw in `BeneficiaryService` constructor; dead `FINANCIAL_KILL_SWITCH` env removed (operator-misleading; real kill switch is `SystemSetting.financial.kill_switch.active`).
- **Brand route consolidation** (2026-04-16, commit `8e4c21f`) — completed the half-done Organisation→Brand rename. `edit/`, `kyb/`, `members/`, `subscription/` moved from `/business/organisation/*` to `/business/brands/*` via `git mv` (history preserved); `navigation.ts` hrefs repointed; stale "Organisation" breadcrumbs fixed; redirect shim deleted. `/business/brands/edit/` (single-brand, `user.brandId`) and `/business/brands/[id]/edit/` (multi-brand, URL param) coexist intentionally.
- **Bounty form proof-requirements integrity** (2026-04-16, commit `f5353d2`) — a partially-landed refactor left four inconsistencies: `INITIAL_FORM_STATE.proofRequirements` seeded with `['url']` (drafts carried a value the user never selected), `buildCreateBountyRequest` defaulted empty arrays to the literal string `'url'` (draft + full), `isSectionComplete('bountyRules')` hardcoded `return true`, and `validateFull` never checked `proofRequirements`. All four fixed; UX change: the "URL" proof checkbox no longer pre-ticks — brands must explicitly select at least one proof type.
- **Web jest unblocked under TS 6.0** (2026-04-16, commit `a1527ff`) — `apps/web/tsconfig.json` missing `rootDir` (TS5011 promoted to error in 6.0) and ts-jest hard-codes `moduleResolution: Node10` (TS5107 deprecation). Added `rootDir: "./src"` + `ignoreDeprecations: "6.0"`. Web suite went from 8/8 fail at type-check to 8/8 green.
- **Canonical design system** (2026-04-18, branch `ui-ds-update`) — `apps/web/src/styles/design-system/` now holds the single source of truth (Claude Design handoff bundle). Includes `colors_and_type.css` (tokens), `components.css` (btn/card/input/badge/chip/avatar/table/toast/progress), `README.md` (voice + rules), `SKILL.md` (short agent reference), 5 preview HTMLs, and the wordmark asset. `globals.css` `@import`s both CSS files before `@tailwind`; `tailwind.config.ts` re-exports the canonical `pink-*` / `blue-*` / `slate-*` / `reward-*` scales. Identity: **pink leads (`pink-600` #db2777), blue counters (gradient stop + `.info` only), slate carries everything, gold is rewards-only, the `pink → blue` gradient is used ONCE per view at most.** Previous docs at `md-files/DESIGN-SYSTEM.md`, `docs/brand/WEBSITE-STYLING.md`, `docs/brand/BRAND-GUIDELINES.md` removed — their content is superseded by the handoff README.
- **Design system applied to all high-visibility pages** (2026-04-18, branch `ui-ds-apply`, merged to main) — followed the DS handoff with a full icon migration and DS-compliance sweep across all three surfaces (marketing/auth, participant, business + admin) via three isolated-worktree agents plus an integration pass. Scope and outcomes: **(1) PrimeIcons → Lucide everywhere** — `grep -r "pi pi-" apps/web/src --include="*.tsx" | wc -l` went from ~300 references to 0. `lucide-react@1.8.0` added as a dep; `NavItem.icon:string` retyped to `NavItem.Icon:LucideIcon`; `AppSidebar`, `AppHeader`, `BrandSelector` fully rewritten to Lucide. Social brand marks (Instagram, Facebook, Twitter — absent from Lucide 1.8 per trademark policy) replaced with neutral semantic stand-ins: `Camera`, `ThumbsUp`, `Globe`. `ICONS.md` corrected accordingly. **(2) Standalone blue-600 removed** from non-gradient non-info surfaces; replaced with `pink-600` (interactive) or `slate-600` (neutral). **(3) Off-spec Tailwind primitives** (`text-cyan-400`, `text-violet-400`, `text-amber-400`) eliminated — `grep -r "text-cyan-\|text-violet-\|text-amber-" apps/web/src --include="*.tsx" | wc -l` → 0. **(4) Metric/currency displays** → `font-mono tabular-nums` or `.metric` class. **(5) Eyebrow pattern** added to stat sections and page-header subtitle pairs. **(6) Card radii** normalised: `rounded-xl` default (16px), `rounded-3xl` feature (24px), `rounded-full` chips/CTAs. **(7) Gradient capped at one per view** across all three surfaces. **(8) Voice pass**: button labels trimmed, feature-lead copy rewritten receipts-first. Built as: 0c shared-component baseline commit → 3 parallel worktree agents (A: marketing+auth, B: participant, C: business+admin) → 12 cherry-picks onto `ui-ds-apply` with zero conflicts → integration fixes (32 files, local `LucideIcon` type aliases resolved, ts-jest TS5107 suppression added to `jest.config.ts`). Tests stayed at 1651 green (api 1347/87 + web 304/10). `next build --no-lint` clean (68 static pages).
- **`EmptyState.tsx` Lucide migration** (2026-04-19, commit `7dce09d`) — closed the last deferred item from `ui-ds-apply`. Component API changed from `icon?:string` (PrimeIcons class suffix) + `ctaIcon?:string` to `Icon?:LucideIcon` + `CtaIcon?:LucideIcon` (Lucide React component references passed by reference). Default changed from the string `'pi-inbox'` to the `Inbox` component import. Updated 27 call-sites across participant, business, and admin surfaces. `grep -r "pi pi-" apps/web/src --include="*.tsx" | wc -l` → 0 globally (was previously 0 from `ui-ds-apply` except these empty-state callers). Tests: 304/10 web green; `next build --no-lint` clean.
- **Organisation→Brand rename completed end-to-end** (2026-04-17, commits `c055b2a`, `55cb3b8`, `cb388a2`) — three-stage sweep closing the trailing half of the `8e4c21f` route consolidation. (B1) `apps/api/src/modules/organisations/` and its five files + `apps/web/src/app/(shared)/create-organisation/` renamed via `git mv` (history preserved); all imports repointed. (B2) 35 files, 157+/157- identifier sweep: `orgId` params → `brandId`, `organisation` local vars → `brand`, response fields `organisation`/`organisationName` → `brand`/`brandName`, test descriptions, comments. (B3) API contract: `@Get('disputes/organisation')` → `/disputes/brand`, `@Query('orgId')` → `@Query('brandId')`; frontend hook `useOrgDisputes` → `useBrandDisputes`, query-key `disputes.forOrg` → `disputes.forBrand`. Closed a latent bug — the web client was already calling `/disputes/brand` and hitting 404s on the old route. Intentionally preserved: Prisma `@map`/`@@map` directives (8 sites, DB table/column names retained to avoid a migration), JWT compat shim at `jwt.strategy.ts:11,41-42` + `auth.service.ts:428-430` (commit `8c50d38`), historical migrations, archived/dated docs.
- **Dead-code hygiene sweep** (2026-04-17, commits `c5de929`, `62dbf74`) — removed `ApifyService.refreshForOrganisation` alias (scheduler already on `refreshForBrand`, zero remaining callers) and unused `SettingsService.getString`; simplified 4 `as unknown as { contentFormat? | instructionSteps? | payoutMethod? }` casts in `useCreateBountyForm.ts` that were dead weight (fields already typed on `BountyDetailResponse`); added explanatory comment above the intentional `exhaustive-deps` eslint-disable in inbox conversation page; refreshed stale filenames in `docs/architecture/frontend-strategy.md` (`OrgStatusActions` → `BrandStatusActions`, `useOrganisation` → `useBrand`, `useAdminOrgs` → `useAdminBrands`).
- **Bounty accessType wired into API responses** (2026-04-17, commit `da71b0a`) — latent bug closed. Prisma schema has `accessType BountyAccessType @default(PUBLIC)` on Bounty, `BountyAccessType` enum exported from shared, and four frontend callsites read the field via `as unknown as { accessType?: string }` + `?? PUBLIC` fallback — but neither the list nor detail response builder included it, so every `accessType === 'CLOSED'` branch was unreachable (notably the padlock badge on `BountyCard` and the routing gate on `/bounties/[id]/apply`). Added `accessType: BountyAccessType` (non-nullable) to `BountyListItem` + `BountyDetailResponse` DTOs, serialized `b.accessType` in both response builders, dropped all four casts + fallbacks. `bounty-access.service.ts:528` uses its own Prisma `select` and is unaffected. UI-verified end-to-end against the live staging DB (37 public demo bounties): list + detail responses carry the field on the wire, Open badge renders, `/bounties/:id/apply` correctly redirects PUBLIC bounties back to the detail page.
- **Error-typing + repo hygiene** (2026-04-17, commits `867f130`, `880e5ab`, `f0b0bb5`) — three small threads: (a) `catch (err: any)` → `catch (err)` + `instanceof Error` narrowing at 3 production sites (health-check link validator, Stripe webhook verifier, social-handle validator) — TS 4.4+ default; (b) `.gitignore` now covers `*.tsbuildinfo`, `apps/web/test-results/`, `apps/web/playwright-report/`, and the four stale artefacts that had slipped into `c055b2a` were untracked via `git rm --cached`; `md-files/RELEASE-NOTES.md:20` "an brand" → "a brand" grammar lag from an earlier org→brand pass; (c) two new jest assertions lock in the `accessType` wire contract (`baseBounty` fixture gains `accessType: PUBLIC`; list + detail specs each assert a CLOSED value round-trips) — test count 1453 → 1455. `f0b0bb5` adds `.claude/launch.json` so future sessions can spin up the web dev server via Claude Preview's `preview_start web` without reconfiguring.
- **Migrations deployed + ledger idempotency hardening** (2026-04-17) — surfaced by running the dev stack against staging: two latent issues co-living on the server. **(A) Six migrations were un-applied** on the staging Supabase DB (`20260415142500_subscription_tables`, `…143000_subscription_tier_enum`, `…190000_stitch_subscription_upgrade`, `…200000_reconcile_missing_enums`, `…200100_reconcile_missing_columns`, `…200200_reconcile_missing_tables`) — the ReconciliationScheduler was crashlooping on `recurring_issues.ineffectiveFix` missing. All six had idempotency guards (222 `IF NOT EXISTS` / `IF EXISTS` clauses total across the batch) except the stitch-subscriptions one, which created fresh objects that pre-check confirmed absent. `prisma migrate deploy` applied all six cleanly; Prisma `_prisma_migrations` now in sync with code. **(B) Ledger idempotency catch-inside-tx was broken under real Postgres** — `ledger.service.ts:runInTx` used `try { tx.create(...) } catch (P2002) { tx.findUnique(...) }`, which worked on mocked Prisma in tests but hit SQLSTATE `25P02` ("current transaction is aborted") on the real DB, crashlooping `ClearanceService`'s clearance-release cron. Refactored to a fast-path pre-check outside any tx (cheap read), then a safety-net catch after `$transaction` rollback for the rare race where another writer won between pre-check and insert. ADR 0005 pattern preserved — `(referenceId, actionType)` still the idempotency key. Tests refactored: mock prisma now includes outer `ledgerTransactionGroup.findUnique`; existing "idempotent on conflict" test split into "fast-path pre-check" + "concurrent-writer race wins" scenarios. Test count 1455 → 1456.
- **Hunter submission verification — per-format URL coverage + Apify post-scraping** (2026-04-18, branch `bounty-submission`, 5 commits, ~3000 LOC, plan at `~/.claude/plans/quizzical-growing-owl.md`) — extends the existing brand-profile Apify scraper to per-submission post-level scraping with a hard approval gate. Three locked product decisions shaped the design: **(1) per-format URL coverage** — if a bounty asks for `INSTAGRAM:[REEL,FEED_POST]` + `TIKTOK:[VIDEO_POST]` the hunter must submit 3 URLs (one per format), no extras; **(2) eligibility verified from cached `UserSocialHandle`** (refreshed at hunter login) — zero extra Apify cost; **(3) hard approval gate with per-URL retry** — brand can't approve until every URL is `VERIFIED`, failed URLs trigger a hunter resubmit flow that re-scrapes only the failed ones (verified scrapes cached). Built via 3-agent parallel implementation on isolated worktrees (PR 2/3/4 simultaneously), each cherry-picked back into the branch. Five PRs:
  1. **PR 1 — Schema + shared types + per-format coverage validator** (`88dffcf`). New `SubmissionUrlScrape` child table + `UrlScrapeStatus` enum (PENDING / IN_PROGRESS / VERIFIED / FAILED) + `PostFormat` enum (mirrors the shared TS enum). New shared types: `ProofLinkInput`, `ScrapedPostData`, `VerificationCheck`, `SubmissionUrlScrapeInfo`. Pure-function validator at `apps/api/src/modules/submissions/submission-coverage.validator.ts` — checks every required (channel, format) pair has a URL, hostname matches `CHANNEL_URL_PATTERNS`, path matches `FORMAT_URL_HINTS` where defined (Instagram `/reel/`, `/p/`, `/stories/`; TikTok `/video/`; Facebook intentionally pattern-free), no extras, no duplicates. Wired into `SubmissionsService.create` + `updateSubmission` before the `$transaction`. **BREAKING**: `CreateSubmissionRequest.proofLinks` shape changed from `string[]` to `ProofLinkInput[]` (required, not optional). Migration uses idempotent `IF NOT EXISTS` + `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null` pattern from batch 13A.
  2. **PR 2 — Apify post-scraping + verification orchestration** (`6e94f58`). Three new `ApifyService` methods (`scrapeInstagramPosts` / `scrapeTiktokPosts` / `scrapeFacebookPosts`) that batch URLs per channel into a single actor call (cost optimization — `apify/instagram-scraper.directUrls`, `clockworks/tiktok-scraper.postURLs`, `apify/facebook-posts-scraper`). Three new mappers normalize per-actor output → shared `ScrapedPostData`. New `SubmissionScraperService` orchestrates: per-submission Redis lock (`apify:scrape-lock:submission:{id}`), cost guard (skip Apify entirely when bounty has no `engagementRequirements`, no `payoutMetrics`, `contentFormat === BOTH`, no meaningful `structuredEligibility`), filter to PENDING-only URLs (cache VERIFIED scrapes across resubmits), eligibility lookup from `UserSocialHandle`, batched per-channel actor calls in parallel, verification computation, atomic upsert of all results. Pure `compute-verification-checks.ts` extracted for unit testability — covers 10 rule types: `tagAccount`, `mention`, `minViews`/`minLikes`/`minComments`, `contentFormat`, `formatMatch`, `minFollowers`, `publicProfile`, `minAccountAgeDays`. Trigger fires via `setImmediate` after `$transaction` commits (matches existing `auth.service.ts:155-165` fire-and-forget pattern). `urlScrapes` eager-loaded in all five response builders (`createSubmission`, `listMySubmissions`, `listForBounty`, `findById`, `updateSubmission`). Hard approval gate in `SubmissionsService.review()` rejects `APPROVED` transition with `BadRequestException({details: [...]})` if any URL is not VERIFIED. P2025 (row deleted mid-scrape) caught and logged-only.
  3. **PR 3 — Per-format submit form + resubmit-only-failed UI** (`018524d`). Submit page rewritten — `formatPairs = useMemo(...)` derived from `bounty.channels` renders one `<VerifiedLinkInput>` per (channel, format), labelled e.g. "Instagram REEL URL *". No add/remove buttons (no extras). Client-side validation mirrors the backend (CHANNEL_URL_PATTERNS regex). Detects existing `NEEDS_MORE_INFO` submission with FAILED `urlScrapes` → switches to resubmit mode: VERIFIED rows render read-only with green ✓ + "Already verified" badge, FAILED rows render editable with the prior `errorMessage` shown above. Submit handler patches the full set; backend re-scrapes only PENDING/FAILED rows. `apps/web/src/lib/api/submissions.ts` updated to send `proofLinks` as a JSON blob in FormData (legacy `forEach append` pattern was incompatible with `ProofLinkInput[]`).
  4. **PR 4 — Brand verification panel + approval gate UX** (`d7f2752`). New `<VerificationReportPanel>` component renders nothing for empty `urlScrapes` (no-rule bounty), spinner + "Verifying social posts..." while any URL is PENDING/IN_PROGRESS, then per-URL `glass-card` panels with status badge (emerald VERIFIED / rose FAILED), channel + format label, scraped metrics row compared side-by-side with `submission.reportedMetrics` (hunter claimed vs scraped), per-rule check list with `pi-check-circle` / `pi-times-circle` + required vs actual values. Failed URLs surface `errorMessage` in a red-tinted box. `<ReviewActionBar>` extended with `urlScrapes` prop — Approve disabled when `!allVerified` (empty array vacuously true so no-rule bounties stay approvable), tooltip explains why, "Needs More Info" reviewer note auto-prefilled with failure reasons (one-shot `useRef` flag prevents clobbering once user edits). New `useSubmissionWithPolling` hook in `apps/web/src/hooks/useSubmissions.ts` polls every 3s while any URL is in-flight, stops once all settled. Wired only on the brand review page; participant pages keep the static fetch.
  5. **Cleanup — redirect Update Submission button + delete redundant route** (`f8c601e`). The legacy `/my-submissions/[id]/update` page used the old flat `string[]` proofLinks shape and became dead code the moment PR 3's resubmit-only-failed flow landed on the per-format submit page. Deleted the route; the "Update Submission" button on `/my-submissions/[id]` now routes to `/bounties/{bountyId}/submit` (which auto-detects NEEDS_MORE_INFO state and switches into resubmit mode). `.gitignore` gains `.claude/scheduled_tasks.lock` + `.claude/worktrees/` to keep Claude Code session artefacts out of git.

  **Phase 2 deferred** (not blocking — flagged in plan): PostVisibility re-checks via scheduled re-scrape (`MUST_NOT_REMOVE` / `MINIMUM_DURATION` enforcement after deadline — needs new cron + history table); bounty-detail "rules to be auto-verified" preview (same `<VerificationReportPanel>` shape rendered with `actual: null` so brands see the assist before any submissions); stuck-PENDING recovery sweep (handles `setImmediate` lost across process restart). Costs: per-channel batching keeps the bill linear in submissions, not URLs; cost-guard zeroes the bill for no-rule bounties; per-bounty caps deferred until real-spend data justifies them. Risks documented inline in the plan file.

- **Hunter submission verification — Phase 2 follow-ups (visibility re-check + preview + recovery)** (2026-04-18, branch `phase2-postvisibility-recheck`, 7 commits, ~1900 LOC, all three Phase-2 deferred items shipped in one parallel-agent pass) — the three follow-ups flagged in `~/.claude/plans/quizzical-growing-owl.md` were spec'd into self-contained briefs and built simultaneously by 3 worktree-isolated agents (same pattern as Phase 1's PR 2/3/4), then cherry-picked back. One conflict on `submissions.module.ts` (both 2A and 2C added providers — trivial merge). Three threads:
  1. **Phase 2A — PostVisibility re-check scheduled cron** (`f24bde6`, `3be5582`, `5e8ec37`). New `submission-visibility.scheduler.ts` runs `@Cron(EVERY_6_HOURS)` with Redis pass-lock (`apify:scheduler-lock:visibility-recheck`). Cadence buckets: every 24h days 1–7 since approval, every 72h days 8–30, every 7d days 31+; capped at 90d for `MUST_NOT_REMOVE`, capped at `approvedAt + minimumDurationDays` for `MINIMUM_DURATION`. `MAX_PER_RUN = 100` ordered by oldest `lastVisibilityCheckAt` first to avoid starvation. New `SubmissionScraperService.rescrapeForVisibility(submissionId)` snapshots prior state to `SubmissionUrlScrapeHistory` (new append-only table), resets PENDING, calls existing `scrapeAndVerify`, increments `consecutiveVisibilityFailures` on failure or resets on success. Two-failures-in-a-row threshold triggers `RefundService.requestAfterApproval(submissionId, 'Auto-detected: post no longer accessible after N consecutive scrape failures', systemUser)` AND brand+hunter notification emails (new `post-removed-brand.hbs` + `post-removed-hunter.hbs`). First failure logs + `KbService.recordRecurrence({ category: 'post_visibility', system: 'submission-scraper', severity: 'medium', errorCode: 'POST_VISIBILITY_FIRST_FAILURE' })` so admins can see emerging issues. Migration adds 3 columns to `submissions` (`approvedAt`, `lastVisibilityCheckAt`, `consecutiveVisibilityFailures`) plus the new history table — idempotent `IF NOT EXISTS` throughout. New `AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND` constant. SubmissionDetailResponse extended with the 3 new fields, `lastVisibilityCheckAt`/`consecutiveVisibilityFailures` SUPER_ADMIN-gated in the response builder. +10 tests covering lock contention, no-eligible-no-op, single-submission re-scrape, second-failure refund trigger, MUST_NOT_REMOVE 90d cap, MINIMUM_DURATION cap, MAX_PER_RUN honored.
  2. **Phase 2B — Bounty-detail "rules to be auto-verified" preview** (`264ae71`, `0251ca5`, `a60342f`). New `apps/web/src/lib/utils/bounty-preview-checks.ts` pure function `derivePreviewChecks(bounty)` returns `Record<string, VerificationCheck[]>` keyed by `${channel}_${format}` plus a synthetic `__eligibility__` group. Mirrors `compute-verification-checks.ts` rule emission but with `actual: null`. `<VerificationReportPanel>` extended via discriminated-union props (`SubmissionPanelProps | PreviewPanelProps`) — no breaking change for the existing brand-review consumer. Preview branch renders per-rule rows with `pi-shield text-accent-cyan` icons (no pass/fail since `actual` is null), eligibility group rendered above per-URL groups when present, headings swap by `audience` ("Auto-verification preview" for brands / "What you'll need to pass" for hunters; eligibility group title swaps to "Hunter eligibility" / "About you"). Empty-state collapse when bounty has zero rules — "No auto-verification rules — submissions go straight to manual review." Wired into both `apps/web/src/app/business/bounties/[id]/page.tsx` and `apps/web/src/app/(participant)/bounties/[id]/page.tsx`. +25 tests across 5 describe blocks (empty bounty, eligibility-only, all-10-rules, partial rules, multi-channel coverage).
  3. **Phase 2C — Stuck-PENDING scrape recovery sweep** (`920e605`). New `submission-scrape-recovery.scheduler.ts` runs `@Cron(EVERY_5_MINUTES)` with Redis pass-lock (`apify:scheduler-lock:scrape-recovery`, 4-min TTL — shorter than the 5-min cadence so the next tick can claim it). Queries `WHERE scrapeStatus = 'PENDING' AND createdAt < now() - interval '5 minutes'`, distinct by `submissionId`, `MAX_PER_RUN = 50`, ordered oldest-first. Calls existing `SubmissionScraperService.scrapeAndVerify` via `Promise.allSettled` (per-submission lock + idempotent PENDING-only filter handle the contention case). Lock-release `redis.del()` wrapped in `.catch()` so transient Redis blips can't crash the cron; lock NOT released when not acquired. +6 tests: lock contention, empty result, single dispatch, multi-dispatch with intra-submission distinct dedup, isolated scraper rejection containment, 5-minute cutoff filter.

  **Two infra gotchas surfaced during integration** (worth knowing for future cherry-pick passes): (a) `npm run db:generate` writes only into `packages/prisma/node_modules/.prisma/client/` — `apps/api/node_modules/.prisma/client/` is independent and stale until `rsync -a --delete packages/prisma/node_modules/.prisma/client/ apps/api/node_modules/.prisma/client/` (or a workspace reinstall). The Phase 2A agent hit this in its worktree too. (b) `packages/shared` must be rebuilt (`npm run build:shared`) after any constants/DTO addition or api tests fail with "Property 'X' does not exist on type" against the stale `dist/` — affected `AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND` here.

  **Still deferred** (out of scope for this pass): admin-facing visibility-failure surface (Phase 3 — would render `consecutiveVisibilityFailures` and history rows in the existing finance/KB dashboards); bounty-form preview during creation (separate UX decision — preview only renders on the saved bounty detail page for now); per-bounty/per-hunter cost caps on the visibility scheduler (defer until real-spend data justifies them).

- **Hunter submission verification — Phase 3 hardening + admin surface + analytics + ADR 0010** (2026-04-18, branch `phase3-visibility-hardening`, 15 commits, ~3300 LOC, all three Phase-2 deferrals + ADR-worthy auto-refund policy gap closed in one parallel-agent pass + one direct ADR write) — addressed the genuinely consequential gap that Phase 2A's auto-refund created (platform spending money based on Apify scrapes without a human in the loop) plus the deferred admin/preview/analytics surfaces. Built via 4 worktree-isolated agents simultaneously (3A, 3B, 3C, 3D) while I wrote the ADR. One conflict at integration on `submissions.module.ts` (already resolved in Phase 2 pattern) plus several additive merges in `finance-admin.service.ts` / `finance-admin.controller.ts` / `admin.dto.ts` / `useFinanceAdmin.ts` between 3B and 3D (both extending the same finance-admin surface — all additive, resolved by keeping both blocks). Plus one fixture fix (`MOCK_BOUNTIES.accessType`) chipped during the 3C work and merged inline. Five threads:
  1. **ADR 0010 — auto-refund-on-PostVisibility-failure** (`b7f5e86`). Documents the policy: 2-failure threshold (one failure could be Apify hiccup; two across a ≥6h gap is real signal), first-failure observable but not actionable (KB recurrence + hunter-only warning email; brand stays quiet), second-failure triggers `RefundService.requestAfterApproval` + brand+hunter notification + audit log + counter reset, kill-switch is absolute and fail-closed (`isKillSwitchActive().catch(true)` so a transient DB read failure biases toward not moving money), per-bounty cost cap of 30 re-scrapes lifetime, audit-trail contract (LedgerTransactionGroup + AuditLog + history row + KB recurrence), explicit risks including "Apify systemic failure causes mass false refunds" with the manual kill-switch + Phase 3D analytics as mitigation. Honours ADR 0006 (the visibility scheduler is NOT added to the kill-switch bypass list).
  2. **Phase 3A — visibility scheduler hardening** (`d296004`, `771cadb`, `5c1bcd9`, `5a7c73c`). Three changes to `submission-visibility.scheduler.ts` + supporting code. (i) **Kill-switch gate**: `LedgerService.isKillSwitchActive()` consulted only when about to refund (skip the per-tick DB hit on healthy submissions); on active → refund deferred, counter held at `previousConsecutive` (typically 1) NOT pinned at 2 so the row never looks post-hoc like 3+ failures occurred. Read failure caught and treated as active. (ii) **First-failure hunter warning email**: new `post-visibility-warning-hunter.hbs` template + `MailService.sendPostVisibilityWarningHunterEmail` method, fired on the 0→1 counter transition, never on 1→2 (the refund email handles that one), wrapped fire-and-forget try/catch. (iii) **Per-bounty cost cap**: `MAX_VISIBILITY_RESCRAPES_PER_BOUNTY = 30` lifetime, counted across all submissions of the bounty by `SubmissionUrlScrapeHistory` rows; one aggregate query per tick (no N+1), once-per-bounty log + KB recurrence (`VISIBILITY_RESCRAPE_CAP_REACHED`). +8 tests across 3 new describe blocks.
  3. **Phase 3B — admin visibility-failure surface** (`248bd73`, `778978a`, `79c05f0`, `56b65c8`). Two new SUPER_ADMIN-gated endpoints: `GET /admin/finance/visibility-failures` (paginated list of submissions with `consecutiveVisibilityFailures > 0`, ordered by failure-count desc; one Prisma query with includes, no N+1) and `GET /admin/finance/visibility-failures/:submissionId/history` (per-submission `SubmissionUrlScrapeHistory` rows newest-first). New DTOs `VisibilityFailureRow` + `VisibilityHistoryRow` + `AdminVisibilityFailureListResponse`. Frontend: new `/admin/finance/visibility-failures` page with PrimeReact DataTable (Bounty / Brand / Hunter / Approved at / Last checked / Failures Tag colour-coded emerald-amber-rose / Latest error truncated / History "View (N)" button → 90vw modal with per-history-row card showing channel + URL + status + scraped metrics + error message in rose-tinted box). Top-of-page banner reads open KB issues with `category: 'post_visibility'` and shows critical-severity ones in a red alert. New "Visibility Failures" nav entry slotted between Refunds and Exceptions. Admin submission detail page (`/admin/submissions/[id]`) gains a conditional "Visibility check status" panel when `consecutiveVisibilityFailures > 0` with explicit "Threshold reached — auto-refund will be issued by next visibility scheduler tick (ADR 0010)" red callout when count ≥ 2 + link to the new failures page. +19 api tests; no new web jest (page follows existing finance-pages integration-only convention).
  4. **Phase 3C — bounty form auto-verification preview during creation** (`2208046`, `0ab6c68`). `derivePreviewChecks` refactored to accept a smaller `BountyPreviewInput` slice (so both `BountyDetailResponse` from saved bounties and `BountyFormState` from the in-progress form satisfy it). `<VerificationReportPanel>` `audience` enum widened to add `'brand-form'` for context-appropriate empty-state copy ("Nothing to auto-verify yet — Select channels and add rules to preview"). New `<AutoVerifyPreviewAccordion>` collapsible (closed by default, `pi-shield` icon, sits under Section 3 Bounty Rules in the form) renders the panel live as the brand types — no extra API call, derives from form state. Mobile-tight design tokens. +13 web tests + 1 new test suite.
  5. **Phase 3D — visibility analytics** (`f010a8f`, `296f6f2`, `a341049`). New `GET /admin/finance/visibility-analytics?windowHours=24` endpoint backed by single `prisma.$queryRaw` join across `submission_url_scrape_histories` and `submission_url_scrapes`, grouped by `(channel, scrapeStatus)`. PENDING/IN_PROGRESS rows count toward `total` but NOT toward the failureRate denominator (transient rows would otherwise drag the rate down between scheduler ticks). Two-tier alert thresholds with sample-size floors: warning at `failureRate ≥ 0.30 AND total ≥ 10`, critical at `≥ 0.50 AND total ≥ 20` — tiny-sample noise (a 2/4 split) never trips a critical alert. New DTOs `VisibilityFailureBucket` + `VisibilityAnalyticsAlert` + `VisibilityAnalyticsResponse`. Frontend: new "Visibility Failure Rate (24h)" section on `/admin/finance/insights` above the existing per-system grid, per-channel DataTable with rate column emerald `<10%` / amber `10–30%` / rose `>30%`, PrimeReact `<Message>` alerts above the table when service emits any. Polls every 30s. +16 api tests covering empty window, all-VERIFIED, mixed rate, transient-row exclusion, warning + critical thresholds, sub-floor false-positive suppression, multi-channel isolation, totals roll-up, controller clamp + NaN fallback.

  **Plus one inline cleanup** (`cdc0351`): `MOCK_BOUNTIES` fixture in `apps/web/src/app/admin/component-library/_components/sections/OrganismsSection.tsx` was missing the `accessType: BountyAccessType.PUBLIC` field that landed in commit `da71b0a` (2026-04-17). Pre-existing `next build` failure spotted by Phase 3C's agent; fixed inline as part of the close-out.

  **Smoke-checked**: API boot to module-init phase confirmed clean DI for `SubmissionVisibilityScheduler` (with new `LedgerService` dependency), `SubmissionScrapeRecoveryScheduler`, and the three new admin routes — `/admin/finance/visibility-failures`, `/admin/finance/visibility-failures/:submissionId/history`, `/admin/finance/visibility-analytics` — all registered cleanly. Boot crashed on EADDRINUSE because there's a 2h-old API instance still on port 3001 (user's dev session); not a Phase 3 issue, just means user needs to restart their dev API to pick up the new code.

  **Still deferred for Phase 4+**: pre-refund "is this a global outage?" check inside the scheduler (cross-submission failure-rate aggregation distinct from Phase 3D's admin-facing analytics — defer until real-incident data shows a need); per-hunter rate limit on auto-refunds (defer until pattern data exists); refund-decision human review queue (commercial-pressure-driven, behind a feature flag if added); KB analytics for non-visibility categories on the same insights surface.

- **Mobile UX pass + bounty form polish** (2026-04-17, branch `hunter-profile-update` → merged in `f827879`, 26 commits, 37 files, +885/-391) — comprehensive bounty-form rework driven by hands-on mobile testing. Five threads:
  1. **Component-library mobile tightening** (`844bec7`, `b86282a`) — 8 components shrunk for mobile (text + spacing scale one step down at `<sm:`, padding tightened, no h-scroll). Historical Mobile Tightening Checklist (originally `DESIGN-SYSTEM.md §10`, now superseded by the Claude Design handoff bundle at `apps/web/src/styles/design-system/`).
  2. **PrimeReact theme fixes** — Dropdown double-border (cascading global `.p-inputtext` border was painting an inner border inside the wrapper, fixed in `af4b7a8`); single-line form-controls locked to 2.5rem (40px) — now `min-height: 2.5rem` in `components.css:.input` (d19db0d); Toast width constrained to viewport on mobile to stop right-edge overflow (`fae4cf8`).
  3. **Bounty-form UX** — multiple coordinated changes. Toggle-row inputs stack on mobile (`559f268`); Access Type options stack on mobile (`9d4ba79`); brand-asset filename overflow fixed (`0016bca`); Cancel button removed from footer (`3b588ca`); footer fully reshaped — label-left/amount-right, single-row mobile layout ~52px tall, dropped "N/M complete" duplicate progress indicator (`9025a3a`, `d6faa9b`, `4b68f4f`, `9ba7b11`, `0f121b2`); section-status icons → Required / Optional / Complete pills with `optional?: boolean` + `hasContent?: boolean` props on `SectionPanel` (`74798d0`, `279682a`); Required `*` markers added to every submission-required field (`0d3204f`); CASH rewards skip description input (auto-fill `name='Cash'` in reducer, hide UI, skip name validation) (`adb1ec8`); TikTok auto-selects Video Only and disables Photo Only when picked (`b9b8653`); Duration + Unit inputs split 50/50 on mobile (`e5711ba`); fixed-footer pads form `pb-[calc(...)]` with `env(safe-area-inset-bottom)` (`869c9df`).
  4. **Post-visibility acknowledgment gate removed end-to-end** (`29a3b72`) — frontend toggle, state, action, props all dropped; backend `bounties.service.ts:1053` (DRAFT→LIVE precondition) and `:866` (reset-on-update) gates removed; 5 backend tests rewritten/deleted (VE-21, VE-35, IS-08, two `create-bounty-edge-cases` cases) with `.not.toContain('visibilityAcknowledged')` + `.not.toHaveProperty('visibilityAcknowledged')` regression locks; the `acknowledgeVisibility` controller route + service method kept as documented no-ops for backward compat; column kept on `Bounty` model for historical rows (no destructive migration). All 4 spec docs (`create-bounty-spec.md`, `create-bounty-tests.md`, `create-bounty-ui.md`, `create-bounty-ux.md`) carry `DEPRECATED 2026-04-17` markers.
  5. **Payments — Create-to-checkout shortcut** (`bd2480b`, `0cdb5bb`, `cc46f2f`) — Create Bounty button on the new-bounty form chains directly into `bountyApi.fundBounty()` and the Stitch hosted-checkout redirect (was: navigate to detail page, find "Go Live", trigger payment). Same wiring on the edit page for unpaid DRAFTs (`bounty.status === DRAFT && paymentStatus !== PAID`). New `apps/web/src/lib/utils/redirect-to-hosted-checkout.ts` helper centralises the redirect: production uses `window.location.href` (standard hosted-checkout pattern); dev/preview uses `window.open(_blank)` so iframe-sandboxed previews (Claude Preview, staging tools) can exercise the flow without same-page navigation being blocked. Wired into all 4 redirect call-sites.
  6. **Bounty Rules pill correction + form-render fix** — Bounty Rules was showing "Complete" on page-load because `proofRequirements` is auto-seeded `['url']` to match the inline "post links required" notice. Marked the section `optional` with `bountyRulesHasContent(state)` helper (eligibility filters, engagement requirements, post visibility, max submissions) so the pill reads "Optional" until the brand engages.

**Documentation layout (reorganized 2026-04-15, committed in `b4f96ac`):**
- Repo root now holds only `claude.md`; four loose docs (`AGENTS.md`, `RELEASE-NOTES.md`, `SPRINT-PLAN.md`, `payment-gateway-review.docx`) moved into `md-files/` on 2026-04-15. The fifth (`DESIGN-SYSTEM.md`) was removed on 2026-04-18 when the Claude Design handoff bundle replaced it — canonical location is now `apps/web/src/styles/design-system/`.
- Nine per-role agent specs moved into `md-files/agents/` (entry point: `md-files/agents/agent-overview.md`).
- Outdated 2026-03-27 codebase audit archived at `md-files/archive/AUDIT-REPORT-2026-03-27.md`; still cited from `docs/SECURITY-COMPLIANCE.md` and `docs/BACKUP-STRATEGY.md` as historical evidence.
- Live cross-references rewritten in 13 files (2 ADRs, `docs/contributing.md`, `docs/BACKUP-STRATEGY.md`, `docs/SECURITY-COMPLIANCE.md`, 2 review audits, etc.). `git mv` preserved history on all tracked moves.

**Explicitly gated — do not remove without Team Lead sign-off:**
- `PAYOUTS_ENABLED=false` — outbound rail is compiled and adapter-routed but inert; flipping requires live TradeSafe creds (ADR 0008/0009).

**Out of scope for this MVP cycle:**
- **TradeSafe live integration** (ADR 0009) — adapter scaffolded in batch 10A; live endpoint paths speculative pending commercial onboarding. **R24** in risk register.
- **Standalone TradeSafe escrow layer** alongside platform custody (ADR 0003, still in force for that scope).
- **Peach Payments** — superseded by ADR 0008; markers in source read `TRADESAFE MIGRATION (ADR 0008)` (8 sites).

**Open risks:** R24 (TradeSafe creds — external blocker). R25/R26/R27/R28/R29/R30 closed. Post-readiness-pass risks:
- **R31** (Open) — dispute-reserve liquidity on Stitch side; commercial gap, needs ballpark figure from Team Lead.
- **R32** (**Closed 2026-04-18**, commits `0d141c2` + `6657aa3`) — `checkStitchVsLedger` → `checkPayoutsVsLedger`; covers both Stitch + TradeSafe payouts via a new `StitchPayout.provider` column (PayoutRail enum, default STITCH). New migration `20260418010000_add_payout_provider_rail` applied to staging. Fault-injection test added for the TradeSafe branch.
- **R33** (**Closed 2026-04-18**, commits `050ad95` + `24b18db`) — `TradeSafeCallbackController` at `GET /api/v1/auth/tradesafe/callback` lives under `modules/tradesafe/` (URL `auth/` is namespace, not module). `@Public()`, not kill-switch-gated (hunter mid-flow). Replay idempotent via existing `UNIQUE(provider, externalEventId)` on `webhook_events`. VERIFY_WITH_TRADESAFE items open for signature scheme + state-param scheme (scaffolded with TODO markers; pinned by a future TradeSafe-OAuth ADR).
- **R34** (**Closed 2026-04-18**, commits `3620fbc` + `d7b4828` + `6d6311f` + `0851efb` + `f88ac57`) — `WebhookRouterService.dispatch` gains `tradesafe.*` arms + new `TradeSafeWebhookHandler` with 3 domain methods (`beneficiary.linked`, `payout.settled`, `payout.failed`). Full 5-test matrix per handler (happy path × retry idempotent × partial rollback × webhook replay × concurrent writer) = 15 handler tests + 1 router dispatch test + extended event-name mapping tests. Handler uses `LedgerService.postTransactionGroup` — no kill-switch bypass; AuditLog in the same transaction; `UNIQUE(referenceId, actionType)` for idempotency. VERIFY_WITH_TRADESAFE residual: exact event name strings vs sandbox (TODO(R34) markers).
- **R35** (**Closed 2026-04-18**, commit `552f93a`) — `TRADESAFE_OAUTH_REDIRECT_URL` / `_SUCCESS_URL` / `_FAILURE_URL` added to `env.validation.ts` gated by `@ValidateIf((o) => o.PAYOUTS_ENABLED === 'true')` (mirrors `BENEFICIARY_ENC_KEY` R29 gate) + added to `.env.example` with ADR 0009 cross-reference. +7 validation tests.
- **R36** (Open) — no auto-retry after kill-switch-blocked inbound webhook; Stitch returns 200, no retry. Recovery via reconciliation + compensating entry.
- **R37** (Open) — multi-recipient TradeSafe payout API shape unverified (VERIFY WITH TRADESAFE).
- **B1** (Closed 2026-04-18, commit `5ba7b60`) — `STITCH_API_BASE` URL fixed in go-live-checklist.
- **B2+B3** (**Closed 2026-04-18**, commit `efd3760`) — `docs/INCIDENT-RESPONSE.md` gains §5.5 kill-switch procedure + Stitch payment-provider contact placeholders swapped in for the stale `[Stripe/Payment Provider]` slot. Pre-launch banner added at top warning contact placeholders must be filled before cutover.

**Four BLOCKERS closed, three residuals all contingent on commercial onboarding (R24 creds + R31 liquidity + R36/R37 vendor-verify items).** Engineering state for TradeSafe outbound flip is now complete: schema migration live on staging, env validation in place, OAuth callback exists, webhook handlers exist, reconciliation covers both rails. `PAYOUTS_ENABLED=false` remains the operator-side gate.

**References for future agents:**
- `docs/STITCH-IMPLEMENTATION-STATUS.md` — implementation log.
- `docs/adr/0001` through `docs/adr/0009` — 9 architectural decisions.
- `docs/reviews/2026-04-15-team-lead-audit-batch-*.md` — audits for batches 2–11, 13 (batches 12 & 14 delivered without formal audit write-ups; individual agents self-verified).
- `docs/reviews/2026-04-15-r28-migration-reconciliation.md` — migration reconciliation evidence.
- `docs/reviews/2026-04-15-orphan-sweep.md` — codebase hygiene inventory.
- `docs/perf/2026-04-15-reconciliation-benchmarks.md` — perf report + mitigation evidence.
- `apps/web/src/styles/design-system/` — canonical design system (Claude Design handoff bundle, 2026-04-18). README + SKILL + token CSS + component CSS + 5 preview HTMLs + wordmark asset.

---

# Knowledge Base & Financial Integrity Framework

## 1. Purpose

This section extends the rules above with an operational framework for:
- Financial integrity protection
- Recurring-issue detection
- Claude decision support before any fix

This is not a changelog. It is a system-memory and control layer.

## 2. Core Principle

If an issue recurs, treat it as a structural flaw, not a bug. Every fix must aim to eliminate recurrence, not just the symptom.

## 3. Agent Routing (extends Hard Rule #8)

All development work routes through `md-files/agents/agent-overview.md` → `md-files/agents/agent-team-lead.md`.

Claude may:
- Analyse the task
- Propose a root cause and candidate fix
- Draft code or schema changes for review

Claude must not:
- Merge, deploy, or finalise implementation without Agent Team Lead assignment
- Bypass the agent workflow for "quick fixes" — especially financial ones

## 4. Financial Non-Negotiables

Payment provider: **Stitch Express** (see `md-files/payment-gateway.md` for the canonical payment spec). All fee rates, clearance rules, state machines, and webhook handling live there.

Every financial mutation must satisfy all of the following:

1. **Double-entry**: debits equal credits within the transaction.
2. **Idempotency**: enforced at the DB level via `UNIQUE(referenceId, actionType)`.
3. **Transaction group integrity**: all steps commit or roll back together (single DB transaction or saga with compensation).
4. **Integer minor units**: amounts stored as integers (cents), never floats.
5. **Append-only ledger**: no updates or deletes; corrections are compensating entries.
6. **AuditLog entry**: required for every mutation (ties to Hard Rule #3).
7. **Retry-safe**: handlers must tolerate timeouts, retries, and webhook replays.
8. **Platform custody**: all funds flow through platform-controlled custody. No direct brand-to-hunter payments.
9. **Plan snapshot**: tier (Free / Pro) is snapshotted onto each transaction at creation time. In-flight transactions are never re-priced on plan change.
10. **Global fee independence**: the 3.5% global platform fee is calculated independently of tier admin fee / commission, stored in its own ledger account (`global_fee_revenue`), and shown as a separate line in all UI and reports.

Violating any of these without written justification in the PR is a blocker.

## 5. Required Tests for Financial Code

Every function that writes to the ledger must have:
- Unit test: happy path
- Unit test: duplicate/retry call produces no second entry
- Integration test: partial failure rolls back the full transaction group
- Integration test: webhook replay is idempotent

No ledger-touching PR merges without these.

## 6. Known Failure Patterns (check first)

Before proposing a fix, Claude checks `md-files/knowledge-base.md` for prior occurrences of:
- Idempotency failures
- Race conditions on shared resources (wallets, claims)
- Retry duplication
- Webhook replay
- Missing input validation
- Config drift between environments

## 7. Claude's Workflow for Any Fix

1. Read `md-files/knowledge-base.md` for similar prior incidents.
2. If payment-related, read `md-files/payment-gateway.md` (canonical) and `md-files/financial-architecture.md` (mechanics) and verify the change against Section 4.
3. Identify root cause — not just the symptom. State it explicitly.
4. If the issue has occurred before, propose a structural fix, not a patch.
5. Route implementation via Agent Team Lead.
6. After resolution, log a KB entry (template: `md-files/knowledge-base.md#entry-template`).

## 8. Definitions

**Recurrence**: two or more occurrences of the same root cause within 90 days. A recurring issue requires a structural fix, not a patch.

**Severity**:
- **Critical**: financial loss possible, data corruption, or auth bypass.
- **High**: user-facing failure of a core flow (claim, submit, payout).
- **Medium**: degraded experience with a workaround.
- **Low**: cosmetic or rare edge case.

**Financial Impact**:
- **Critical**: incorrect money movement possible.
- **High**: reconciliation drift without user loss.
- **Medium**: reporting or display error only.
- **Low / None**: no ledger or balance effect.

## 9. Automatic KB Entry Triggers

A KB entry is mandatory whenever any of these occur:
- Duplicate transaction detected
- Ledger imbalance detected
- Reconciliation mismatch
- Same root cause seen twice (recurrence threshold hit)
- Any Critical or High financial-impact incident

## 10. Escalation

On detection of a Critical severity or Critical financial-impact issue, Claude must:
1. Stop proposing code changes.
2. Recommend invoking the Financial Kill Switch (pause payouts) if ledger integrity is in doubt.
3. Flag the issue to Agent Team Lead with severity, suspected root cause, and affected transaction groups.

## 11. Referenced Files

- `md-files/payment-gateway.md` — **canonical** Stitch Express spec: flows, fees, clearance, states, webhooks, refunds, reconciliation rules
- `md-files/financial-architecture.md` — ledger mechanics, idempotency patterns, reconciliation engine
- `md-files/knowledge-base.md` — KB schema, entry template, example entries
- `md-files/admin-dashboard.md` — Finance Reconciliation Dashboard, kill switch, KB insights
- `md-files/implementation-phases.md` — Phase 1–4 delivery plan (payments → reconciliation → dashboard → KB automation)
- Stitch Express API: https://express.stitch.money/api-docs
- Svix webhooks: https://docs.svix.com/receiving/introduction

## graphify

This project has a graphify knowledge graph at `graphify-out/`. Current state: **2450 nodes · 4870 edges · ~142 communities · 84% of nodes in the main component**.

### Rules

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files. The 10 highest-degree nodes (`BountiesService`, `FinanceAdminService`, `AdminService`, `SubscriptionsService`, `DisputesService`, `SubmissionsService`, `UpgradeService`, `Social Bounty MVP`, `Design System README`, `Page Specs Index`) have LLM-written `## Summary` blocks — start there for these topics.
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files.
- The graph auto-rebuilds on every `git commit` via a post-commit husky hook (AST-only, no LLM cost). No manual `graphify update .` needed for code changes.
- For docs/image changes (which require semantic re-extraction), run `graphify update .` manually.

### Using the MCP server

`.mcp.json` registers a `graphify` stdio MCP server at project scope. Parallel sub-agents can call `query_graph`, `shortest_path`, `get_community`, `god_nodes`, `graph_stats` without loading the full `graph.json` into their context. First-time setup requires the `mcp` Python package in graphify's env: `uv tool install --reinstall graphifyy --with mcp --with sentence-transformers`.

### Included node/edge enrichments beyond the base extraction

- **Dedupe pass** — merged 570 redundant nodes (ADR variants, file-level ID collisions from the extractor, concept duplicates). ADRs now have a single canonical node each.
- **`packages/shared` wiring** — the barrel export's 18 re-exported DTO/enum/ledger files are explicitly linked from `index.ts`, so shared types aren't orphaned from their consumers.
- **Doc → code rationale edges (20)** — canonical specs (`payment-gateway.md`, `financial-architecture.md`, `knowledge-base.md`, `admin-dashboard.md`, `brand-profile-and-signup.md`) and ADRs 0002/0005/0006/0008/0009/0010 link directly to the service files that implement them.
- **Test ↔ impl edges (57)** — `*.spec.ts` files link to their sibling `*.ts` via a `tests` relation (pattern match, including `__tests__/` subdirs).
- **Git-activity overlay** — every file-level node carries `last_touched_days_ago`, `commits_last_90d`, `commits_total` attributes. Query or inspect the graph to see hot vs. stale zones.
- **Embedding similarity edges (1146)** — `all-MiniLM-L6-v2` (local CPU, cached at `graphify-out/.embeddings.npz`) produces cross-community `semantically_similar_to` edges at cosine ≥ 0.80. Surfaces parallel constructs the chunked extraction missed (e.g. `useBrowseFilters` ↔ `useManageFilters` sort mappers).
- **Content-based community labels** — stored in `graphify-out/.community-labels.json`, derived from each community's top-degree members rather than rank order. Stable across re-clusterings.

### Tooling exclusions

- `.graphifyignore` excludes `node_modules/`, `dist/`, `.next/`, build artefacts, secrets, and third-party clones (was `design-os-main/`, `product-plan/`).
- `scripts/check-kill-switch-bypass.sh` excludes `graphify-out/**` (the graph quotes ADR 0006 prose as descriptive data; same class of exclusion as `docs/reviews/` and the ADR itself).
- `.gitignore` excludes `graphify-out/cache/`, `graphify-out/manifest.json`, `graphify-out/cost.json`, `graphify-out/.embeddings*` — everything else under `graphify-out/` is committed.

### Onboarding automation

`npm install` triggers `scripts/install-graphify-hook.sh` (via the `prepare` script) which idempotently appends the graphify block to husky's post-commit + post-checkout hooks. Silently no-ops if `graphify` isn't on PATH, so `npm install` never fails — just prints a one-line install hint (`uv tool install graphifyy --with mcp`).
