# Browse Bounties — `/bounties`

**Route path:** `/bounties`
**File:** `apps/web/src/app/(participant)/bounties/page.tsx`
**Role:** Any authenticated role (nav entry is participant-first but the page is open to any authenticated user).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Sidebar "Browse bounties" (participant). Public-surface link lands here after auth.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`. Design handoff: `apps/web/src/styles/design-system/` (Browse Bounties preview HTML).

## Purpose
Primary marketplace entry for hunters — filter, sort, and browse LIVE bounties. Served behind `Suspense` boundary because `useBrowseFilters` calls `useSearchParams`.

## Entry & exit
- **Reached from:** Sidebar, landing page, share/bookmark links (URL round-trips all filters).
- **Links out to:** `/bounties/:id` (card/list row click navigates via `BountyCard` / `BountyListView` internals).

## Data
- **React Query hooks:** `useBounties({ page, limit, status, category, rewardType, sortBy, sortOrder, search })`, `useBrowseFilters()` + `mapSortToApi`.
- **API endpoints called:** `GET /bounties?page=…&limit=…&status=LIVE&category=…&rewardType=…&sortBy=…&search=…`.
- **URL params:** None.
- **Search params:** `page`, `category`, `rewardType`, `sortBy`, `view` (grid|list), `search` — all managed by `useBrowseFilters`.

## UI structure
- `BrowseHero` — gradient hero with live-count metric, optional `newToday` + `weekEarnings` (forward-compat, silently dropped if missing), view-mode toggle (grid/list).
- `BrowseCategoryPills` — horizontal category filter.
- `BrowseFilterBar` (sticky) — search input, reward-type dropdown, sort dropdown, clear-all button.
- `ActiveFilterChips` — appears when any filter is active; chips remove individually.
- Results region: 6 skeleton cards while loading, `ErrorState` on error, `EmptyState` (with "Clear filters" CTA when filters active) on zero results, else grid of `BountyCard` (3-col lg, 2-col sm) or `BountyListView` rows based on view-mode.
- Paginator (only when `meta.total > 12`): "{range} of {total} results" label + PrimeReact `Paginator`.

## States
- **Loading:** 6 `BountyCardSkeleton` in current grid/list layout.
- **Empty:** `EmptyState` — Search icon + "No bounties match" with clear-filters CTA, or Inbox icon + "Nothing live right now" with no CTA.
- **Error:** `ErrorState error={error} onRetry={refetch}`.
- **Success:** Grid/list of bounty cards; URL reflects filter state on each change.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| View toggle | `f.setView('grid'|'list')` | Updates URL |
| Category pill | `f.setCategory(slug)` | Updates URL + refetches |
| Search | `f.setSearch(q)` | Debounced (inside hook) |
| Reward/Sort | `f.setRewardType/f.setSortBy` | Updates URL |
| Remove chip | `f.removeChip(key)` | Clears that filter |
| Clear all | `f.clearAll()` | Resets filters |
| Paginator | `f.setPage(n)` | Updates URL + refetches |

## Business rules
- Page always filters to `status: BountyStatus.LIVE` (closed/draft hidden from hunters).
- `PAGE_LIMIT = 12`.
- Forward-compat: if backend omits `meta.newToday`/`meta.weekEarnings`, hero drops the clause instead of showing zero (comment-locked in source).

## Edge cases
- No search results with filters → EmptyState shows "Clear filters" CTA.
- No live bounties at all → EmptyState shows "check back soon" (no CTA).
- Mobile: grid collapses to 1-col; paginator stacks vertically.
- URL share/refresh reloads identical state.

## Tests
No colocated tests for the page; `BountyCard`, `BrowseHero`, `useBrowseFilters` have isolated tests/usage.

## Related files
- `@/components/features/bounty/*` — `BountyCard`, `BountyCardSkeleton`, `BountyListView`, `BrowseHero`, `BrowseCategoryPills`, `BrowseFilterBar`, `ActiveFilterChips`
- `@/hooks/useBrowseFilters` — URL state serializer
- `@/hooks/useBounties` — data fetch

## Open questions / TODOs
- `meta.newToday` / `meta.weekEarnings` forward-compat — backend ticket pending (source comment).
- `BountyCard`-level click-through navigation is internal to the card component.
