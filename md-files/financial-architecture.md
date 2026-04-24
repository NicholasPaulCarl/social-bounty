# Financial Architecture

Ledger mechanics, idempotency patterns, and reconciliation engine. Claude reads this file before touching any ledger-writing code (see `claude.md` §7).

**This file covers *how* money is recorded.** Payment-provider behaviour (TradeSafe flows, fee rates, clearance, state machines) lives in `docs/adr/0011-tradesafe-unified-rail.md` — which is the canonical source. If the two disagree, ADR 0011 wins.

The canonical schema lives in `packages/prisma/schema.prisma`. If this file and the schema disagree, the schema wins — and a KB entry should be opened to fix the drift.

---

## 1. Ledger Entry (conceptual model)

```
LedgerEntry
- id                 uuid
- userId             uuid                 — null for platform accounts
- account            string               — canonical account name (see §2)
- type               credit | debit
- amount             integer (minor units, cents)
- currency           string (ISO 4217)
- referenceId        string               — external or domain id
- referenceType      string               — e.g. 'submission.approved'
- actionType         string               — used with referenceId for idempotency
- transactionGroupId uuid                 — ties all legs of one economic event
- status             pending | completed | reversed
- externalReference  string?              — TradeSafe transactionId / allocationId
- createdAt          timestamptz
```

Constraints:
- `UNIQUE(referenceId, actionType)` — idempotency guard.
- `amount > 0` — sign is carried by `type`, never by `amount`.
- No `UPDATE` or `DELETE` on this table in application code. Corrections happen via compensating entries.
- `AuditLog` write in the same DB transaction — non-negotiable.

---

## 2. Canonical Account Names

Do not invent variants. Full list and usage in `docs/adr/0011-tradesafe-unified-rail.md` §3.

- Brand: `brand_cash_received`, `brand_reserve`, `brand_refundable`
- Hunter: `hunter_pending`, `hunter_clearing`, `hunter_available`, `hunter_paid`, `hunter_net_payable`
- Platform revenue: `hunter_commission`, `platform_admin_fee`, `global_fee_revenue`
- Platform costs: `processing_expense`, `payout_fee_recovery`, `bank_charges`
- Clearing: `tradesafe_escrow`, `payout_in_transit`, `bounty_reserved`

---

## 3. Transaction Groups

A single economic event (brand funding, approval, clearance release, payout success, refund) produces multiple ledger entries that **must commit or roll back together**.

All entries in one event share one `transactionGroupId` and are written inside one DB transaction. If any leg fails, the whole group rolls back.

Reconciliation verifies every `transactionGroupId` has balanced debits and credits. See `docs/adr/0011-tradesafe-unified-rail.md` §3 for the canonical debit/credit patterns per flow.

---

## 4. Idempotency Pattern

Every handler that writes a ledger entry accepts a deterministic `idempotencyKey`.

```
idempotencyKey = `${actionType}:${referenceId}`
```

Canonical keys (non-exhaustive):
- `bounty_funded:{tradeSafeTransactionId}`
- `submission_approved:{submissionId}`
- `submission_approved_payout:{tradeSafeAllocationId}`
- `clearance_released:{hunterPendingLedgerEntryId}`
- `allocation_cancelled:{tradeSafeAllocationId}`
- `refund_processed:{refundId}`

On write:
1. Begin transaction.
2. Insert `LedgerEntry` rows + `AuditLog` row.
3. If `UNIQUE(referenceId, actionType)` violates, catch, roll back, return the **existing** result. Do not error.
4. Commit.

This makes webhook replays, retries, and at-least-once delivery safe.

---

## 5. Currency & Amounts

- Integer minor units always. R10.50 is stored as `1050`.
- Never floats.
- Single currency per `LedgerEntry`. MVP is single-currency (ZAR); cross-currency is out of scope.
- Rounding: half-even (banker's) at each fee calculation, before summation. See ADR 0011 §3 for TradeSafe ZAR-decimal conversion (`toZar` / `toCents` at the adapter boundary).

---

## 6. Reconciliation Engine

Runs every 15 minutes and on-demand. Findings raise exceptions on the Finance Reconciliation Dashboard (`admin-dashboard.md`). All seven checks are implemented in `apps/api/src/modules/reconciliation/reconciliation.service.ts`; method names are given in parentheses.

### Balance check (`checkGroupBalance`)
For every `transactionGroupId`, `sum(credits) == sum(debits)`. Any mismatch creates a Critical KB entry and triggers the Financial Kill Switch.

### Duplicate detection (`checkDuplicateGroups`)
Any `(referenceId, actionType)` pair with more than one row indicates an idempotency bypass. Should be impossible with the DB constraint; if seen, it is a structural flaw. Critical.

### Missing legs (`checkMissingLegs`)
Every `transactionGroupId` must have at least two legs (one debit, one credit). A group with fewer than two entries is a half-written transaction. Critical.

### Status consistency (`checkStatusConsistency`)
Bounty `paymentStatus=PAID` must have a matching `bounty_funded` group (and vice versa); submission `status=APPROVED` must have a matching `submission_approved` group (and vice versa). Four anti-joins. Warning severity — webhook-vs-DB lag is noisy; recurrence is caught via the KB confidence loop.

### Wallet balance vs ledger (`checkWalletProjectionDrift`)
Per ADR 0002 `Wallet.balance` is a cached projection over `LedgerEntry` filtered by `userId`, `account='hunter_available'`, and `status='COMPLETED'`. Drift (`cached_balance_cents <> projected_balance_cents`) means the cache is wrong — ledger wins. Warning.

### Payouts vs ledger (`checkPayoutsVsLedger`)
A `TradeSafeTransaction` in terminal state `FUNDS_RECEIVED` requires a matching `bounty_funded` ledger group keyed on the TradeSafe `transactionId`; a `TradeSafeAllocation` in terminal state `FUNDS_RELEASED` requires a matching `submission_approved_payout` ledger group keyed on `allocationId`. Index-driven anti-joins. Critical severity on any surfaced row — the provider confirmed money moved but the ledger has no record. Post-ADR-0011 (2026-04-24 single-rail cutover) only the TradeSafe branch runs; the historical Stitch branch was deleted along with the Stitch code. See ADR 0011 §3.

### Reserve vs bounty (`checkReserveVsBounty`)
Sum of `brand_reserve` credits minus debits, grouped by bounty, must equal `bounty.faceValueCents` for every PAID bounty. Single `GROUP BY` with `LEFT JOIN` (batch 11B perf rewrite). Warning.

---

## 7. Retry & Webhook Handling

Inbound webhooks from TradeSafe arrive via `POST /api/v1/webhooks/tradesafe/:secret`. Handler requirements (per ADR 0011 §4):

1. URL-path secret verification via `crypto.timingSafeEqual` against `TRADESAFE_CALLBACK_SECRET`. `401 Unauthorized` on mismatch.
2. Treat the webhook body as **untrusted**. Extract only the `transactionId` / `allocationId`; re-fetch canonical state via `TradeSafeGraphQLClient.getTransaction(id)`.
3. Insert into `WebhookEvent` table with `UNIQUE(provider, externalEventId)`. `externalEventId` is derived from `(transactionId, state)` since TradeSafe does not issue event ids.
4. On conflict, acknowledge 2xx immediately with no side effects (safe replay).
5. Derive deterministic `idempotencyKey` from the re-fetched state (never from the callback body).
6. Execute ledger writes inside a single DB transaction.
7. Acknowledge only after successful commit; on failure return 5xx so TradeSafe retries per their delivery SLA.

Failure modes and handling are listed in ADR 0011 §4 + §8.

---

## 8. AuditLog Coupling

Every ledger-writing action writes an `AuditLog` row in the same DB transaction. If the audit write fails, the ledger write fails. This ties to Hard Rule #3.

AuditLog captures: actor (user or system job), action, before state, after state, reason (if admin override), timestamp, `transactionGroupId` reference.

---

## 9. TradeSafe Notes (mechanics only)

- TradeSafe is the sole payment rail for MVP (per ADR 0011). Full integration details in `docs/adr/0011-tradesafe-unified-rail.md`.
- OAuth client-credentials token (30-min TTL) cached in Redis (`tradesafe:oauth:token`), fetched from `https://auth.tradesafe.co.za/oauth/token`.
- TradeSafe `transactionId` / `allocationId` are stored on `LedgerEntry.externalReference`.
- GraphQL timeouts are treated as **unknown state**, never as failures. The webhook handler re-fetches canonical state via `getTransaction(id)` before posting to the ledger; reconciliation resolves any drift before compensating action.
- Plan snapshots (Free/Pro tier active at transaction time) are stored on the domain record (Bounty, Submission) — not on `LedgerEntry`. In-flight transactions are never re-priced.
- Pro subscriptions are gated behind a "coming soon" placeholder — TradeSafe has no recurring-subscription primitive per ADR 0011 §7.

---

## 10. Required Tests (ties to `claude.md` §5)

Every function that writes to the ledger must have:
- Unit test: happy path.
- Unit test: duplicate/retry call produces no second entry.
- Integration test: partial failure rolls back the full transaction group.
- Integration test: webhook replay is idempotent.
- Integration test: reconciliation flags an injected imbalance.

No ledger-touching PR merges without these.

---

## 11. What Claude Must Do Before Changing Ledger Code

1. Read `docs/adr/0011-tradesafe-unified-rail.md` (canonical payment spec).
2. Read this file (ledger mechanics).
3. Read `claude.md` §4 (Financial Non-Negotiables) and §5 (Required Tests).
4. Check `knowledge-base.md` for prior incidents in the module.
5. State the root cause before proposing a change.
6. Route via Agent Team Lead.
