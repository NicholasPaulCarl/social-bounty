# Admin disputes list — `/admin/disputes`

**Route path:** `/admin/disputes`
**File:** `apps/web/src/app/admin/disputes/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance → Disputes
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/social-bounty-mvp.md` (dispute flow), `docs/architecture/api-contracts.md`.

## Purpose
Cross-platform dispute queue with KPI strip, status + category filters, search, sortable DataTable, and age colouring.

## Entry & exit
- **Reached from:** admin sidebar → Disputes; admin dashboard Open/Escalated cards.
- **Links out to:** `/admin/disputes/[id]` (row click); KPI cards → self-filtered list (`?status=...`).

## Data
- **React Query hooks:** `useAdminDisputes({ page, limit, status, category, search, sortBy: 'createdAt', sortOrder: 'desc' })`, `useDisputeStats()`.
- **API endpoints called:** `GET /api/v1/admin/disputes`, `GET /api/v1/admin/disputes/stats`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; `statusFilter`, `categoryFilter`, `search` in local state.

## UI structure
- `PageHeader` subtitle "Manage all platform disputes"; toolbar: search + Status dropdown (filtered to exclude DRAFT) + Category dropdown + clear-filters.
- KPI row (1/2/5 cols responsive): Total open, Under review, Awaiting response, Escalated, Avg resolution days. Each card clickable (except avgResolutionDays) → `/admin/disputes?status=${KEY.toUpperCase()}` deep-link (note: filter currently reset on mount, so URL param is informational).
- DataTable (min-w-[800px]): Dispute # (font-mono, sortable), Category Tag (coloured per `categoryColors`: NON_PAYMENT danger, POST_QUALITY warning, POST_NON_COMPLIANCE pink), Status badge, Filed By (opener name), Brand, Assigned To (or "Unassigned" italic), Opened date, Age (days since; `>14` danger, `>7` warning, else muted).
- `Paginator` below.
- `EmptyState` (Flag icon, "All clear", "No disputes to review right now.") when empty.

## States
- **Loading:** `LoadingState type="table"`.
- **Empty:** `EmptyState`.
- **Error:** `ErrorState` with `refetch()`.
- **Success:** KPI strip + table.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Row click | `router.push('/admin/disputes/:id')` | Dispute detail |
| KPI card click | `router.push('/admin/disputes?status=...')` | Self-filter |
| Search / filter | `setSearch(...)`, `setStatusFilter(...)`, `setCategoryFilter(...)` | Refetch |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only list — all mutations live on detail.
- Age colour bands surface SLA triage.

## Edge cases
- Dispute with no `assignedTo` → "Unassigned" italic.
- Dispute with no `brandName` → "—".
- `avgResolutionDays` null → "—" (not 0).
- Status filter excludes DRAFT (participants can have draft disputes that haven't hit the admin queue).

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useDisputes.ts` — `useAdminDisputes`, `useDisputeStats`.
- `apps/web/src/components/common/StatusBadge.tsx` — `dispute` type.
- `apps/web/src/lib/constants/disputes.ts` — category colours + option lists.

## Open questions / TODOs
- URL param `?status=...` from KPI card click isn't consumed into local state — filter resets on mount.
- No assignee filter (can't see "my assigned disputes" subset).
- No export.
