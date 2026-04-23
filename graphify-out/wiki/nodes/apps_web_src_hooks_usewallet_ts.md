# `useWallet.ts`

> TanStack Query hooks for the hunter wallet surface — dashboard, ledger snapshot, transactions, withdrawals.

## What it does

`useWallet.ts` exports hooks covering every participant-facing wallet operation: `useWalletDashboard()` (available / pending-clearance / withdrawn totals with 30s staleTime), `useWalletLedgerSnapshot()` (compressed ledger view for the wallet page), `useWalletTransactions(params)` (paginated `WalletTxType` list), `useMyWithdrawals(params)` (pending + historical withdrawal records), `useRequestWithdrawal` (mutation — payout method + amount), `useCancelWithdrawal` (mutation for not-yet-settled withdrawals), plus admin-side hooks `useAdminWallets`, `useAdminWalletAdjust` (super-admin manual adjustment path that flows through `FinanceAdminService.overrideEntry`), `useAdminWithdrawals`, `useCompleteWithdrawal`, `useFailWithdrawal`. Queries use `queryKeys.wallet.*`; mutations invalidate `queryKeys.wallet.all` branch because an adjustment affects dashboard totals, transactions, and withdrawals caches simultaneously.

## Why it exists

The wallet page is the hunter's earnings dashboard — under-polling shows stale available-balance and causes UX confusion, over-polling wastes calls. 30-second staleTime is the tuned compromise. The admin-side hooks (`useAdminWalletAdjust`) are gated at the layout level to SUPER_ADMIN; they exist so operators can handle edge cases (misrouted Stitch webhook, compensating entry needed) without dropping to raw SQL. Every mutation here ends in a ledger write (via `FinanceAdminService.overrideEntry` per ADR 0006) with mandatory `reason` + AuditLog — the hook doesn't bypass Financial Non-Negotiables, it surfaces them.

## How it connects

- **`walletApi`** — fetch client in `lib/api/wallet.ts`.
- **`WalletService` + `WithdrawalService` (API)** — the service-layer counterparts.
- **`queryKeys.wallet.*`** — cache-key factory with `dashboard()`, `ledgerSnapshot()`, `transactions(params)`, `withdrawals(params)`, `all`.
- **`WalletTransactionListParams`, `RequestWithdrawalRequest`, `WithdrawalListParams`, `AdminWalletListParams`, `AdminWalletAdjustRequest`, `AdminWithdrawalListParams`, `AdminCompleteWithdrawalRequest`, `AdminFailWithdrawalRequest` (shared)** — the typed wire contract.
- **`/participant/wallet`, `/participant/wallet/transactions`, `/participant/wallet/withdraw` page.tsx** — hunter-facing consumers.
- **`/admin/wallets`, `/admin/wallets/[userId]`, `/admin/withdrawals` page.tsx** — admin-facing consumers.
- **`useFinanceAdmin.ts`** — sibling finance-admin hook bundle; wallet-adjust shares the ledger-write pattern.

---
**degree:** 19 • **community:** "React query hooks" (ID 2) • **source:** `apps/web/src/hooks/useWallet.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** `useAdminWalletAdjust` is the rare hook that bridges the hunter-facing and admin-facing surfaces — both are writing into the same `WalletService` but the mutation's `reason` field is mandatory on the admin path. Keeping the DTO split (`AdminWalletAdjustRequest` vs user-side transactional requests) enforces the audit-trail discipline.
