# Bounty Submissions List — `/business/bounties/[id]/submissions`

**Route path:** `/business/bounties/[id]/submissions`
**File:** `apps/web/src/app/business/bounties/[id]/submissions/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (Submissions button on bounty detail).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Per-bounty submissions list with paginated DataTable. Acts as a jumping-off point into per-submission review — most reviewers use `/business/review-center` (cross-bounty queue) instead.

## Entry & exit
- **Reached from:** `/business/bounties/{id}` (Submissions button).
- **Links out to:** `/business/bounties/{id}/submissions/{submissionId}`.

## Data
- **React Query hooks:** `useBounty(bountyId)` (breadcrumb context), `useSubmissionsForBounty(bountyId, {page, limit})`, `usePagination`.
- **API endpoints called:** `GET /api/v1/bounties/:id`, `GET /api/v1/bounties/:bountyId/submissions`.
- **URL params:** `id`
- **Search params:** pagination via `usePagination` (`page`, `limit`).

## UI structure
- `PageHeader` — title "Submissions", subtitle = bounty title, breadcrumbs.
- `DataTable` columns: Hunter (firstName + lastName), Status (`StatusBadge type="submission"`), Payout (`StatusBadge type="payout"`), Submitted date (`font-mono tabular-nums`), Actions (Eye → review detail).
- `Paginator` below.
- `EmptyState` (Inbox) — "Waiting on Hunters".

## States
- **Loading:** `<LoadingState type="table" />`
- **Empty:** `<EmptyState ... />` no CTA.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** table + paginator.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Review (eye icon) | `router.push` | `/business/bounties/{id}/submissions/{submissionId}` |

## Business rules
- RBAC enforced server-side (`GET /bounties/:bountyId/submissions` is BUSINESS_ADMIN + SUPER_ADMIN).
- Brand-scoped: backend filters submissions to the bounty belonging to `user.brandId`.
- Read-only list — no approvals from here.

## Edge cases
- Invalid bounty ID / other brand's bounty: 403 / not-found surfaced via `useSubmissionsForBounty` error.
- No submissions yet: empty-state card.

## Tests
None colocated.

## Related files
- `hooks/useSubmissions.ts` (`useSubmissionsForBounty`)
- `hooks/useBounties.ts` (`useBounty`)
- `hooks/usePagination.ts`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `EmptyState.tsx`

## Open questions / TODOs
- No filters / search on this page — if a bounty grows past ~100 submissions this gets clunky. Review-center page is preferred for filtering.
