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
                    # AGENTS (team roster), DESIGN-SYSTEM, SPRINT-PLAN, RELEASE-NOTES
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

## Current Implementation Status (2026-04-16)

HEAD: `f5353d2 fix: bounty form no longer sneaks proofRequirements into drafts`. Test state: **1453 tests across 85 suites, 100% green** — api 1190 / 77 suites + web 263 / 8 suites (Hard Rule #4 held). Web jest came back online this cycle after a TypeScript 6.0 config fix; it had been silently broken before. Working tree is clean apart from build artifacts (`tsconfig.tsbuildinfo`, `apps/web/test-results/`).

**Live and tested:**
- **Stitch Express inbound rail** — brand funding (account debit → platform custody), idempotent via `UNIQUE(referenceId, actionType)`, Svix webhook ingestion with replay-safe handling.
- **Append-only ledger** — double-entry, integer minor units, plan snapshot per transaction, compensating-entry refunds (ADR 0005, 0006).
- **Reconciliation engine** — 7 checks (group balance, duplicate detection, missing legs, status consistency, wallet-projection drift, Stitch-vs-ledger, reserve-vs-bounty). Reserve check runs single GROUP BY (184×–494× faster than per-bounty aggregate). 15-min cadence safe to ~1M paid bounties. Fault-injection coverage for each check.
- **Finance admin dashboard** — kill switch, reconciliation drill-down, exception review, per-system confidence scores. Stat-card response key aligned with the Organisation→Brand rename (`data.brands.total`, fixed 2026-04-15). `getDashboard()` collapsed from 23 parallel `count()` round-trips to 6 `groupBy` queries (2026-04-16, commit `6e110ca`); response shape byte-identical, ~100-150ms → ~30-50ms dashboard load. Transaction-group drill-down audit log rendered a wrong shape (local type declared `auditLog` as array; backend returns single-or-null); swapped to shared `TransactionGroupDetail` and fixed consumer page (commit `2eb7a0a`).
- **KB automation (Phase 4)** — `recordRecurrence` signature-stable and called from reconciliation + webhook-failure paths, Ineffective-Fix auto-flag with AuditLog, `scripts/kb-context.ts` CLI.
- **Subscription lifecycle** — tier snapshot, auto-downgrade state machine, grace period, cancel-at-period-end UI, **live Upgrade CTA** wired to Stitch card-consent (POST `/subscription/upgrade` → hosted consent → `subscription_charged` ledger group).
- **TradeSafe payout adapter scaffold** (batch 10A) — behind `PAYOUT_PROVIDER` flag with mock mode; `PAYOUTS_ENABLED=false` remains the outbound gate; no ledger paths live.
- **Migration history reconciled** (batch 13A) — fresh-DB `prisma migrate deploy` green from empty Postgres; 16 tables, 16 enums, 23 columns, 56 indexes, 22 FKs brought back into migration history via idempotent SQL; `schema.prisma` untouched; existing envs verified no-op via pg_dump snapshot diff.
- **Env validation hardened** (batches 13B + 14A) — 9 previously-unchecked flags now typed at boot; `BENEFICIARY_ENC_KEY` required when `PAYOUTS_ENABLED=true` with 32-char minimum + defence-in-depth throw in `BeneficiaryService` constructor; dead `FINANCIAL_KILL_SWITCH` env removed (operator-misleading; real kill switch is `SystemSetting.financial.kill_switch.active`).
- **Brand route consolidation** (2026-04-16, commit `8e4c21f`) — completed the half-done Organisation→Brand rename. `edit/`, `kyb/`, `members/`, `subscription/` moved from `/business/organisation/*` to `/business/brands/*` via `git mv` (history preserved); `navigation.ts` hrefs repointed; stale "Organisation" breadcrumbs fixed; redirect shim deleted. `/business/brands/edit/` (single-brand, `user.brandId`) and `/business/brands/[id]/edit/` (multi-brand, URL param) coexist intentionally.
- **Bounty form proof-requirements integrity** (2026-04-16, commit `f5353d2`) — a partially-landed refactor left four inconsistencies: `INITIAL_FORM_STATE.proofRequirements` seeded with `['url']` (drafts carried a value the user never selected), `buildCreateBountyRequest` defaulted empty arrays to the literal string `'url'` (draft + full), `isSectionComplete('bountyRules')` hardcoded `return true`, and `validateFull` never checked `proofRequirements`. All four fixed; UX change: the "URL" proof checkbox no longer pre-ticks — brands must explicitly select at least one proof type.
- **Web jest unblocked under TS 6.0** (2026-04-16, commit `a1527ff`) — `apps/web/tsconfig.json` missing `rootDir` (TS5011 promoted to error in 6.0) and ts-jest hard-codes `moduleResolution: Node10` (TS5107 deprecation). Added `rootDir: "./src"` + `ignoreDeprecations: "6.0"`. Web suite went from 8/8 fail at type-check to 8/8 green.
- **Public website styling reference** (2026-04-16, commit `b8e2ce9`) — `docs/brand/WEBSITE-STYLING.md` captures the implemented marketing-site design (tokens, brand colors, Tailwind tokens, layout anatomy, component patterns, accessibility). Cross-referenced from `docs/brand/BRAND-GUIDELINES.md` and `md-files/DESIGN-SYSTEM.md`. Code remains the source of truth.

**Documentation layout (reorganized 2026-04-15, committed in `b4f96ac`):**
- Repo root now holds only `claude.md`; five loose docs (`AGENTS.md`, `DESIGN-SYSTEM.md`, `RELEASE-NOTES.md`, `SPRINT-PLAN.md`, `payment-gateway-review.docx`) moved into `md-files/`.
- Nine per-role agent specs moved into `md-files/agents/` (entry point: `md-files/agents/agent-overview.md`).
- Outdated 2026-03-27 codebase audit archived at `md-files/archive/AUDIT-REPORT-2026-03-27.md`; still cited from `docs/SECURITY-COMPLIANCE.md` and `docs/BACKUP-STRATEGY.md` as historical evidence.
- Live cross-references rewritten in 13 files (2 ADRs, `docs/contributing.md`, `docs/BACKUP-STRATEGY.md`, `docs/SECURITY-COMPLIANCE.md`, 2 review audits, etc.). `git mv` preserved history on all tracked moves.

**Explicitly gated — do not remove without Team Lead sign-off:**
- `PAYOUTS_ENABLED=false` — outbound rail is compiled and adapter-routed but inert; flipping requires live TradeSafe creds (ADR 0008/0009).

**Out of scope for this MVP cycle:**
- **TradeSafe live integration** (ADR 0009) — adapter scaffolded in batch 10A; live endpoint paths speculative pending commercial onboarding. **R24** in risk register.
- **Standalone TradeSafe escrow layer** alongside platform custody (ADR 0003, still in force for that scope).
- **Peach Payments** — superseded by ADR 0008; markers in source read `TRADESAFE MIGRATION (ADR 0008)` (8 sites).

**Open risks:** R24 (TradeSafe creds — external blocker). R25/R26/R27/R28/R29/R30 closed.

**References for future agents:**
- `docs/STITCH-IMPLEMENTATION-STATUS.md` — implementation log.
- `docs/adr/0001` through `docs/adr/0009` — 9 architectural decisions.
- `docs/reviews/2026-04-15-team-lead-audit-batch-*.md` — audits for batches 2 through 13 (batch 14 was small-scope, not audited; individual agents self-verified).
- `docs/reviews/2026-04-15-r28-migration-reconciliation.md` — migration reconciliation evidence.
- `docs/reviews/2026-04-15-orphan-sweep.md` — codebase hygiene inventory.
- `docs/perf/2026-04-15-reconciliation-benchmarks.md` — perf report + mitigation evidence.
- `docs/brand/WEBSITE-STYLING.md` — implemented styling reference for the public marketing site.

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
