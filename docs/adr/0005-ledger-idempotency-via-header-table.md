# ADR 0005 — Ledger Idempotency Lives on the Transaction Group Header

**Status:** Accepted
**Date:** 2026-04-15

## Context

`claude.md` Non-Negotiable #2 requires DB-enforced idempotency via `UNIQUE(referenceId, actionType)`. A single economic event (e.g. brand-funding settlement) posts many `LedgerEntry` rows with the same `(referenceId, actionType)` pair — one per leg. Placing the `UNIQUE` constraint directly on `LedgerEntry` would forbid multi-leg groups, which breaks double-entry.

## Decision

Introduce `LedgerTransactionGroup` as a header table. `UNIQUE(referenceId, actionType)` lives there, not on `LedgerEntry`.

- `LedgerTransactionGroup.id` (UUID) is the foreign key that individual `LedgerEntry` rows point to via `transactionGroupId`.
- `LedgerService.postTransactionGroup` begins every flow by attempting `INSERT INTO LedgerTransactionGroup`. On `P2002` conflict, the service returns the existing group id with `idempotent: true` and writes zero ledger entries.
- All ledger rows for one economic event share the same `transactionGroupId`, are posted atomically in one `prisma.$transaction`, and balance to zero (sum credits == sum debits).

## Canonical keys

| `actionType` | `referenceId` |
|---|---|
| `stitch_payment_settled` | `stitchPaymentId` |
| `stitch_payment_failed` | `stitchPaymentId` |
| `submission_approved` | `submissionId` |
| `clearance_released` | `hunterNetPayableLedgerEntryId` |
| `payout_initiated` | `stitchPayoutRowId` |
| `stitch_payout_settled` | `stitchPayoutId` |
| `stitch_payout_failed` | `stitchPayoutId` |
| `refund_processed` | `refundId` |
| `subscription_charged` | `subscriptionPaymentId` |
| `bounty_expired_release` | `bountyId` |
| `compensating_entry` | UUID (one-shot, operator-minted) |

## Consequences

- Reconciliation queries join through the header table when they need to test group balance (`sum(credit) - sum(debit) GROUP BY transactionGroupId`).
- Compensating entries use `actionType = compensating_entry` with a fresh UUID as `referenceId`, so they never collide with forward entries.
- Because uniqueness is at the group level, individual `LedgerEntry` rows don't need a `UNIQUE` constraint — they only need fast indexes for reporting.
