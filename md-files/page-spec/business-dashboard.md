# Business Dashboard — `/business/dashboard`

**Route path:** `/business/dashboard`
**File:** `apps/web/src/app/business/dashboard/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Dashboard` in `navigation.ts`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4 for the sitemap row.

## Purpose
Landing page for brand admins. Shows four KPI stat cards — total bounties, live bounties, pending reviews, total submissions — plus a prominent Create-bounty CTA.

## Entry & exit
- **Reached from:** Sidebar nav (default landing after login for BUSINESS_ADMIN), login redirect.
- **Links out to:** `/business/bounties/new` (Create CTA), `/business/bounties` (every stat card hrefs here).

## Data
- **React Query hooks:** `useBusinessDashboard()` (`hooks/useDashboard.ts`)
- **API endpoints called:** `GET /api/v1/business/dashboard`
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` — title "Business dashboard", action: Create bounty button (`Plus` icon).
- 4-column responsive grid (1 / 2 / 4 cols at sm/lg) of `glass-card` stat cards, each showing a Lucide icon, count (`font-mono tabular-nums`), label (`eyebrow`).
- Cards are clickable (`cursor-pointer`) and all route to `/business/bounties`.

## States
- **Loading:** `<LoadingState type="cards-grid" cards={4} />`
- **Empty:** N/A — `data` is always an object; zero values render 0.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** 4 stat cards.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create bounty | `router.push` | `/business/bounties/new` |
| (stat card click) | `router.push` | `/business/bounties` |

## Business rules
- RBAC: BUSINESS_ADMIN only (layout guard).
- Data is scoped to the caller's active brand (`user.brandId`) — server resolves via JWT.
- No financial mutations — read-only view.

## Edge cases
- Brand admin without an active brand (`user.brandId === null`): backend returns zeros; no explicit empty-state guard here.
- Stats are not invalidated in realtime — stale until next mount / manual refresh.

## Tests
None colocated. Covered indirectly via `useDashboard` hook tests where present.

## Related files
- `hooks/useDashboard.ts`
- `components/common/PageHeader.tsx`
- `components/common/LoadingState.tsx`
- `components/common/ErrorState.tsx`
- `lib/navigation.ts` (nav entry)

## Open questions / TODOs
- All four stat cards link to the same list page — no deep filter (e.g. Pending reviews could deep-link to `/business/review-center?status=SUBMITTED`).
