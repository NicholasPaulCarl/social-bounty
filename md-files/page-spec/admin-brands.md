# Admin brands list — `/admin/brands`

**Route path:** `/admin/brands`
**File:** `apps/web/src/app/admin/brands/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Main → Brands
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, CLAUDE.md (Organisation→Brand rename commits `539467e`, `8e4c21f`, `c055b2a`/`55cb3b8`/`cb388a2`).

## Purpose
Paginated brand directory (formerly Organisations) with name search + status filter. Entry point to brand detail and brand creation.

## Entry & exit
- **Reached from:** admin nav → Brands; dashboard "Total brands" stat card.
- **Links out to:** `/admin/brands/[id]` (Eye button), `/admin/brands/new` (Create brand button).

## Data
- **React Query hooks:** `useAdminBrands({ ...filters, page, limit })`.
- **API endpoints called:** `GET /api/v1/admin/brands`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; `search`, `status` filters in local state.

## UI structure
- `PageHeader` title "Brands" / subtitle "Manage platform brands"; right-action "Create brand" button; toolbar with search + status filter (All / Active / Suspended) + clear-filters control.
- `glass-card` DataTable: name (sortable), contact email, status badge, member count, bounty count, created date, Eye action.
- `Paginator` bound to `data.meta.total`.
- `EmptyState` (Building2 icon) when no rows.

## States
- **Loading:** `LoadingState type="table"`.
- **Empty:** `EmptyState` "No brands found" / "Nothing matches your current filters."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** full table.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create brand | `router.push('/admin/brands/new')` | New brand form |
| Eye (row) | `router.push('/admin/brands/' + rowData.id)` | Brand detail |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only list; mutations all happen on detail / new pages.
- Backend keeps Prisma `@map`/`@@map` to legacy `organisations` table — no data migration occurred, only identifier rename in TS + route paths.

## Edge cases
- Brand with no members (`memberCount === 0`) renders `0` — still valid (created by super admin before first user joined).
- Contact email can be blank — column shows it as-is.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminBrands`.
- `apps/web/src/components/common/StatusBadge.tsx` — `brand` type.

## Open questions / TODOs
- No KYB status badge on the list (only on detail) — would be a quick scannability win.
- No inline bulk status flips.
