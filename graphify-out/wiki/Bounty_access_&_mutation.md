# Bounty access & mutation

> 42 nodes · cohesion 0.13

## Key Concepts

- **BountiesService** (25 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.update()** (22 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.findById()** (16 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **BountyAccessService** (16 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.requestBeforeApproval()** (16 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refunds.service.ts`
- **.create()** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.canSubmitToBounty()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.deleteBrandAsset()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.findById()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.withdrawApplication()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.updateStatus()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.getBountyOrThrow()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.overrideBounty()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- **.delete()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.reservesCsv()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **main()** (7 connections) — `/Users/nicholasschreiber/social-bounty/packages/prisma/seed-production.ts`
- **.acknowledgeVisibility()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.computeTotalRewardValue()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.assertBrandAdmin()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.createInvitations()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.revokeInvitation()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.reserves()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- **.duplicate()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.mapRewards()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.validateChannels()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- *... and 17 more nodes in this community*

## Relationships

- [[API service layer]] (44 shared connections)
- [[User & brand profile services]] (7 shared connections)
- [[Finance admin dashboard]] (4 shared connections)
- [[REST API controllers]] (3 shared connections)
- [[Bounty service & tests]] (2 shared connections)
- [[Bounty creation form]] (2 shared connections)
- [[Wallet service]] (2 shared connections)
- [[Auth & settings admin]] (1 shared connections)
- [[Subscription & auth lifecycle]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refunds.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- `/Users/nicholasschreiber/social-bounty/packages/prisma/seed-production.ts`
- `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ci.ts`

## Audit Trail

- EXTRACTED: 150 (52%)
- INFERRED: 140 (48%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*