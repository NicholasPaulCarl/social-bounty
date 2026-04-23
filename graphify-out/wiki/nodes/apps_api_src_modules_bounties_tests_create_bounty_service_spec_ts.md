# `create-bounty.service.spec.ts`

> Behavioural test suite for `BountiesService.create()` — happy paths, validation errors, edge cases, proof-requirements integrity.

## What it does

`create-bounty.service.spec.ts` is the NestJS-testing unit suite that exercises `BountiesService.create()` in isolation with mocked `PrismaService`, `AuditService`, and `SubscriptionsService`. Describe blocks: **Happy paths** (HP-01 single-channel/single-reward, HP-02 multi-channel, HP-03 Pro-tier CLOSED bounty), **Validation errors** (VE-01 through VE-35, covering missing fields, invalid enums, out-of-range amounts, RBAC rejection), **Integrity/Edge** (IS-01 through IS-08, covering the state-machine preconditions and the proof-requirements invariant added in commit `f5353d2`). Mocks come from `test-fixtures.ts` colocated — `createMockPrisma`, `createMockAuditService`, `mockBA` (business-admin user), `mockSA` (super-admin), `validCreateBountyData()`, `baseBountyRecord()`. The `SubscriptionsService` mock returns `FREE` by default; the CLOSED-bounty feature-gate tests flip it to `PRO`.

## Why it exists

Hard Rule #4 (100% test pass rate) is the enforcement pressure behind this suite; the `create()` method is the busiest write path on the `BountiesService` and every regression shows up here first. The `f5353d2` fix (2026-04-16) that closed the four-way proof-requirements inconsistency had test-side coverage added alongside the service-side fix — IS-tests lock the invariant that a bounty may not be created with empty `proofRequirements`. The `baseBounty` fixture gaining `accessType: PUBLIC` (commit `da71b0a`) is the wire-contract lock on the `BountyAccessType` field being serialised end-to-end.

## How it connects

- **`BountiesService`** — the class under test.
- **`test-fixtures.ts`** (sibling) — colocated mocks and fixture builders.
- **`PrismaService`, `AuditService`, `SubscriptionsService`** — mocked providers.
- **`@social-bounty/shared`** — imports every enum used in fixtures (`BountyStatus`, `RewardType`, `SocialChannel`, `PostFormat`, `PostVisibilityRule`, `DurationUnit`, `Currency`).
- **`mockBA`, `mockSA`, `validCreateBountyData`, `baseBountyRecord`, `baseBountyRewardRecord`, `createMockPrisma`, `createMockAuditService`** — fixture exports from `test-fixtures.ts`.
- **`create-bounty-edge-cases.spec.ts`** (sibling spec) — pairs with this file; covers VE-21 / VE-35 / IS-08 cases that once tested `visibilityAcknowledged` (removed in commit `29a3b72`).
- **`update-bounty.service.spec.ts`** (sibling) — complements this suite for the `.update()` method.

---
**degree:** 17 • **community:** "Bounty service & tests" (ID 7) • **source:** `apps/api/src/modules/bounties/__tests__/create-bounty.service.spec.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the describe-block structure (Happy paths / Validation errors / Integrity-edge) is the template worth copying for other service specs. The numbered test IDs (HP-01, VE-01, IS-01) make regressions traceable across commits.
