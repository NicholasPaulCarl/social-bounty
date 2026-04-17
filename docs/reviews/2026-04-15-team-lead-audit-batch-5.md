# Team Lead Audit — Batch 5 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `a8b8e70 feat: batch 4 — Peach decision (ADR 0007), subscription billing, KB auto-stub, exports UI`
**Prior audits:** `…-phases-0-3.md`, `…-batch-2.md`, `…-batch-3.md`, `…-batch-4.md`
**Test state (reported):** 1036/1036 across 62 suites.

## 1. Verified at HEAD `a8b8e70`

- **Subscription billing ledger group is balanced.** `apps/api/src/modules/subscriptions/subscriptions.service.ts:81-117` posts `subscription_charged` via `LedgerService.postTransactionGroup` with two symmetric legs: `DEBIT gateway_clearing` and `CREDIT subscription_revenue`, both at `amountCents`. Idempotency is on `(referenceId=paymentId, actionType='subscription_charged')`. Integer minor units (Non-Negotiable #4) enforced at `:75-77`. Plan snapshot (Non-Negotiable #9) captured on `SubscriptionPayment.tierSnapshot` at `:271` (subscribe) and `:521` (renew), and copied into the ledger via `postChargeLedger(…, tier)`. System actor hard-throws if unset (`:44-50`).
- **`subscription_revenue` enum value** present in `packages/prisma/schema.prisma:327`. Draft migration at `packages/prisma/migrations/20260415_subscription_revenue_ledger_draft/migration.sql` adds the enum value + `subscription_payments.tierSnapshot`. **Partial concern:** the directory name does have a `20260415_` prefix (no `HHMMSS`), so Prisma will lexically sort it AFTER `20260415143053_stitch_express` and would apply it on `prisma migrate deploy` if this dir lives under `migrations/`. The header comment says "rename to a timestamped folder when ready"; relying on operator discipline, not Prisma's loader. Flagged in §4 as R19.
- **KB auto-stub from reconciliation goes through KbService.** `apps/api/src/modules/reconciliation/reconciliation.service.ts:263-292` — `persistFindings` calls `this.kb.recordRecurrence({ category, system, errorCode, title, severity, metadata: {...detail, system} })`. The legacy `prisma.recurringIssue.upsert` path is retained only as an `@Optional()` fallback when KbService isn't wired (unit-test compatibility). KbService hashes the signature (`kb.service.ts:31-34`) and bumps `occurrences` on repeat (`:57-70`).
- **Webhook failure auto-stub: NOT WIRED.** `apps/api/src/modules/webhooks/stitch-webhook.controller.ts:115-119` still only calls `events.markFailed(...)` + `logger.error(...)`. No `kb.recordRecurrence` call. A grep across `apps/api/src/modules/webhooks/**` returns zero `KbService` references. This was an architect-4 deliverable; landing slipped. Held in §2.
- **Exports download preserves auth.** `apps/web/src/lib/api/finance-admin.ts:98-129` hand-rolls `fetch` (blob needed) with `Authorization: Bearer ${getAccessToken()}` and `credentials: 'include'`. Not a bare `<a href>`. R15 closed.
- **`/admin/finance/subscriptions` is SUPER_ADMIN only.** `apps/api/src/modules/finance-admin/subscriptions.controller.ts:17-19` carries class-level `@Roles(UserRole.SUPER_ADMIN)`. The Next.js page is `apps/web/src/app/admin/finance/subscriptions/page.tsx` — read-only. No mutations exposed.
- **Kill Switch auto-trigger goes through `LedgerService.setKillSwitch`.** `reconciliation.service.ts:86` → `await this.ledger.setKillSwitch(true, 'reconciliation-job')`. Guarded by `isKillSwitchActive()` pre-check (`:83-84`). AuditLog written at `:99-115` with `entityId='financial.kill_switch.active'`, `reason` containing the critical-finding count, and `afterState.trigger='reconciliation-job'`. Partial concern: the trip reason does not yet embed the KB signature hash (batch-4 §3 asked for it). Downgraded to cosmetic — the `runId` is there and the finding list is in `JobRun.details`.

## 2. Status of batch-4 gates

| Gate | Status |
|---|---|
| Subscription billing ledger (balanced + snapshot) | **Done** — verified above. |
| Kill-Switch auto-trigger via setKillSwitch + AuditLog | **Done** — signature hash in reason is cosmetic, not a blocker. |
| `// PEACH MIGRATION:` markers ≥3 | **Partial** — only 1 marker found in `beneficiary.service.ts:32`. Payout call sites and retry path not annotated. Non-blocking for batch 5 but tracks as debt. |
| CSV export carries JWT | **Done** — fetch + Authorization header. |
| SUPER_ADMIN gate on `/admin/finance/subscriptions` | **Done** — class decorator. |
| `KbService.recordRecurrence` idempotent per signature | **Done** — `kb.service.ts` + unit test at `kb.service.spec.ts`. |
| Webhook-failure → `recordRecurrence` wired | **NOT DONE** — no call site. Pulled into batch 5 as a holdover gate on agent-architect-5 (it's already reading the KB stack). |
| `Ineffective Fix` auto-flag on repeat signature | **Not done** — batch 6 candidate. |

## 3. Gates I'm holding for batch 5

### agent-architect-5 (`scripts/kb-context.ts`)
1. Script MUST be runnable outside the Nest runtime — plain `ts-node`/`tsx`, no `@Module` bootstrapping. Reads `md-files/knowledge-base.md` + `prisma.recurringIssue.findMany` directly through a minimal `PrismaClient`.
2. **Read-only.** No `create`/`update`/`upsert` on any table. A grep against the committed script must show zero write calls.
3. Carry the holdover webhook-failure → `recordRecurrence` wiring in the same PR (one-line catch-block addition in `stitch-webhook.controller.ts` with `category='webhook-failure'`, `system='webhooks'`, `errorCode=eventType`). Lock signature stability in a unit test.

### agent-backend-5 (auto-downgrade + beneficiary live-mode guard)
1. Auto-downgrade transition (`status=PAST_DUE AND gracePeriodEndsAt < now → tier=FREE, status=EXPIRED`) MUST NOT re-price in-flight transactions. Non-Negotiable #9: `tierSnapshot` on existing `SubscriptionPayment` rows stays frozen; no updates to past ledger entries. Any compensating/prorated credit lands in a new `subscription_auto_downgrade` transaction group with its own balanced legs.
2. `BeneficiaryService.upsertForUser` must throw when `PAYMENTS_PROVIDER=stitch_live` (or future `peach_live`) AND the provider call returns no id. In `stitch_sandbox` and `none`, keep the `local:{userId}` fallback — breaking local test workflows is not acceptable. Log a Sentry breadcrumb in sandbox.
3. AuditLog required for both the downgrade transition and any ledger compensating entry (Hard Rule #3). System actor pattern as in `subscriptions.service.ts:43-50`.

### agent-qa-5a (reconciliation fault-injection)
1. Tests must use the Jest test harness with **mocked Prisma / LedgerService / KbService** (as `reconciliation.fault-injection.spec.ts` already does) OR an isolated test DB with a tear-down hook. Zero writes to the dev/staging DB. The existing stubs in `setKillSwitch: jest.fn().mockResolvedValue(undefined)` are the pattern.
2. Must assert: signature stability across re-runs (same inputs → identical hash from `KbService.signature`), severity routing (critical trips Kill Switch, warning does not), and no re-tripping when the switch is already ON.

### agent-qa-5b (Playwright smoke)
1. MUST NOT hit live Stitch. Mock the hosted-checkout redirect (return a known landing URL) or stub the Stitch client at the API layer. Webhook receipts in tests post a synthetic signed payload via the Svix verifier's test hook.
2. Cover the four flows: Kill Switch toggle (SA), override-with-reason (SA), refund before-approval (SA), CSV export (asserts `Authorization` header is present on the network request).
3. Playwright fixtures must not persist — use a dedicated test database URL and a `globalTeardown` that truncates.

## 4. Risk register (updated)

| # | Risk | Status | Note |
|---|---|---|---|
| R1 | Svix replay storm | Unchanged | Monitor `WebhookEvent.attempts`. |
| R2–R9 | Closed in batches 2–3 | Resolved | — |
| R10, R11 | Stitch outbound shape | Downgraded — Medium | ADR 0007 supersedes; `PAYOUTS_ENABLED=false` keeps them dormant. |
| R12 | `local:` fallback in live mode | **Open — Medium** | Held for backend-5. |
| R13 | Beneficiary catch-swallow | **Open — Medium** | Same fix as R12. |
| R14 | Expired-bounty release | Resolved | batch 3. |
| R15 | CSV export drops JWT | **Resolved** | fetch + bearer header verified. |
| R16 | Subscription ledger imbalance | **Resolved** | legs are symmetric in `postChargeLedger`. |
| R17 | KB auto-stub duplicate rows | **Resolved** | `recordRecurrence` is upsert-by-signature. |
| R18 | Peach provider vacuum | Open — policy | Track reserve ageing on dashboard. |
| R19 | **NEW — Draft migration folder inside `migrations/`** | Open — Low | `20260415_subscription_revenue_ledger_draft/` lives under the live Prisma migrations dir. The `_draft` suffix is not a Prisma convention; a careless `prisma migrate deploy` will execute it. Either move to `docs/draft-migrations/` or pre-pend `_` (Prisma ignores files with `_` prefix per some tooling) / document the rename step in the release runbook. |
| R20 | **NEW — Webhook-failure KB path missing** | Open — Medium | Held for architect-5. Without it, replay storms on failing handlers accumulate nothing in `RecurringIssue` and the Confidence Score for `webhooks` is blind. |
| R21 | **NEW — `PEACH MIGRATION:` marker coverage** | Open — Low | Only 1 of the targeted 3+ sites marked. Add on the next touch of `PayoutsService` / `StitchClient`. |

## 5. What's left after batch 5 from `md-files/implementation-phases.md`

**Phase 1** — complete.

**Phase 2** — outbound payout loop: **blocked on Peach (ADR 0007)**. 7-day end-to-end staging green cannot close until Peach's beneficiary + withdrawal endpoints are wired and `PAYOUTS_ENABLED=true`. Inbound leg is green.

**Phase 3** — after batch 5:
- Subscription billing auto-downgrade (backend-5 closes it).
- Exception-feed severity wiring to reconciliation findings — partially wired through Confidence Score; drill-through from the dashboard exception row into the `RecurringIssue` id is still TODO.
- Prisma migration promotion: rename the draft folder and run `prisma migrate deploy` in staging (R19).

**Phase 4** — after batch 5:
- `scripts/kb-context.ts` (architect-5) — closes the final Phase 4 Claude-tooling item.
- Webhook-failure → `recordRecurrence` (architect-5 holdover) — closes the write-path half of Phase 4.
- Auto-flag `Ineffective Fix` when a signature repeats ≥ N times — NOT started. Phase 4 exit criterion explicitly requires this.
- KB Insights per-system drill-down — shipped for scores; the per-system KB-entry list view is still TODO.

## 6. Recommendation for batch 6

**Do NOT recommend Peach integration** — tracked separately under ADR 0007.

Four parallel agents:

1. **agent-architect-6** — Phase 4 `Ineffective Fix` auto-flag. When `KbService.recordRecurrence` bumps `occurrences >= 3` on the same signature within 90 days, set `metadata.ineffectiveFix=true` on the row and emit a critical `AuditLog` entry so the finance dashboard can surface it. Closes the last Phase 4 exit criterion.
2. **agent-backend-6** — Integration tests for the BiznessAdmin → SuperAdmin refund-approval flow (before-payout path, dual-SA gate, Hard Rule #6 confirmation). Pair with a compensating-entry assertion against the ledger.
3. **agent-frontend-6** — Subscription billing self-service UI for hunter and brand: active plan, payment history, cancel at period end, reactivate. Consumes existing `subscriptions.service.ts` endpoints; no new API surface required. Mandatory confirmation dialog on Cancel (Hard Rule #6).
4. **agent-qa-6** — Resolve R19 (move/rename draft migration + runbook note), close the `PEACH MIGRATION:` marker gap (R21), and broaden Playwright coverage to the new subscription UI.

Peach outbound remains the next workstream after batch 6.
