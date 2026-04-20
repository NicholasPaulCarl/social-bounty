# Brand Disputes — `/business/disputes`

**Route path:** `/business/disputes`
**File:** `apps/web/src/app/business/disputes/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Disputes`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Brand-side disputes list with status / category filters and three summary KPI cards (Open / Escalated / Resolved).

## Entry & exit
- **Reached from:** Sidebar nav.
- **Links out to:** `/business/disputes/new`, `/business/disputes/{id}`.

## Data
- **React Query hooks:** `useBrandDisputes({page, limit, status?, category?})` from `hooks/useDisputes.ts`, `usePagination`.
- **API endpoints called:** `GET /api/v1/disputes/brand`. (`/disputes/brand` not `/disputes/organisation` — CLAUDE.md org→brand rename 2026-04-17 commit `cb388a2` closed a latent bug where the web was calling `/brand` and hitting 404s on the old `/organisation` route.)
- **URL params:** none
- **Search params:** pagination; local state for `statusFilter`, `categoryFilter`.

## UI structure
- `PageHeader` with File-dispute action, toolbar (two filters: status + category, with `DISPUTE_STATUS_OPTIONS` minus DRAFT, and `DISPUTE_CATEGORY_OPTIONS`).
- 3-up KPI grid (Flag / AlertTriangle / CheckCircle2 icons; counts computed locally from current page).
- `DataTable` columns: Dispute # (font-mono), Bounty title, Filed By (openedBy first/last), Category (coloured Tag), Status (`StatusBadge type="dispute"`), Opened date, Actions (Eye). Row click navigates.
- `Paginator`; `EmptyState` (Flag) with File-dispute CTA.

## States
- **Loading:** `<LoadingState type="table" />`
- **Empty:** `<EmptyState title="All clear" />`
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** KPIs + DataTable.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| File dispute | `router.push` | `/business/disputes/new` |
| View (row / eye) | `router.push` | `/business/disputes/{id}` |

## Business rules
- Brand-scoped via JWT — backend filters `brandId`.
- Dispute state machine (canonical in `DisputeStatus` enum): DRAFT → OPEN → ESCALATED → RESOLVED (or WITHDRAWN). DRAFT filtered out of the status dropdown.
- Category colours: NON_PAYMENT → danger, POST_QUALITY → warning, POST_NON_COMPLIANCE → pink.

## Edge cases
- KPI counts are page-local (not server totals) — misleading when paginated. Acceptable for MVP.
- `openedBy` may be null (server-generated system disputes); rendered as em dash.

## Tests
None colocated.

## Related files
- `hooks/useDisputes.ts` (`useBrandDisputes`)
- `lib/constants/disputes.ts` (`DISPUTE_STATUS_OPTIONS`, `DISPUTE_CATEGORY_OPTIONS`)
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `EmptyState.tsx`

## Open questions / TODOs
- KPI cards should use server-side totals, not current-page counts. TODO latent.
