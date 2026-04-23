# Wallet controller & projection

> 26 nodes · cohesion 0.10

## Key Concepts

- **TradeSafeClient** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **FakeDecimal** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.authedRequest()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.deterministicSuffix()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.abs()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **tradesafe.client.spec.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.spec.ts`
- **.fetchWithRetry()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **payouts.service.spec.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- **payouts.service.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **tradesafe.client.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **wallet-service.spec.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.createBeneficiary()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.initiatePayout()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **approxDelta()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- **.constructor()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.getPayoutStatus()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.lessThan()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **buildHarness()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- **buildClient()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.spec.ts`
- **buildConfig()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.spec.ts`
- **respond()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.spec.ts`
- **.isMockMode()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **D()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.constructor()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.toNumber()** (1 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- *... and 1 more nodes in this community*

## Relationships

- [[Admin page routes]] (11 shared connections)
- [[Admin operations & overrides]] (1 shared connections)
- [[Auth & webhook verification]] (1 shared connections)
- [[TradeSafe client & payouts]] (1 shared connections)
- [[ADRs & audit log]] (1 shared connections)
- [[Bounty access & users]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`

## Audit Trail

- EXTRACTED: 62 (79%)
- INFERRED: 16 (21%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*