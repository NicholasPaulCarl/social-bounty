# My Submissions — `/my-submissions`

**Route path:** `/my-submissions`
**File:** `apps/web/src/app/(participant)/my-submissions/page.tsx`
**Role:** Any authenticated role (lists only the current user's submissions).
**Access:** `AuthGuard` via participant layout; API scopes results to `user.id`.
**Nav entry:** Sidebar "My submissions" (participant).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Submissions table + earnings summary for the signed-in hunter. Supports status/payout filters and sort, and links into each submission detail.

## Entry & exit
- **Reached from:** Sidebar nav, wallet transactions, email deep-links.
- **Links out to:** `/my-submissions/:id` (row click), `/bounties` (EmptyState CTA).

## Data
- **React Query hooks:** `useMySubmissions({ page, limit, status, payoutStatus, sortOrder })`, `useMyEarnings()`, `usePagination()`.
- **API endpoints called:** `GET /submissions/mine?page=…&status=…&payoutStatus=…&sortOrder=…`, `GET /submissions/mine/earnings`.
- **URL params:** None.
- **Search params:** None (filter state is local).

## UI structure
- `PageHeader` with `toolbar` (status filter, payout filter, clear button) + `extra` (asc/desc `SelectButton`).
- Earnings summary row: 4 glass-card metrics — Submissions (Send icon), Approved (CheckCircle2), Total earned (Wallet), Pending (Clock).
- Submissions DataTable (min-w-[700px], scrollable): columns Bounty, Status (`StatusBadge type="submission"`), Payout (`StatusBadge type="payout"`), Submitted, Updated.
- `Paginator` under table.

## States
- **Loading:** `LoadingState type="table" rows={10} columns={5}`.
- **Empty:** `EmptyState` — List icon + "No submissions yet" + "Browse bounties" CTA (Search icon) → `/bounties`.
- **Error:** `ErrorState` with retry.
- **Success:** DataTable renders with click-navigation on rows.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Filter status | `setStatusFilter(val)` | Refetches |
| Filter payout | `setPayoutFilter(val)` | Refetches |
| Sort order | `setSortOrder('asc'|'desc')` | Refetches |
| Clear filters | Resets all three | Refetches with defaults |
| Row click | `router.push('/my-submissions/:id')` | Detail page |
| EmptyState CTA | `router.push('/bounties')` | Marketplace |

## Business rules
- Earnings card numbers come from `useMyEarnings` and are unaffected by table filters.
- `sortOrder !== 'desc'` counts as an active filter for the clear-filters state.
- Payout filter uses shared `PayoutStatus` enum values.

## Edge cases
- No submissions → EmptyState.
- Long bounty titles overflow — DataTable column is non-truncating by default (mobile scrolls horizontally via `min-w-[700px]`).
- Earnings hook failure → cards render with `0`/zero currency (nullish coalescing).

## Tests
No colocated tests.

## Related files
- `@/hooks/useSubmissions`, `usePagination`
- `@/components/common/StatusBadge`, `EmptyState`, `LoadingState`, `ErrorState`
- Shared: `MySubmissionListItem`, `SubmissionStatus`, `PayoutStatus`

## Open questions / TODOs
- Earnings cards don't reflect filtered query — intentional, but worth documenting.
- No CSV export.
