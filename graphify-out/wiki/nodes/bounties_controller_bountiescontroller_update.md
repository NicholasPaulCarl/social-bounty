# `BountiesController.update()`

> The single `PATCH /bounties/:id` endpoint that fans out to every bounty mutation in the platform.

## What it does

`BountiesController.update()` is the HTTP entry point for brand-admin edits to a bounty — it accepts a partial `UpdateBountyRequest` DTO and delegates to `BountiesService.update()`. In practice the endpoint shoulders a lot: it handles edits to rewards, channels, proof requirements, brand-asset lists, engagement requirements, post-visibility rules, access type (PUBLIC / CLOSED), content format, max submissions, and the DRAFT→LIVE transition via the bounty form's single-shot save. Because brands re-submit the whole form every save, the controller's payload is effectively the bounty's public shape minus read-only fields; the service-layer `update()` handles per-field RBAC and state-machine gates.

## Why it exists

The unusually high degree (74) reflects this controller's role as the busiest mutation surface in the bounty lifecycle — it is touched by the entire bounty-create-to-fund flow (DRAFT create → draft save → proof-requirements pick → fund-bounty redirect per `redirect-to-hosted-checkout.ts`). The 2026-04-16 integrity fix (commit `f5353d2`) is a recent example of the consequence: four coordinated fixes to `proofRequirements` handling landed in a single commit because the controller's PATCH shape was the only place that could enforce the invariant that brands must explicitly select at least one proof type. Hard Rule #2 (RBAC mandatory) is enforced one layer down in the service; the controller provides the typed entry shape and delegation.

## How it connects

- **`BountiesController` (class)** — the `.update()` method belongs to this controller, the other methods (`.create()`, `.findById()`, `.fundBounty()`, `.updateStatus()`, `.applications()`) share its dependencies.
- **`.updateStatus()`, `.updatePayout()`** — semantically similar sibling endpoints that the graph inferred via embedding proximity; together they form the bounty state-machine surface.
- **`.run()`, `.scrapeAndVerify()`** — downstream triggers; when status transitions to CLOSED or a submission approves, these execute asynchronously.
- **`BountiesService.update()` (degree 22)** — the service-layer implementation that the controller delegates to; it enforces DRAFT-only mutation rules and the proof-requirements invariant.
- **`bounties.controller.ts`** — the source file that contains this method and the other bounty endpoints.
- **`CreateBountyRequest` / `UpdateBountyRequest` DTOs (shared)** — every field the controller accepts is typed here; part of the 237-degree `@social-bounty/shared` barrel.

The degree comes primarily from the many cross-module semantic/call edges: update paths touch `bounty-access`, `submissions`, `refunds`, `wallet`, `finance-admin`, `reconciliation`, and `mail`.

---
**degree:** 74 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/bounties/bounties.controller.ts`
**last touched:** 11 days ago • **commits (90d):** 6 • **commits (total):** 6

> **Architectural note:** the wide fan-out of `.update()` is a design smell worth tracking. Every PATCH is a whole-bounty replace; a partial-mutation RPC style (e.g. `PATCH /bounties/:id/rewards`) could reduce the degree but would fragment the current single-commit-per-form-save UX. Not a today-problem.
