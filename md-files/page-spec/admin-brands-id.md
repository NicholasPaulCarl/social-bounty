# Admin brand detail — `/admin/brands/[id]`

**Route path:** `/admin/brands/[id]`
**File:** `apps/web/src/app/admin/brands/[id]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, CLAUDE.md (Organisation→Brand rename commits `539467e`, `8e4c21f`), `md-files/brand-profile-and-signup.md` (KYB spec), `md-files/financial-architecture.md` (subscription tier).

## Purpose
Per-brand admin drill-down: core info, members/bounties/submissions counters, drill-down tabs for Bounties + Submissions, and Suspend/Activate with reason capture.

## Entry & exit
- **Reached from:** `/admin/brands` row; `/admin/bounties/[id]` (Brand link in detail sidebar); `/admin/disputes/[id]` (Brand context panel).
- **Links out to:** `/admin/bounties/[id]` (Bounties tab row click), `/admin/submissions/[id]` (Submissions tab row click).

## Data
- **React Query hooks:** `useAdminBrandDetail(id)`, `useUpdateBrandStatus(id)`, `useAdminBounties({ brandId, limit: 20 })`, `useAdminSubmissions({ brandId, limit: 20 })`.
- **API endpoints called:** `GET /api/v1/admin/brands/:id`, `PATCH /api/v1/admin/brands/:id/status`, `GET /api/v1/admin/bounties?brandId=…`, `GET /api/v1/admin/submissions?brandId=…`.
- **URL params:** `id` (brand UUID).
- **Search params:** none (tab state local).

## UI structure
- `PageHeader` with breadcrumbs (Brands → name) + right-side Suspend/Activate button (state-driven, danger outlined / success outlined).
- `TabView` with 3 tabs:
  1. **Overview** — left "Brand Information" (name, contact email, status, created), right "Stats" (member count, bounty count).
  2. **Bounties** — DataTable (title, status, formatted currency reward, submission count, created) with row-click → `/admin/bounties/[id]`.
  3. **Submissions** — DataTable (id-8, bounty title, participant name, status badge, payout badge) with row-click → `/admin/submissions/[id]`.
- Two `ConfirmAction` dialogs (Suspend with destructive-action copy about members losing access & bounties pausing; Activate); both `requireReason`.

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty (sub-tabs):** "No bounties found for this brand." / "No submissions found for this brand."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** full view.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Suspend | `updateStatus.mutate({ status: SUSPENDED, reason })` | Confirm dialog; members lose access, active bounties paused; AuditLog |
| Activate | `updateStatus.mutate({ status: ACTIVE, reason })` | Confirm dialog; AuditLog |
| Row click (Bounties) | `router.push('/admin/bounties/:id')` | Bounty detail |
| Row click (Submissions) | `router.push('/admin/submissions/:id')` | Submission detail |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Destructive-action confirmation (Hard Rule #6)** — `ConfirmAction` with `requireReason` on status flips.
- **Audit log mandatory (Hard Rule #3)** — backend persists `UPDATE brand.status`.
- KYB / plan tier / members list are **not** surfaced here inline — each sits on `/business/brands/*` counterpart routes that are BUSINESS_ADMIN-scoped. Admin-side access is limited to status + counts.

## Edge cases
- Brand with no name — fallback label "Brand" on breadcrumb.
- Brand with `memberCount === 0` — still shown (created via `/admin/brands/new` before owner joined).
- Suspending a brand with LIVE bounties — destructive copy warns the admin; backend is responsible for the cascade.
- Suspended brand with open disputes — no warning surfaced here; disputes visible via `/admin/disputes?brandId=…`.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminBrandDetail`, `useUpdateBrandStatus`.
- `apps/web/src/components/common/ConfirmAction.tsx`.
- `apps/api/src/modules/admin/admin.service.ts`.

## Open questions / TODOs
- KYB state + subscription tier + Stitch funding balance would be high-value here (needs a cross-module aggregate).
- Member list (with role + joined date) missing; currently only `memberCount` scalar.
- No direct link to brand's funding / reserves surface (`/admin/finance/reserves?brandId=`).
