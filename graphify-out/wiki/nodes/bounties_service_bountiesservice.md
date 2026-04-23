# `BountiesService`

> The orchestration layer for the full bounty lifecycle — DRAFT → LIVE → CLOSED with Stitch funding and proof-rule enforcement.

## What it does

`BountiesService` is the NestJS service that owns every write path on a `Bounty` row. `.create()` instantiates a DRAFT bounty with `BountyAccessType` (PUBLIC or CLOSED), reward structure, channels/formats, and proof-requirements — and enforces the `proofRequirements` integrity rule from commit `f5353d2` (brands must explicitly select at least one). `.update()` accepts the full-shape DTO and enforces per-field DRAFT-only mutation rules. `.findById()` returns the `BountyDetailResponse` including `accessType` (wired 2026-04-17 commit `da71b0a` to fix the reachable-branch bug on CLOSED bounties). `.updateStatus()` drives the state machine — DRAFT → LIVE requires PAID payment status, LIVE → CLOSED is irreversible, CLOSED → RESOLVED happens when the last submission approves. `.fundBounty()` creates a Stitch hosted-checkout link via `StitchClient.createPaymentLink` and chains the browser through `redirect-to-hosted-checkout.ts`. `.deleteBrandAsset()` is a narrow edit path; asset-list edits flow through `.update()` otherwise.

## Why it exists

This service is the backbone of the brand-facing flow — every bounty exists because of a call here, every edit flows through one of its methods, and every state change routes to or from it. The service-layer integrity checks (proof-requirements must be non-empty, DRAFT-only field mutations, DRAFT→LIVE requires PAID) are what keep the state machine from collapsing under partial-update requests. Hard Rule #2 (RBAC mandatory) is enforced in the service's `assertBrandAdmin(bounty, user)` helper, which throws `ForbiddenException` when a BUSINESS_ADMIN attempts to touch a bounty that isn't theirs. `SubscriptionsService.getActiveOrgTier` is consulted inside `.create()` to enforce Pro-tier feature gates (e.g. CLOSED bounties may be Pro-only).

## How it connects

- **`.update()` (degree 22)** — the busiest method on the service; the DRAFT-edit path.
- **`.findById()` (degree 16)** — the read path; also carries `accessType` to power the PUBLIC/CLOSED UI gate.
- **`.create()` (degree 15)** — the DRAFT-creation entry point.
- **`bounties.service.ts`** — source file; graph `contains` relation.
- **`.deleteBrandAsset()`** — narrow asset-list edit.
- **`.updateStatus()`** — the state-machine transition method.
- **`BountiesController`** — the HTTP shell forwarding REST calls.
- **`BountyAccessService`** — sibling service handling applications/invitations on CLOSED bounties.
- **`RefundsService.requestBeforeApproval`** — invoked when a submission fails or a bounty withdraws before approval.
- **`SubscriptionsService`** — consulted for feature-gate checks on Pro-only fields.

---
**degree:** 25 • **community:** "Bounty access & mutation" (ID 15) • **source:** `apps/api/src/modules/bounties/bounties.service.ts`
**last touched:** 3 days ago • **commits (90d):** 18 • **commits (total):** 18

> **Architectural note:** 18 commits in 90 days makes this one of the most-churned services in the monorepo. Most landed via the bounty-submission verification branch and subsequent Phase 2/3 passes, plus the Organisation→Brand rename. Consider splitting the state-machine methods (`updateStatus`, `fundBounty`, `transitionToLive`, `transitionToClosed`) into a `BountyStateMachineService` if the file exceeds ~1500 LOC.
