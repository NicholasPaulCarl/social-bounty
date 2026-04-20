# Review Center — `/business/review-center`

**Route path:** `/business/review-center`
**File:** `apps/web/src/app/business/review-center/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Review Center`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Cross-bounty review queue for a brand. Five stat cards (Pending / In review / Needs more info / Approved today / Rejected today) and a filterable DataTable. The brand-wide review entry point — preferred over the per-bounty submissions list for day-to-day review.

## Entry & exit
- **Reached from:** Sidebar nav.
- **Links out to:** `/business/review-center/{submissionId}`.

## Data
- **React Query hooks:** `useReviewQueue(params)` from `hooks/useSubmissions.ts`, `usePagination`.
- **API endpoints called:** `GET /api/v1/submissions/queue` (BUSINESS_ADMIN + SUPER_ADMIN).
- **URL params:** none
- **Search params:** pagination (`page`, `limit`) via `usePagination`; local state for `statusFilter`, `bountyFilter`, `search`.

## UI structure
- `PageHeader` — Review Center + subtitle + toolbar: search (hunter), Status filter, Bounty filter (options built from loaded data).
- 5-up stat grid (`sm:grid-cols-3 lg:grid-cols-5`) with Lucide icons (Clock, Eye, AlertTriangle, CheckCircle2, XCircle).
- `DataTable` columns: Hunter (name + email), Bounty, Status (`StatusBadge`), Submitted (sortable by `createdAt`), Actions (Eye).
- `Paginator`; `EmptyState` (Inbox) — "All caught up!".
- Default sort: `createdAt` asc, brandId from `user.brandId`.

## States
- **Loading:** `<LoadingState type="table" rows={10} columns={5} />`
- **Empty:** `<EmptyState title="All caught up!" />` (no CTA).
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** stats + table + paginator.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Review (eye icon) | `router.push` | `/business/review-center/{submissionId}` |
| Status / Bounty filter | local state → requery | Server-filtered result. |

## Business rules
- Queue is server-scoped to `brandId` from `user.brandId`.
- `ReviewQueueStats` (`pending / inReview / needsMoreInfo / approvedToday / rejectedToday`) come back inside `data.stats` — zero-safe fallback.
- Bounty filter options are built opportunistically from the loaded page (so they only show bounties present in current results). A brand with many bounties may need to search.

## Edge cases
- No submissions yet: all stats are zero; empty state renders.
- BA with no brand context (`user.brandId` undefined): backend will 400/empty; UI doesn't defend.
- Status filter value empty string (`''`) is not passed to the API (conditional params build).

## Tests
None colocated.

## Related files
- `hooks/useSubmissions.ts` (`useReviewQueue`)
- `hooks/usePagination.ts`, `hooks/useAuth.ts`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `EmptyState.tsx`

## Open questions / TODOs
- `QueueItem` type is declared locally — `SubmissionReviewListItem & { bounty?: SubmissionBountyInfo & { category?: string } }`. If `bounty.category` is actually surfaced by the API, the shared DTO should carry it.
