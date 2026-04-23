# `useAdmin.ts`

> The TanStack Query hook bundle for every `/admin/*` surface — dashboard, users, brands, bounties, audit logs, overrides.

## What it does

`useAdmin.ts` exports ~20 TanStack Query hooks that wrap `adminApi` (from `lib/api/admin.ts`) and produce cached, invalidation-aware query/mutation pairs. Concretely: `useAdminDashboard`, `useAdminUsers(params)`, `useAdminUserDetail(id)`, `useUpdateUserStatus(id)` (mutation), `useAdminBrands(params)`, `useAdminBrandDetail(id)`, `useCreateBrand` (mutation — SUPER_ADMIN manual brand creation), `useUpdateBrandStatus(id)`, `useAdminBounties(params)`, `useAdminBountyDetail(id)`, `useOverrideBountyStatus` (mutation), `useAdminSubmissions(params)`, `useOverrideSubmission`, `useAuditLogs(params)`, `useAuditLogDetail(id)`, `useAdminRecentErrors(params)`, `useAdminSettings`, `useUpdateSettings`. Every hook uses the canonical `queryKeys.admin.*` key factory from `lib/query-keys.ts`, which is what makes `onSuccess` invalidation coordinated across the admin panel.

## Why it exists

Every admin-facing React page needs typed data + mutations with consistent cache invalidation; centralising the hook definitions here prevents the sprawl of per-page `useQuery({ queryFn: fetch(...) })` blocks that would drift out of sync. This hook bundle is the browser-side mirror of `AdminController` + `AdminService` on the API, and it assumes the same RBAC gate — any page that imports from `useAdmin` lives under `apps/web/src/app/admin/layout.tsx` which enforces `allowedRoles={[SUPER_ADMIN]}` at the layout level (concept_rbac_layout_guard). Phase 3's admin-surface expansion (finance reconciliation drill-downs, visibility-failures page, analytics) all plug into this same pattern.

## How it connects

- **`@social-bounty/shared`** — imports `AdminUserListParams`, `AdminUpdateUserStatusRequest`, `AdminBrandListParams`, `AdminCreateBrandRequest`, `AdminOverrideBountyRequest`, `AuditLogListParams`, `AdminRecentErrorsParams`, `AdminUpdateSettingsRequest`, `BountyListParams`. The hook bundle is 100% typed against the shared DTO set.
- **`adminApi`** — the underlying fetch client in `lib/api/admin.ts`.
- **`queryKeys.admin`** — cache-key factory; paired invalidation calls are coordinated through these keys.
- **`AdminController` (API)** — the server-side counterpart.
- **`AdminService`** — the service the controller delegates to.
- **`/admin/users`, `/admin/brands`, `/admin/bounties`, `/admin/audit-logs` page.tsx** — the primary consumers.
- **`useFinanceAdmin.ts`** — sibling hook bundle for finance-specific admin pages; same pattern, different API surface (finance-admin module).
- **`useAuth()`** — admin pages transitively depend on this to read the current user's role and token.

---
**degree:** 27 • **community:** "React query hooks" (ID 2) • **source:** `apps/web/src/hooks/useAdmin.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this is the densest hook file in the web — 20+ hooks in one module. Splitting it along the admin surface's natural lines (users, brands, bounties, audit, settings) would be a worthwhile hygiene task once another 5-10 hooks land. Not urgent; the file reads top-to-bottom and each section is self-contained.
