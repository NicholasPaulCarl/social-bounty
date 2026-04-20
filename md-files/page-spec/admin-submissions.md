# Admin submissions list — `/admin/submissions`

**Route path:** `/admin/submissions`
**File:** `apps/web/src/app/admin/submissions/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Main → Submissions
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/social-bounty-mvp.md` (submission lifecycle), CLAUDE.md (Phase 3B admin visibility-failure surface).

## Purpose
Cross-brand submissions directory for platform admin with status + payout-status filters. Drill-down target for moderator escalations and edge-case reviews.

## Entry & exit
- **Reached from:** admin nav → Submissions; dashboard "Total submissions" / "Pending reviews" stat cards; `/admin/users/[id]` Submissions tab; `/admin/brands/[id]` Submissions tab; dispute drilldown.
- **Links out to:** `/admin/submissions/[id]` (Eye action + row click).

## Data
- **React Query hooks:** `useAdminSubmissions({ ...filters, page, limit })`.
- **API endpoints called:** `GET /api/v1/admin/submissions`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; filters in local state (`search`, `status`, `payoutStatus`).

## UI structure
- `PageHeader` with toolbar: search ("Search submissions...") + Status dropdown (Submitted / In Review / Needs More Info / Approved / Rejected) + Payout Status dropdown (Not Paid / Pending / Paid) + clear-filters.
- DataTable (min-w-[600px], cursor-pointer): id (truncated 8 char, font-mono), bounty title, participant (full name), status badge, submitted timestamp, payout badge, Eye action. Row click → detail.
- `Paginator` bound to `data.meta.total`.
- `EmptyState` (Inbox icon) when empty.

## States
- **Loading:** `LoadingState type="table"`.
- **Empty:** `EmptyState` "No submissions" / "Nothing matches your current filters."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** table.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Eye (row) / Row click | `router.push('/admin/submissions/' + rowData.id)` | Submission detail |
| Search / filter | `setFilters(...)` | Refetch |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only list — status override / payout override live on detail.
- Visibility-failure signal (`consecutiveVisibilityFailures > 0`) not exposed on the list today — see `/admin/finance/visibility-failures` for that surface (Phase 3B).

## Edge cases
- `row.user` null (deleted user) → "-".
- `row.bounty` null (orphaned submission from deleted bounty, rare) → "-".
- Truncated id column (first 8 chars) — full id on detail.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminSubmissions`.
- `apps/web/src/components/common/StatusBadge.tsx` — `submission` + `payout` types.

## Open questions / TODOs
- No `visibility-failed` or `consecutiveVisibilityFailures > 0` filter — currently only surfaced at `/admin/finance/visibility-failures`.
- No brand column shown (participant/bounty shown, brand inferred via bounty).
