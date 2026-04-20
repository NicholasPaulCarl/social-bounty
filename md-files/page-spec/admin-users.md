# Admin users list — `/admin/users`

**Route path:** `/admin/users`
**File:** `apps/web/src/app/admin/users/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Main → Users
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `docs/architecture/security-and-rbac.md`, `docs/architecture/api-contracts.md` (admin users).

## Purpose
Paginated directory of every platform user with role + status filters. Drill-down target for user management, status changes, and audit history.

## Entry & exit
- **Reached from:** admin nav → Users; dashboard "Total users" stat card.
- **Links out to:** `/admin/users/[id]` via row action button.

## Data
- **React Query hooks:** `useAdminUsers({ ...filters, page, limit })`.
- **API endpoints called:** `GET /api/v1/admin/users`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; filters held in local React state (`search`, `role`, `status`).

## UI structure
- `PageHeader` with `toolbar`: search input (placeholder "Search users...") + role dropdown (All / Participant / Business Admin / Super Admin) + status dropdown (All / Active / Suspended). Clear-filters button when `hasActiveFilters`.
- `glass-card` wrapping horizontally-scrollable `DataTable` (min-w-[600px]): email (sortable), first name, last name, role badge (`<StatusBadge type="role">`), status badge, created date, actions (Eye button).
- `Paginator` below table bound to `data.meta.total`.
- `EmptyState` (Users icon, "No users found", "Try broadening your search.") when empty.

## States
- **Loading:** `LoadingState type="table"`.
- **Empty:** `EmptyState` component.
- **Error:** `ErrorState` with `refetch()` retry.
- **Success:** DataTable + Paginator.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Eye (row) | `router.push('/admin/users/' + rowData.id)` | Go to user detail |
| Search / filter | `setFilters({ ...filters, key: value, page: 1 })` | Refetch list |
| Clear filters | `setFilters({ page: 1, limit })` | Reset all filters |

## Business rules
- RBAC: SUPER_ADMIN-only throughout.
- Read-only surface; all state-changing actions (suspend/activate) live on the detail page — Hard Rule #6 (confirmation) applies there.
- No audit entry created by this page (read-only list).

## Edge cases
- Users with no `firstName`/`lastName` render empty cells; email (required) always present.
- Legacy Organisation→Brand rename: `role` values are `PARTICIPANT | BUSINESS_ADMIN | SUPER_ADMIN` — user's brand affiliation is surfaced on the detail page.
- Filter combination can return 0 rows → empty state.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminUsers`.
- `apps/web/src/components/common/StatusBadge.tsx` — `role` + `user` types.
- `apps/web/src/hooks/usePagination.ts`.

## Open questions / TODOs
- No inline bulk actions (status flips / role changes) — must click through per user.
- No CSV/report export.
