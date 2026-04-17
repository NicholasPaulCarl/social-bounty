# Team Lead Audit — Batch 7 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `9fbcd8b feat: batch 6 — TradeSafe plan (ADR 0008), Phase 4 complete, holdover gates`
**Prior audits:** `…-phases-0-3.md`, `…-batch-2.md`, `…-batch-3.md`, `…-batch-4.md`, `…-batch-5.md`, `…-batch-6.md`
**Test state (reported):** 1061 tests across 66 suites, all green.

## 1. Verified at HEAD `9fbcd8b`

- **1061 / 66 suites green** (reported; no uncommitted source changes in `apps/api/src/**` or `apps/web/**`).
- **ADR headers correct.** `0003:3` "Partially superseded by ADR 0008", `0007:3` "Superseded by ADR 0008", `0008:3-5` Accepted + Supersedes 0007.
- **PEACH → TRADESAFE flip landed.** `PEACH MIGRATION` in `apps/api/src` → **0 hits**. `TRADESAFE MIGRATION` → **8 hits**: `beneficiary.service.ts:32`, `payouts.service.ts:59,138,266,322,370`, `stitch.client.ts:167,219`.
- **Draft migrations relocated.** `packages/prisma/migrations/` contains the 7 live migrations + `migration_lock.toml`; drafts now under `packages/prisma/drafts/{ineffective_fix_flag,subscription_revenue_ledger}/` with README. `prisma migrate deploy` can no longer catch them. R19 closed.
- **Webhook → KB wiring in place.** `apps/api/src/modules/webhooks/stitch-webhook.controller.ts:125-138` calls `kb.recordRecurrence({ category:'webhook-failure', system:'webhooks', errorCode:event.eventType, severity:'warning', … })` inside the dispatch catch, wrapped in its own `.catch(…)`. `errorCode` is stable `eventType`, not `eventId`. R20 closed.
- **Ineffective-Fix auto-flag math correct but severity-gate missing.** `kb.service.ts:95-100` checks `existing.resolved && existing.resolvedAt` and the 90d window; update branch is the only flagging site (create branch at `:108-118` cannot flag). Idempotency at `:134-137`, AuditLog at `:153-170`. **Gap:** fires for any severity including `'info'`. See R23.

## 2. Gates held for batch 7

**agent-backend-7** — (1) Husky hook is config-only: `.husky/pre-commit` + `package.json` scripts, zero edits to `apps/api/src/**`, `apps/web/**`, or any test. Must invoke the existing `check:kill-switch-bypass`, not a new lint. (2) R23 test pair: `severity:'info'` on prior-resolved entry → no flag, no AuditLog; `severity:'warning'` → flag + one AuditLog. Guard in `recordRecurrence` before `flagIneffectiveFix` call, keeping the manual-flag path unchanged. (3) Retry backoff is pure math: 2^attempts minutes, capped at 3 attempts. Fault-injection test via `reconciliation.fault-injection.spec.ts` pattern with mocked clock; attempt 4 never scheduled.

**agent-architect-7** — (1) `docs/STITCH-IMPLEMENTATION-STATUS.md` must reflect all 10 commits of today (`2e2c78b` → `9fbcd8b`) with per-batch outcomes, test delta, and the ADR 0003→0007→0008 churn. Missing commit = reject. (2) `docs/BACKUP-STRATEGY.md` ledger notes: append-only, no `TRUNCATE`, no `DELETE`, compensating entries only, PITR required. (3) `md-files/implementation-phases.md` annotations are additive ("Shipped as of 2026-04-15"); do not re-grade prior statuses.

**agent-qa-7** — (1) Mocked StitchClient only. (2) Refund-after-payout asserts dual-approver mismatch throws: same SUPER_ADMIN initiate + approve → compensating group does not commit, 0 ledger-row delta. (3) Compensating-group balance asserted; original charge group untouched (Non-Negotiable #1, #5). (4) RBAC matrix mirrors qa-6: BUSINESS_ADMIN initiate 200 / approve 403; SUPER_ADMIN approve 200; PARTICIPANT both 403. (5) AuditLog rows on initiation and approval.

**agent-frontend-7** — (1) Playwright runs against the live local stack, not a dry-parse; per-spec pass/fail recorded. Spec-only fixes allowed; no production-code edits to make a spec pass. (2) `/admin/finance/insights/[system]/page.tsx` read-only, SUPER_ADMIN-gated, reuses existing KB endpoints, no new mutation surface, PrimeReact + Tailwind only. (3) RBAC server-side, not client redirect.

## 3. Risk register

| # | Risk | Status | Note |
|---|---|---|---|
| R1 | Svix replay storm | Open — Low | Now observable via `RecurringIssue.occurrences`. |
| R10, R11 | Outbound provider shape | **Medium, unchanged** | Tracks TradeSafe; gated by `PAYOUTS_ENABLED=false`. |
| R18 | TradeSafe provider vacuum | Open — policy | Reserve-ageing mitigates; ADR 0009 closes. |
| R19, R20, R21 | Drafts / webhook-KB / markers | **Closed in batch 6** | Verified §1. |
| R22 | ADR churn | **Close at batch 7 end** if no new payout-rail ADR added. | No churn this batch. |
| R23 | Ineffective-Fix false positives | **Open — Low** | Closes with backend-7. `kb.service.ts:95-100` accepts `severity:'info'`. |
| **R24** | **NEW — Playwright spec-only drift** | Open — Low | Any source edit to pass a spec is a gate violation. PR-diff review. |
| **R25** | **NEW — Husky bypass via `--no-verify`** | Open — Low | Hook is convenience; CI lint remains authoritative. |

## 4. What's left after batch 7

Phase 1 complete. Phase 2 outbound payout still blocked on TradeSafe (no change). Phase 3 self-service UI shipped; live Upgrade CTA still disabled (no card-consent path). Phase 4 complete after batch 6; batch 7 closes the KB drill-down cosmetic gap.

**Batch 8 candidates:** (1) ADR 0009 — TradeSafe integration skeleton (adapter contract, schema, clearance-window reshape), unblocks Phase 2. (2) Subscription-lifecycle charge via Stitch card-consent — turns the Upgrade CTA live. (3) End-to-end Playwright against a seeded DB (non-mocked Stitch).

## 5. Recommendation

**Call the session done after batch 7 lands green.** Batch 7 closes R20/R21/R23 and the final Phase 4 polish. Spawning batch 8 without ADR 0009 first re-opens the payout-rail churn pattern R22 tracks. ADR 0009 starts the next session as its own gated step.
