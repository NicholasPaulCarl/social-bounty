# Financial Architecture

Ledger mechanics, idempotency patterns, and reconciliation engine. Claude reads this file before touching any ledger-writing code (see `claude.md` §7).

**This file covers *how* money is recorded.** Payment-provider behaviour (Stitch Express flows, fee rates, clearance, state machines) lives in `md-files/payment-gateway.md` — which is the canonical source. If the two disagree, `payment-gateway.md` wins.

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
- externalReference  string?              — Stitch payment/payout id
- createdAt          timestamptz
```

Constraints:
- `UNIQUE(referenceId, actionType)` — idempotency guard.
- `amount > 0` — sign is carried by `type`, never by `amount`.
- No `UPDATE` or `DELETE` on this table in application code. Corrections happen via compensating entries.
- `AuditLog` write in the same DB transaction — non-negotiable.

---

## 2. Canonical Account Names

Do not invent variants. Full list and usage in `payment-gateway.md` §6.

- Brand: `brand_cash_received`, `brand_reserve`, `brand_refundable`
- Hunter: `hunter_pending`, `hunter_clearing`, `hunter_available`, `hunter_paid`, `hunter_net_payable`
- Platform revenue: `commission_revenue`, `admin_fee_revenue`, `global_fee_revenue`
- Platform costs: `processing_expense`, `payout_fee_recovery`, `bank_charges`
- Clearing: `gateway_clearing`, `payout_in_transit`

---

## 3. Transaction Groups

A single economic event (brand funding, approval, clearance release, payout success, refund) produces multiple ledger entries that **must commit or roll back together**.

All entries in one event share one `transactionGroupId` and are written inside one DB transaction. If any leg fails, the whole group rolls back.

Reconciliation verifies every `transactionGroupId` has balanced debits and credits. See `payment-gateway.md` §8 for the canonical debit/credit patterns per flow.

---

## 4. Idempotency Pattern

Every handler that writes a ledger entry accepts a deterministic `idempotencyKey`.

```
idempotencyKey = `${actionType}:${referenceId}`
```

Canonical keys (non-exhaustive):
- `stitch_payment_settled:{stitchPaymentId}`
- `submission_approved:{submissionId}`
- `clearance_released:{hunterPendingLedgerEntryId}`
- `payout_initiated:{payoutId}`
- `stitch_payout_settled:{stitchPayoutId}`
- `stitch_payout_failed:{stitchPayoutId}`
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
- Rounding: half-even (banker's) at each fee calculation, before summation. See `payment-gateway.md` §5.

---

## 6. Reconciliation Engine

Runs every 15 minutes and on-demand. Findings raise exceptions on the Finance Reconciliation Dashboard (`admin-dashboard.md`).

### Balance check
For every `transactionGroupId`, `sum(credits) == sum(debits)`. Any mismatch creates a Critical KB entry and triggers the Financial Kill Switch.

### Duplicate detection
Any `(referenceId, actionType)` pair with more than one row indicates an idempotency bypass. Should be impossible with the DB constraint; if seen, it is a structural flaw.

### Missing legs
`transactionGroupId`s with entries in `pending` status older than the configured retry window (default 30 minutes for inbound, 4 hours for outbound).

### Status consistency
No group should have a mix of `completed` and `reversed` without a compensating entry chain linking them.

### Wallet balance vs ledger
Cached balances (if any) must equal `sum(credits) - sum(debits)` filtered by `userId`, `account`, and `completed` status. Drift means the cache is wrong — ledger wins.

### Stitch vs ledger
For each module (inbound, payouts, refunds), match Stitch records against ledger records by `externalReference`. Statuses: `matched | mismatch | missing | duplicate`. See `payment-gateway.md` §15.

### Reserve vs bounty
Sum of `brand_reserve` credits minus debits, grouped by bounty, must equal `bounty.face_value` for every open bounty.

---

## 7. Retry & Webhook Handling

Inbound webhooks from Stitch arrive via Svix. Handler requirements:

1. Verify `svix-id`, `svix-timestamp`, `svix-signature`. Reject timestamps older than 5 minutes.
2. Insert into `WebhookEvent` table with `UNIQUE(provider, externalEventId)`.
3. On conflict, acknowledge 2xx immediately with no side effects (safe replay).
4. Derive deterministic `idempotencyKey` from the event payload.
5. Execute ledger writes inside a single DB transaction.
6. Acknowledge only after successful commit.

Failure modes and handling are listed in `payment-gateway.md` §10 and §13.

---

## 8. AuditLog Coupling

Every ledger-writing action writes an `AuditLog` row in the same DB transaction. If the audit write fails, the ledger write fails. This ties to Hard Rule #3.

AuditLog captures: actor (user or system job), action, before state, after state, reason (if admin override), timestamp, `transactionGroupId` reference.

---

## 9. Stitch Express Notes (mechanics only)

- Stitch Express is the sole payment rail for MVP. Full integration details in `payment-gateway.md` §10.
- Stitch-side ids are stored on `LedgerEntry.externalReference`.
- Stitch timeouts are treated as **unknown state**, never as failures. Reconciliation resolves the true state before any compensating action.
- Plan snapshots (Free/Pro tier active at transaction time) are stored on the domain record (Bounty, Submission) — not on `LedgerEntry`. In-flight transactions are never re-priced.

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

1. Read `payment-gateway.md` (canonical payment spec).
2. Read this file (ledger mechanics).
3. Read `claude.md` §4 (Financial Non-Negotiables) and §5 (Required Tests).
4. Check `knowledge-base.md` for prior incidents in the module.
5. State the root cause before proposing a change.
6. Route via Agent Team Lead.
