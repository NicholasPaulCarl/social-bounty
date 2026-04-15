# Team Lead Audit — Batch 4 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `e643cc0 feat: batch 3 — fix Stitch payout bugs, exports, expired-bounty release, KYB confirm`
**Prior audits:** `docs/reviews/2026-04-15-team-lead-audit-phases-0-3.md`, `…-batch-2.md`, `…-batch-3.md`
**Test state (reported):** 1013/1013 across 60 suites.

## 1. Verified at HEAD `e643cc0`

- **ADR 0007** present at `docs/adr/0007-peach-payments-for-hunter-payouts.md`. Status: Accepted. Content is internally consistent with R10/R11/R12/R13 from batch 3: explicitly cites the 12-path probe + `POST /api/v1/withdrawal` single-account behaviour (maps to R10/R11), keeps the `local:` fallback in place as an interim (R12/R13) with `// PEACH MIGRATION:` markers pending in batch 4, and leaves `PAYOUTS_ENABLED=false` as the operational guard. Pairs correctly with the "architectural finding, not just a bug" framing from §2 of `CLAUDE.md`.
- **CSV exports controller** (`apps/api/src/modules/finance-admin/exports.controller.ts`): class-level `@Roles(UserRole.SUPER_ADMIN)` and per-route `@Audited('FINANCE_EXPORT', 'System')` on all four endpoints (`inbound`, `reserves`, `refunds`, `ledger`). No raw Prisma in the controller. Meets batch-3 architect gate.
- **Expired-bounty service** (`apps/api/src/modules/bounties/expired-bounty.service.ts`): uses `this.config.get('STITCH_SYSTEM_ACTOR_ID')` with a hard-throw if unset (`:44-52`). Idempotency is enforced at the ledger layer via `postTransactionGroup({ actionType: 'bounty_expired_release', referenceId: bounty.id, … })` (`:107-142`), matching `UNIQUE(referenceId, actionType)` contract. Scheduler is gated; Kill Switch honoured (no `allowDuringKillSwitch: true`).
- **KYB confirm modal** (`apps/web/src/app/business/organisation/kyb/page.tsx`): `handleSubmit` now only opens the dialog (`setShowConfirm(true)` at `:97`); the mutation is called inside `handleConfirmSubmit` at `:100-117`. The confirm copy names the non-rollbackable consequence ("brand cannot edit KYB details until a Super Admin reviews"). Hard Rule #6 closed.
- **KB Insights page** (`apps/web/src/app/admin/finance/insights/page.tsx`): consumes `useConfidenceScores()` which calls `financeAdminApi.getConfidenceScores()` (`/admin/kb/confidence`). No raw `fetch`, no `LedgerEntry` leak.
- **CI grep guard**: `npm run check:kill-switch-bypass` → `OK: 'allowDuringKillSwitch: true' only appears in apps/api/src/modules/finance-admin/finance-admin.service.ts`. Green.

## 2. Status of batch-3 gates

| Gate | Status |
|---|---|
| KYB confirmation dialog (Hard Rule #6) | **Done** — mutation gated by confirm primary handler. |
| Clearance override live-mode hard-refuse | **Done** — `approval-ledger.service.ts:65-69` throws when `PAYMENTS_PROVIDER=stitch_live` and an override env var is set. |
| CI grep guard | **Done** — script shipped + wired to `npm run check:kill-switch-bypass`. |
| Live-test bugs R10/R11 | **Workaround done** (beneficiary synthetic id + payout passes `stitchBeneficiaryId`). **Root cause architecturally addressed** in ADR 0007: outbound moves to Peach; Stitch outbound remains gated by `PAYOUTS_ENABLED=false`. |

## 3. Gates I'm holding for batch 4

### agent-backend-4 (subscription billing + Kill Switch auto-trigger)
1. Every billing cycle (charge, failed charge, grace expiry, downgrade) must `postTransactionGroup` a **balanced** set of legs (`sum(DEBIT) === sum(CREDIT)`). No side-channel writes to balances. Plan snapshot copied onto the billing transaction at creation (Non-Negotiable #9).
2. Kill Switch auto-trigger must go through `LedgerService.setKillSwitch(true)` — it must NOT flip a flag without the same AuditLog row the manual toggle writes. The trip reason must include the reconciliation finding's root-cause signature hash so the CI guard (ADR 0006 scope) stays honest.
3. All subscription billing endpoints and the auto-trigger must write AuditLog entries attributable to a system actor (`STITCH_SYSTEM_ACTOR_ID` or equivalent). No string-literal actorIds.
4. `// PEACH MIGRATION:` markers land at the Stitch payout call sites (`StitchClient.createBeneficiary`, `PayoutsService.initiatePayout`, retry path) — a grep for `PEACH MIGRATION` must return ≥ 3 hits after the PR.

### agent-frontend-4 (exports UI + subscriptions page)
1. CSV download must carry the JWT through the same `apiClient` used elsewhere — the common pitfall is a raw `<a href>` that bypasses the Authorization header/cookie and silently 401s. Either use `apiClient.get(..., { responseType: 'blob' })` or attach credentials to the anchor explicitly. RTL test must assert the request carries auth.
2. `/admin/finance/subscriptions` must be gated by `SUPER_ADMIN` on the API side (`@Roles(UserRole.SUPER_ADMIN)` on the controller). A page-level role check is not sufficient on its own but is expected.
3. Zero raw `LedgerEntry` shape in the web tier (standing gate). No new `fetch` calls — everything routes through the typed client.

### agent-architect-4 (Phase 4 KB auto-stub)
1. `KbService.recordRecurrence` must be **idempotent per signature**: same `rootCauseSignature` bumps `recurrenceCount` on the existing row; it does not insert a duplicate `RecurringIssue`. Unit test asserts row count stays 1 after N calls.
2. Webhook failure → `recordRecurrence` path requires a proper signature: recommended `hash(provider, routeKey, errorClass, errorMessageFingerprint)`. Unit test locks the hash stability across re-runs.
3. When a signature repeats, the prior KB entry is flagged `Ineffective Fix` per `CLAUDE.md` §2.

### agent-qa-4 (RBAC + live-test recipe + full suite)
1. `FinanceExportsController` RBAC spec must cover all four routes × all four non-SA roles = 16 red cases. Parameterised `test.each` preferred.
2. Phase 2 live-test recipe (`docs/reviews/2026-04-15-phase-2-live-test.md`) gets a "Peach pending" note on the payout step (already an ADR 0007 action item).
3. `npm test` green and `npm run check:kill-switch-bypass` green post-merge. Hard Rule #4.

## 4. Updated risk register

| # | Risk | Status | Note |
|---|---|---|---|
| R1 | Svix replay storm | Unchanged | Monitor `WebhookEvent.attempts`. |
| R2 | Kill-switch bypass at pre-checkout | Resolved | batch 2. |
| R3 | No RBAC contract tests | Resolved | batch 2, extended in batch 3. |
| R4 | Override accepts any string | Resolved | batch 2. |
| R5 | Compensating-entry bypass undocumented | Resolved | ADR 0006. |
| R6 | Plan-snapshot re-pricing | Resolved | batch 2. |
| R7 | Clearance-override live-mode leak | Resolved | `approval-ledger.service.ts:65-69` throws. |
| R8 | KYB submit without confirmation | Resolved | `kyb/page.tsx:97+100`. |
| R9 | `allowDuringKillSwitch` token sprawl | Resolved | CI guard green. |
| R10 | Stitch beneficiary endpoint wrong | **Downgrade: Critical → Medium** | Workaround in place (synthetic `local:` id); ADR 0007 moves outbound to Peach. `PAYOUTS_ENABLED=false` keeps it from firing. |
| R11 | Payout passes internal UUID to Stitch | **Downgrade: Critical → Medium** | Fixed in `PayoutsService` (passes `stitchBeneficiaryId`); rendered moot by ADR 0007. |
| R12 | `beneficiary.service` `local:` fallback on missing id | **Open — Medium** | Silent-fallback antipattern remains. Batch 5 must add a runtime-mode guard: refuse to write a `local:` id when `PAYMENTS_PROVIDER=stitch_live` OR (future) `PAYMENTS_PROVIDER=peach_live`. |
| R13 | Beneficiary catch-swallow → no upstream visibility | **Open — Medium** | Same fix as R12: throw in live mode; warn in sandbox/dev. Pair with a Sentry breadcrumb. |
| R14 | Expired-bounty release unimplemented | Resolved | `expired-bounty.service.ts` + scheduler shipped. |
| R15 | **NEW — CSV export download may drop JWT** | Open (batch 4 frontend) | Held in §3. Common Next.js pitfall when switching from `apiClient` fetch to a raw `<a href>` download. |
| R16 | **NEW — Subscription ledger imbalance risk** | Open (batch 4 backend) | New write path — any asymmetry in billing legs would create drift that reconciliation has to catch retroactively. Enforce symmetry at the `postTransactionGroup` call, not in a reconciler. |
| R17 | **NEW — KB auto-stub duplicate rows** | Open (batch 4 architect) | If `recordRecurrence` inserts rather than upserts-by-signature, `RecurringIssue` floods on replay storms. Held in §3. |
| R18 | **NEW — Peach provider vacuum** | Open — policy, not a bug | Outbound rail has no implementation. Every day `PAYOUTS_ENABLED` stays off, brand_reserve balances grow. Expected, but track the reserve ageing on the dashboard. |

## 5. What's left from `md-files/implementation-phases.md` after batch 4 lands

### Phase 2
- 7-day end-to-end green on staging. **Blocked** until Peach outbound lands (ADR 0007). Inbound leg is green; outbound leg is intentionally disabled.

### Phase 3
- Subscription billing — **in this batch** (agent-backend-4). Downgrade-on-grace-expiry follow-up likely needed in batch 5 (auto-downgrade transition, not just grace entry).
- Finance Kill Switch auto-trigger — **in this batch** (agent-backend-4 + agent-architect-4).
- Exception-feed severity wiring to reconciliation findings — partial; batch 5 should finish wiring Critical/High rows to the exceptions tab with drill-through to the `RecurringIssue` id.
- Exports UI — **in this batch** (agent-frontend-4).

### Phase 4 (after batch 4)
- **Signature hash matching**: `rootCauseSignature` function contract locked in by agent-architect-4's tests; batch 5 should harden against collisions (e.g. webhook vs reconciliation hashing the same input differently).
- **RecurringIssue write-path from webhook failures**: in this batch — needs a production run to prove the idempotency story under load.
- **KB Insights Confidence Score UI**: shipped (`/admin/finance/insights`). Backend exists (`KbService.confidenceScores` via `/admin/kb/confidence`). Remaining: surface per-system drill-down from the cards into the KB entries feeding the score. Batch 5 scope.
- **Claude tooling script** (`scripts/kb-context.ts`): **not started.** This is the last Phase 4 work item — pulls top-N KB entries for a given file path / system label into Agent Team Lead context. Recommended for batch 5.
- Auto-flag `Ineffective Fix` when a signature repeats: depends on agent-architect-4 landing `recordRecurrence` correctly.

## 6. Recommendation for batch 5

Do NOT scope Peach integration here — ADR 0007 has that on its own workstream.

Spawn four parallel agents:

1. **agent-architect-5** — `scripts/kb-context.ts`: CLI + Node import surface that takes a file path or system label and returns the top-N KB entries ranked by (recurrenceCount desc, severity desc, updatedAt desc). No new DB writes. Wire into a `CLAUDE.md` §7 step so future Team Lead rounds include KB context by default. Lands the last Phase 4 Claude-tooling item.
2. **agent-backend-5** — Finalise subscription auto-downgrade on grace expiry. Grace entry lands in batch 4; the downgrade state transition and the ledger compensating entry for any prorated credit need their own transaction group (`actionType: 'subscription_auto_downgrade'`). Tests must cover the "grace expires exactly at renewal" race. Also close R12/R13 with a live-mode throw in `BeneficiaryService`.
3. **agent-qa-5** — Fault-injection suite against the reconciliation engine: timeout mid-group, partial webhook replay, duplicate `externalEventId`, forced ledger asymmetry. Must assert the engine surfaces each as the right severity and that `KbService.recordRecurrence` receives a stable signature (end-to-end from engine to KB).
4. **agent-frontend-5** — Playwright smoke tests for the four critical admin flows: Kill Switch toggle, override with reason, refund approval (dual SA), export download (asserts auth header). This closes the "no E2E on admin dashboard" residual risk and is cheap to add once batch 4's UI lands.

**Do not start any new Phase-5-or-beyond scope.** Everything above is either closing Phase 3 tails or finalising Phase 4 exit criteria. Peach outbound is tracked under ADR 0007 and is explicitly the next workstream after batch 5.
