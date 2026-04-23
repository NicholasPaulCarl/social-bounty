# ADRs & audit log

> 64 nodes · cohesion 0.05

## Key Concepts

- **BountiesService** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.update()** (16 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.create()** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.keys()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **validation.ts** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- **ConversationsService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- **useCreateBountyForm.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/useCreateBountyForm.ts`
- **bounty-preview-checks.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/bounty-preview-checks.ts`
- **.computeTotalRewardValue()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.findById()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.delete()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.mapRewards()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.validateChannels()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.validateRewards()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **derivePreviewChecks()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/bounty-preview-checks.ts`
- **FilesController** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **resolveAndValidatePath()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **hasChannelSelection()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- **validateFull()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- **bounties.service.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **files.controller.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **useCreateBountyForm.test.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/__tests__/useCreateBountyForm.test.ts`
- **.duplicate()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.generateEligibilityText()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.updateStatus()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- *... and 39 more nodes in this community*

## Relationships

- [[Bounty form & disputes]] (20 shared connections)
- [[Admin page routes]] (20 shared connections)
- [[SanitizePipe]] (7 shared connections)
- [[Admin operations & overrides]] (6 shared connections)
- [[UpsellBanner.tsx]] (3 shared connections)
- [[reconciliation.controller.rbac.spec.ts]] (3 shared connections)
- [[Apify post scraping]] (2 shared connections)
- [[Community 254]] (1 shared connections)
- [[Auth & webhook verification]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/__tests__/useCreateBountyForm.test.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/__tests__/validation.test.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/useCreateBountyForm.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/__tests__/bounty-preview-checks.test.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/bounty-preview-checks.ts`

## Audit Trail

- EXTRACTED: 184 (79%)
- INFERRED: 49 (21%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*