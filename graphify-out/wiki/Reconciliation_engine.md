# Reconciliation engine

> 30 nodes · cohesion 0.11

## Key Concepts

- **WalletService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.add()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **FakeDecimal** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **FakeDecimal** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- **.abs()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.sub()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.lessThan()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.getBalance()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getOrCreateWallet()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.releaseFunds()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.toNumber()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.adminAdjust()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.creditWalletWithCommission()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getDashboard()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.holdFunds()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.add()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- **.sub()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- **.toString()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- **approxDelta()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- **.adminAdjustWallet()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **.constructor()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.completeWithdrawal()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.creditWallet()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getTransactions()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.abs()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- *... and 5 more nodes in this community*

## Relationships

- [[Wallet service]] (97 shared connections)
- [[API service layer]] (14 shared connections)
- [[Bounty access & mutation]] (2 shared connections)
- [[Bounty service & tests]] (2 shared connections)
- [[Ledger & payment services]] (1 shared connections)
- [[Subscription & auth lifecycle]] (1 shared connections)
- [[Bounty creation form]] (1 shared connections)
- [[User & brand profile services]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`

## Audit Trail

- EXTRACTED: 68 (57%)
- INFERRED: 52 (43%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*