# `AdminService`

> SUPER_ADMIN service surface for user management, brand operations, bounty/submission overrides, and audit-log browsing.

## What it does

`AdminService` is the back-office counterpart to `FinanceAdminService`. Where Finance handles ledger-side admin (kill switch, overrides, reconciliation), `AdminService` handles the rest: `.getDashboard()` returns platform counts (brands, users, bounties, submissions, open disputes) from 6 `groupBy` queries (collapsed from 23 parallel counts in the 2026-04-16 perf sweep). `.listUsers()`, `.getUserById()`, `.updateUserStatus()` manage users and their suspension/reinstatement with AuditLog entries. `.listBrands()`, `.createBrand()`, `.updateBrandStatus()` handle brand-level operations including the SUPER_ADMIN manual brand-creation path. `.overrideBountyStatus()` and `.overrideSubmission()` are emergency escape hatches that bypass the normal state machine when production data is in a corrupted state (e.g. a bounty stuck in LIVE after Stitch misrouted a webhook). `.listAuditLogs()` returns paginated audit history; `.getRecentErrors()` surfaces Sentry-correlated errors from the `errors` table.

## Why it exists

Phase 3 delivered the admin dashboard surface defined in `md-files/admin-dashboard.md`. Without `.overrideBountyStatus()`, restoring a bounty stuck in an inconsistent state would require raw SQL. The audit-log read paths exist because Hard Rule #3 requires an append-only audit trail — reading it is the mechanism by which operators prove RBAC actions were taken by the right actors. The `.getDashboard()` perf collapse to 6 `groupBy` queries (commit `6e110ca`) was motivated by the observation that the admin dashboard was the slowest page in the product. Role-gating is enforced at the controller level via `@Roles(UserRole.SUPER_ADMIN)` on `AdminController`.

## How it connects

- **`AdminController`** — the HTTP shell; every endpoint is `@Roles(SUPER_ADMIN)`.
- **`AuditService.log()`** — every mutation through `AdminService` emits an audit row (Hard Rule #3).
- **`PrismaService`** — the dashboard's `groupBy` queries and the list/detail reads.
- **`BountiesService`, `SubmissionsService`, `BrandsService`** — overrides delegate to these when the normal state machine would otherwise gate the action.
- **`useAdmin.ts` (web)** — the TanStack Query hook bundle consuming this service's REST endpoints.
- **`AdminUpdateUserStatusRequest`, `AdminCreateBrandRequest`, `AdminOverrideBountyRequest`, `AdminRecentErrorsParams`, `AdminUpdateSettingsRequest` (shared)** — the DTOs this service accepts/returns.
- **`SUPER_ADMIN` role** — the only role gated to reach this service.

---
**degree:** 22 • **community:** "Auth & settings admin" (ID 13) • **source:** `apps/api/src/modules/admin/admin.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the override methods (`overrideBountyStatus`, `overrideSubmission`) are deliberately thin wrappers that re-use the normal service logic with a `force: true` flag rather than duplicating it. That design is what keeps the state-machine implementation single-source-of-truth; operators can't drift from business rules by using the override path.
