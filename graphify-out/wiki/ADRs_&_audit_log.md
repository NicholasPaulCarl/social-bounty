# ADRs & audit log

> 61 nodes · cohesion 0.05

## Key Concepts

- **BountiesService** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.update()** (16 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.create()** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.keys()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **validation.ts** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- **FakeDecimal** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.add()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.computeTotalRewardValue()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.findById()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **validateProofLinkCoverage()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-coverage.validator.ts`
- **.abs()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **useCreateBountyForm.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/useCreateBountyForm.ts`
- **bounty-preview-checks.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/bounty-preview-checks.ts`
- **.delete()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.mapRewards()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.validateChannels()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **.validateRewards()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- **derivePreviewChecks()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/bounty-preview-checks.ts`
- **FilesController** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **resolveAndValidatePath()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **hasChannelSelection()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- **validateFull()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- **files.controller.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- **wallet-service.spec.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.duplicate()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- *... and 36 more nodes in this community*

## Relationships

- [[Auth & webhook verification]] (194 shared connections)
- [[Admin page routes]] (15 shared connections)
- [[SectionPanel.tsx]] (6 shared connections)
- [[Admin operations & overrides]] (6 shared connections)
- [[Reconciliation engine]] (4 shared connections)
- [[TradeSafe client & payouts]] (2 shared connections)
- [[ADR headline docs]] (2 shared connections)
- [[Bounty access & users]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/files/files.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-coverage.validator.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/useCreateBountyForm.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/validation.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/lib/utils/bounty-preview-checks.ts`

## Audit Trail

- EXTRACTED: 179 (78%)
- INFERRED: 51 (22%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*