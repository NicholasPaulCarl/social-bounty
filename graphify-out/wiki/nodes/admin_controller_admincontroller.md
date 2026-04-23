# `AdminController`

> The REST controller exposing `/admin/*` endpoints for user/brand/bounty/submission/audit-log administration.

## What it does

`AdminController` is the NestJS controller under `apps/api/src/modules/admin/admin.controller.ts` that forwards SUPER_ADMIN REST calls to `AdminService`. It exposes: `GET /admin/dashboard` (platform counts), `GET /admin/users` + `/:id` + `PATCH /:id/status` (user management — list, detail, suspend/reinstate), `GET /admin/brands` + `POST /admin/brands` + `GET/:id` + `PATCH /:id/status` (brand management including the SUPER_ADMIN manual-create path), `GET /admin/bounties` + `/:id` + `PATCH /:id/status` (bounty browsing + override state transitions), `GET /admin/submissions` + `/:id` + `PATCH /:id/override` (submission overrides), `GET /admin/audit-logs` + `/:id` (paginated audit-log browse), `GET /admin/recent-errors` (Sentry-correlated error list), `GET/PATCH /admin/settings` (system settings including feature flags). Every method carries `@Roles(UserRole.SUPER_ADMIN)` at the controller level.

## Why it exists

`AdminController` is the HTTP entry surface for the back-office tooling described in `md-files/admin-dashboard.md`. It exists because the `AdminService` must be reachable over REST for the `/admin/*` Next.js pages; keeping the controller thin (no business logic, just `@Roles` + DTO typing + service delegation) satisfies the conventional layering. The controller's decorator set is the machine-checkable definition of the admin surface's RBAC posture — a grep for `@Roles(UserRole.SUPER_ADMIN)` across the repo enumerates the full admin-endpoint list.

## How it connects

- **`AdminService`** — the delegate; every controller method forwards to a service method.
- **`SUPER_ADMIN` role** — the `@Roles` decorator gate on every endpoint.
- **`DisputesController`** — sibling controller for dispute-side admin endpoints; uses the same RBAC pattern.
- **`FinanceAdminController`** — sibling controller for finance-admin endpoints; same pattern.
- **`useAdmin.ts` (web)** — the TanStack Query hook bundle consuming these endpoints.
- **`adminApi`** — the fetch client in the web layer calling these endpoints.
- **`AdminUserListParams`, `AdminUpdateUserStatusRequest`, `AdminCreateBrandRequest`, `AdminUpdateBrandStatusRequest`, `AdminOverrideBountyRequest`, `AdminOverrideSubmissionRequest`, `AuditLogListParams`, `AdminRecentErrorsParams`, `AdminUpdateSettingsRequest` (shared DTOs)** — every endpoint's request/response is typed through these.

---
**degree:** 19 • **community:** "REST API controllers" (ID 4) • **source:** `apps/api/src/modules/admin/admin.controller.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** `AdminController` is effectively a thin dispatch layer; most useful debugging starts at `AdminService`. The density here (19 endpoints) is pushing the upper bound for one controller. If the surface keeps growing, splitting into `AdminUsersController`, `AdminBrandsController`, `AdminBountiesController`, `AdminAuditController` would reduce merge conflicts and make RBAC reviews easier.
