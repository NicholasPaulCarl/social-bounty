# Page spec documentation

> 144 nodes · cohesion 0.02

## Key Concepts

- **AdminController** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.controller.ts`
- **DisputesController** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.controller.ts`
- **WalletController** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- **BountyAccessController** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.controller.ts`
- **BrandsController** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.controller.ts`
- **BountiesController** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **SubmissionsController** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- **UsersController** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.controller.ts`
- **.list()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **.uploadBrandAssets()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **bounties.controller.ts** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **submissions.controller.ts** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- **.delete()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **WalletProjectionService** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **disputes.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.controller.ts`
- **files.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **users.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.controller.ts`
- **.reviewApplication()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- **.uploadEvidence()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.controller.ts`
- **SocialHandlesController** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/social-handles/social-handles.controller.ts`
- **.listMySubmissions()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- **.uploadFiles()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- **.listForBounty()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- **.snapshot()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- **.listUsers()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.controller.ts`
- *... and 119 more nodes in this community*

## Relationships

- [[REST API controllers]] (325 shared connections)
- [[Wallet service]] (53 shared connections)
- [[API service layer]] (18 shared connections)
- [[User & brand profile services]] (12 shared connections)
- [[Next.js page routes]] (6 shared connections)
- [[Controllers & RBAC guards]] (4 shared connections)
- [[Auth & settings admin]] (3 shared connections)
- [[Bounty access & mutation]] (3 shared connections)
- [[Bounty service & tests]] (2 shared connections)
- [[React query hooks]] (2 shared connections)
- [[Subscription & auth lifecycle]] (1 shared connections)
- [[Inbox & notifications]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.module.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/inbox.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/social-handles/social-handles.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/social-handles/social-handles.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet-projection.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/wallet.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`

## Audit Trail

- EXTRACTED: 287 (66%)
- INFERRED: 145 (34%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*