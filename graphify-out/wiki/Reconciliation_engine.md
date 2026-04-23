# Reconciliation engine

> 42 nodes · cohesion 0.08

## Key Concepts

- **StitchClient** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **UpgradeService** (16 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.authedRequest()** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.getToken()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.processRecurringCharge()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.processChargeFailed()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.processConsentAuthorised()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **StitchPayoutAdapter** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/stitch-payout.adapter.ts`
- **.readString()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.createPayout()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.probeToken()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.extractStitchSubscriptionId()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.systemActorId()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.createRefund()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.fetchWithRetry()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.extractFees()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.cancelStitchSubscription()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.constructor()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.createPaymentLink()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.createSubscription()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.cancelMandate()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.extractAmount()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.extractConsentId()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.extractReason()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.extractStitchPaymentId()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- *... and 17 more nodes in this community*

## Relationships

- [[Admin withdrawals UI]] (76 shared connections)
- [[Apify post scraping]] (72 shared connections)
- [[Admin operations & overrides]] (20 shared connections)
- [[Admin page routes]] (5 shared connections)
- [[Auth & webhook verification]] (3 shared connections)
- [[Bounty access & users]] (3 shared connections)
- [[SectionPanel.tsx]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/stitch-payout.adapter.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`

## Audit Trail

- EXTRACTED: 144 (80%)
- INFERRED: 36 (20%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*