# Admin bounties list — `/admin/bounties`

**Route path:** `/admin/bounties`
**File:** `apps/web/src/app/admin/bounties/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Main → Bounties
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/social-bounty-mvp.md` (bounty lifecycle).

## Purpose
Full cross-brand bounty directory with status / reward-type / sort filters — a read-only ledger of every bounty ever created on the platform.

## Entry & exit
- **Reached from:** admin nav → Bounties; dashboard "Total bounties" / "Active bounties" stat cards; `/admin/brands/[id]` Bounties tab.
- **Links out to:** `/admin/bounties/[id]` (Eye button).

## Data
- **React Query hooks:** `useAdminBounties({ ...filters, page, limit })`.
- **API endpoints called:** `GET /api/v1/admin/bounties`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; filters in local state (`search`, `status`, `rewardType`, `sortBy`).

## UI structure
- `PageHeader` with toolbar: search ("Search bounties...") + Status dropdown (Draft / Live / Paused / Closed) + Reward Type dropdown (Cash / Product / Service / Other) + Sort By dropdown (Newest / Reward High / Ending Soon / Title).
- DataTable (min-w-[600px]): title (sortable), brandName, status badge, reward (currency-formatted, `font-mono tabular-nums`), submission count, created date, Eye action.
- `Paginator` below.
- `EmptyState` (Megaphone icon) when empty.

## States
- **Loading:** `LoadingState type="table"`.
- **Empty:** `EmptyState` "No bounties found" / "Nothing matches your current filters."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** table + paginator.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Eye (row) | `router.push('/admin/bounties/' + rowData.id)` | Bounty detail |
| Search / filter / sort | `setFilters(...)` | Refetch list |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only list — all mutations (status override) live on detail.
- `accessType` field added to `BountyListItem` in commit `da71b0a` (was latent bug) — surfaces here as a visible wire-contract field (the list column isn't shown but the data is present).

## Edge cases
- Terminal-state bounties (CLOSED) still listed and openable (read-only on detail).
- Reward-type `OTHER` renders `formatCurrency(0, currency)` for `rewardValue === 0` cases without crashing.
- Sort `ending_soon` only meaningful for bounties with `endDate` set.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminBounties`.
- `apps/web/src/components/common/StatusBadge.tsx` — `bounty` type.

## Open questions / TODOs
- No reward currency filter; mixed-ZAR/USD tables depend on brand scope.
- No "bounty created by" filter (would help triage per-BA-user).
