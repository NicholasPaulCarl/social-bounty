# Wallet service

> 50 nodes · cohesion 0.06

## Key Concepts

- **WalletController** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **WalletService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.add()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **FakeDecimal** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **FakeDecimal** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- **WalletProjectionService** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.abs()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.sub()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.snapshot()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.lessThan()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.getBalance()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getOrCreateWallet()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.releaseFunds()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.availableCents()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.netBalance()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.getLedgerSnapshot()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **.paidCents()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.pendingCents()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.toNumber()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.adminAdjust()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.creditWalletWithCommission()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.getDashboard()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.holdFunds()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`
- **.add()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- **.sub()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- *... and 25 more nodes in this community*

## Relationships

- [[API service layer]] (16 shared connections)
- [[Ledger & payment services]] (2 shared connections)
- [[REST API controllers]] (2 shared connections)
- [[Bounty access & mutation]] (2 shared connections)
- [[Bounty service & tests]] (2 shared connections)
- [[Controllers & RBAC guards]] (1 shared connections)
- [[Subscription & auth lifecycle]] (1 shared connections)
- [[Reconciliation engine]] (1 shared connections)
- [[Bounty creation form]] (1 shared connections)
- [[User & brand profile services]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/withdrawal-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.service.ts`

## Audit Trail

- EXTRACTED: 120 (68%)
- INFERRED: 57 (32%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*