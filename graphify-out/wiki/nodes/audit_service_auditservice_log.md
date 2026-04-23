# `AuditService.log()`

> Fire-and-forget audit writer that every mutation in the API chains into for Hard Rule #3 compliance.

## What it does

`AuditService.log(entry: AuditLogEntry)` persists an `AuditLog` row with `actorId`, `actorRole`, `action`, `entityType`, `entityId`, and optional `beforeState` / `afterState` JSON snapshots plus `reason` and `ipAddress`. It is intentionally fire-and-forget — the internal `prisma.auditLog.create().catch(...)` pattern swallows write failures to a logger instead of bubbling them up, because blocking the request thread on an audit write is considered worse than a transiently missed audit row (reconciliation + webhook replay will eventually surface any inconsistency). The call site pattern is `await this.auditService.log({ ... })` immediately after the domain mutation commits, so actor intent and entity state land close in time even if the DB write races.

## Why it exists

Hard Rule #3 of the project charter requires an AuditLog entry for every admin action and every state-change. This service is the single implementation of that rule — collapsing what would otherwise be per-module ad-hoc `prisma.auditLog.create()` calls into one typed DTO with one implementation, which means adding a new audit field (e.g. `ipAddress` for abuse correlation) is a one-file change. The `AUDIT_ACTIONS` string table lives in `packages/shared` and is what every caller passes into `action` — that indirection is what keeps audit-log analytics consistent across 87 API test suites. Per §4.6 of Financial Non-Negotiables, every financial mutation must emit an AuditLog in the same transaction group; `LedgerService.postTransactionGroup` enforces this by requiring an `audit` field alongside its `legs`.

## How it connects

- **`BountiesService`, `SubmissionsService`, `DisputesService`, `AdminService`, `SubscriptionsService`, `BrandsService`, `WalletService`, `SocialHandlesService`** — every NestJS service with a mutation path calls `.log()` at least once; it is the most-shared dependency in the API-service community (ID 1).
- **`LedgerService.postTransactionGroup`** — audit writes are required in the same DB transaction as ledger legs; `AuditService` is constructor-injected into the ledger module for that purpose.
- **`PrismaService`** — the only dependency; audit writes go through Prisma's `auditLog.create`.
- **`AUDIT_ACTIONS` (shared)** — the canonical list of action strings the `.log()` `action` field accepts (e.g. `SUBMISSION_APPROVED`, `BOUNTY_FUNDED`, `KILL_SWITCH_ACTIVATED`, `SUBMISSION_VISIBILITY_AUTO_REFUND` from ADR 0010).
- **`AdminController` / `FinanceAdminController`** — every super-admin action (kill-switch toggle, override entry, brand status change, user status change) ends with an `.log()` call; that's why FinanceAdminController sits just one hop from here.

The degree-111 figure reflects how nearly every writable path in the API chains through this single method.

---
**degree:** 111 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/audit/audit.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the fire-and-forget pattern is load-bearing. If this ever had to become synchronous to support a legal-hold requirement, every audit-adjacent write path in the graph would need re-testing. The current design leans on reconciliation + AuditLog-count sanity checks as the backstop.
