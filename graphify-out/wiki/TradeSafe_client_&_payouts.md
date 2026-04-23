# TradeSafe client & payouts

> 42 nodes · cohesion 0.06

## Key Concepts

- **WalletController** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **WalletService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **WalletProjectionService** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.snapshot()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.getBalance()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getOrCreateWallet()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.availableCents()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.netBalance()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **wallet-projection.service.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.getLedgerSnapshot()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **.paidCents()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.pendingCents()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.adminAdjust()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.creditWalletWithCommission()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getDashboard()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **wallet.controller.ts** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **wallet.service.ts** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.adminAdjustWallet()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **.listMyWithdrawals()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **.sub()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.adminGetWallet()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.creditWallet()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getTransactions()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.holdFunds()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.listUserWithdrawals()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`
- *... and 17 more nodes in this community*

## Relationships

- [[Admin page routes]] (10 shared connections)
- [[Admin operations & overrides]] (2 shared connections)
- [[Agent team roster]] (1 shared connections)
- [[Wallet controller & projection]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`

## Audit Trail

- EXTRACTED: 99 (84%)
- INFERRED: 19 (16%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*