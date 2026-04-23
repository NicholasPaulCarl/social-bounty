# `LedgerService.postTransactionGroup()`

> The one sanctioned write path for every financial transaction — idempotent, double-entry, kill-switch-aware.

## What it does

`LedgerService.postTransactionGroup(input)` is the single method every financial mutation in the API routes through. Inputs: `{ actionType, referenceId, referenceType, description, legs[], audit, postedBy, currency?, allowDuringKillSwitch? }`. Behaviour: (1) **fast-path pre-check** — look up `LedgerTransactionGroup.findUnique({ where: { actionType_referenceId: { ... } } })` before opening any transaction, returning `{ idempotent: true }` immediately if it already exists (added in the 2026-04-17 ledger-idempotency hardening, commit — the old `try { create } catch P2002` pattern hit Postgres SQLSTATE `25P02` "current transaction is aborted" on the real DB); (2) **kill-switch check** — consult `SystemSetting.financial.kill_switch.active` unless `allowDuringKillSwitch: true` (SUPER_ADMIN compensating entries only per ADR 0006); (3) open `$transaction` and insert the `LedgerTransactionGroup` row + all `legs[]` + the `AuditLog` row atomically; (4) **balance check** — sum `DEBIT.amountCents === CREDIT.amountCents`, throw `LedgerImbalanceError` if not; (5) safety-net P2002 catch post-commit in case another writer won the race.

## Why it exists

Financial Non-Negotiables §4.1–§4.7 all funnel through this method: double-entry, idempotency (`UNIQUE(referenceId, actionType)` at the DB layer), transaction-group integrity (single `$transaction`), integer minor units (`amountCents: bigint` typed at the leg), append-only ledger (no updates, only compensating entries), AuditLog entry (mandatory `audit` field), retry-safe (idempotency key is the defence). The ADR 0005 + ADR 0006 pattern is preserved here: `(referenceId, actionType)` remains the idempotency key, `allowDuringKillSwitch` is the narrow compensating-entry escape that only SUPER_ADMIN callers reach. The method's docstring traces the evolution — the 2026-04-17 refactor split the pre-check out of the transaction because the catch-inside-tx pattern worked on mocked Prisma but broke on real Postgres.

## How it connects

- **`LedgerService` (class)** — the enclosing singleton; `postTransactionGroup` is the primary write method alongside `.isKillSwitchActive()`, `.setKillSwitch()`.
- **`BrandFundingHandler.onPaymentSettled`** — the primary inbound caller; posts the brand-reserve leg pair.
- **`PayoutsService` / `TradeSafeWebhookHandler`** — outbound callers (gated by `PAYOUTS_ENABLED`).
- **`RefundsService`** — issues compensating entries with `allowDuringKillSwitch: true`.
- **`FinanceAdminService.overrideEntry`** — the SUPER_ADMIN compensating-entry path.
- **`ApprovalLedgerService`** — the submission-approval wrapper that composes the fee-split legs then delegates here.
- **`SubscriptionVisibilityScheduler`** — consults `isKillSwitchActive()` (not this method) before firing auto-refunds per ADR 0010.
- **`AuditService.log()`** — audit rows are written inside the same transaction (Hard Rule #3).

---
**degree:** 19 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/ledger/ledger.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this method is the single most important piece of financial code in the repository. Every change here requires the full 5-test matrix per caller (happy path, idempotent retry, partial rollback, webhook replay, concurrent writer). The 2026-04-17 refactor is documented at the call site; future changes should preserve the fast-path-outside-tx pattern or risk reintroducing the SQLSTATE `25P02` crashloop.
