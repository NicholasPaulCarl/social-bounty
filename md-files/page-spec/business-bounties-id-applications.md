# Bounty Applications — `/business/bounties/[id]/applications`

**Route path:** `/business/bounties/[id]/applications`
**File:** `apps/web/src/app/business/bounties/[id]/applications/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (from bounty detail when access-type is CLOSED).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Approve or reject incoming applications for CLOSED bounties. Only PENDING applications show action buttons.

## Entry & exit
- **Reached from:** Bounty detail page (CLOSED-access bounties surface a link; PUBLIC bounties don't use applications).
- **Links out to:** `/business/bounties/{id}`.

## Data
- **React Query hooks:** `useBounty(bountyId)`, `useApplications(bountyId)`, `useApproveApplication(bountyId)`, `useRejectApplication(bountyId)` (from `hooks/useBountyAccess.ts`).
- **API endpoints called:** `GET /api/v1/bounties/:id`, `GET /api/v1/bounties/:bountyId/applications`, `POST /api/v1/bounties/:bountyId/applications/:id/approve`, `POST /api/v1/bounties/:bountyId/applications/:id/reject`.
- **URL params:** `id`
- **Search params:** none

## UI structure
- `PageHeader` — Applications, breadcrumbs.
- `DataTable` (glass-card wrap) with columns: Hunter (Avatar + name), Message (line-clamp-2), Status (`StatusBadge type="application"` — note `as "bounty"` cast hack), Applied date, Actions (Approve + Reject — only on PENDING).
- In-table paginator enabled when ≥10 rows.
- Empty state: custom inline panel (Inbox icon).
- Two `ConfirmAction` dialogs (approve / reject; reject is non-required-reason-but-permitted).

## States
- **Loading:** `<LoadingState type="table" />`
- **Empty:** Inline "No applications yet" panel.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** DataTable.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Approve | POST `/applications/:id/approve` | Hunter can submit to bounty. |
| Reject | POST `/applications/:id/reject` (`note?`) | Hunter blocked; optional reason. |

## Business rules
- **`BountyAccessType.CLOSED`** — applications are only meaningful on CLOSED bounties. PUBLIC bounties don't need access approval (see CLAUDE.md "Bounty accessType" 2026-04-17).
- Subscription tier: CLOSED-bounty creation is Pro-only; this page is reachable only from a CLOSED bounty's detail.
- No destructive status change on this page beyond the PENDING → APPROVED/REJECTED transition — bounty itself is not touched.
- AuditLog written server-side on both approve and reject (Hard Rule #3).

## Edge cases
- Non-PENDING row: no actions rendered ("No actions" label italicised).
- Approve after hunter already withdrew: server returns error.
- PUBLIC bounty reaching this page: list is empty / may 400 — not surfaced in UI explicitly.

## Tests
None colocated.

## Related files
- `hooks/useBountyAccess.ts` (`useApplications`, `useApproveApplication`, `useRejectApplication`)
- `hooks/useBounties.ts`
- `components/common/ConfirmAction.tsx`, `StatusBadge.tsx`
- `lib/api/client.ts` (`ApiError`)

## Open questions / TODOs
- `StatusBadge type="application" as "bounty"` — the shared `StatusBadge` doesn't have a first-class application status variant. Quick cast.
- Reject dialog has `requireReason={false}` — notes are collected only when the admin volunteers one. No minimum length.
