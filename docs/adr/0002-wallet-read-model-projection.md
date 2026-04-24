# ADR 0002 — Wallet as Read-Model Projection Over LedgerEntry

**Status:** Accepted
**Date:** 2026-04-15

## Context

The existing `Wallet` / `WalletTransaction` / `Withdrawal` models (`packages/prisma/schema.prisma`) are single-entry and hold cached balances. The Stitch Express implementation introduces an append-only double-entry ledger (`LedgerEntry` + `LedgerTransactionGroup`) as the single source of truth. Three options were considered: retire Wallet entirely, keep Wallet as a projection over the ledger, or dual-write indefinitely. <!-- historical -->

## Decision

**Keep `Wallet` as a read-model projection over `LedgerEntry`. No historical backfill. `Withdrawal` retires in favor of `StitchPayout`.**

- `Wallet.balance` is computed from `sum(credit) - sum(debit) WHERE userId=? AND account='hunter_available' AND status='COMPLETED'`.
- `Wallet.pendingBalance` computes over `hunter_pending` + `hunter_clearing` + `hunter_net_payable` (clearance-period money).
- Existing `wallet.controller.ts` endpoint signatures are preserved so `(participant)/wallet/page.tsx` keeps working.
- `WalletTransaction` is kept as legacy historical data. Endpoints that currently return `WalletTransaction` rows will transition to returning `LedgerEntry` projections in the same DTO shape during Phase 2.
- `Withdrawal.service.ts` and its scheduler retire in Phase 2; automated payouts run through `StitchPayout` + the payout execution job. <!-- historical -->

## Consequences

- Zero backfill risk. Pre-ledger Wallet rows are untouched.
- UI contract stable across the migration.
- Long-term, there is one-way drift: wallet balances read from the ledger are always authoritative; the `Wallet.balance` column becomes redundant cache. A reconciliation check compares cached Wallet.balance against the ledger projection and raises an exception on drift.
- A later, separate project can remove the Wallet table entirely once no UI still reads its columns directly.
