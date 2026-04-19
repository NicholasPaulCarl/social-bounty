'use client';

import { Suspense } from 'react';
import { Paginator } from 'primereact/paginator';
import { Search, Inbox, X } from 'lucide-react';
import { useBounties } from '@/hooks/useBounties';
import { useBrowseFilters, mapSortToApi } from '@/hooks/useBrowseFilters';
import { BountyCard } from '@/components/features/bounty/BountyCard';
import { BountyCardSkeleton } from '@/components/features/bounty/BountyCardSkeleton';
import { BountyListView } from '@/components/features/bounty/BountyListView';
import { BrowseHero } from '@/components/features/bounty/BrowseHero';
import { BrowseCategoryPills } from '@/components/features/bounty/BrowseCategoryPills';
import { BrowseFilterBar } from '@/components/features/bounty/BrowseFilterBar';
import { ActiveFilterChips } from '@/components/features/bounty/ActiveFilterChips';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { BountyStatus, type BountyListItem } from '@social-bounty/shared';

const PAGE_LIMIT = 12;

/**
 * Browse Bounties page — `/bounties`.
 *
 * Per the Claude Design handoff (`Browse Bounties.html` live prototype).
 * Hierarchy top-to-bottom: gradient hero + meta strip → category pills →
 * sticky filter bar → optional active-filter chips → results region (grid
 * skeletons → grid → list → empty) → paginator.
 *
 * URL contract round-trips through `useBrowseFilters`: refresh / share /
 * bookmark `/bounties?category=social-media&rewardType=CASH&sortBy=reward-high&view=list`
 * and the page reloads in that exact state.
 *
 * Forward-compat meta clauses (`newToday` / `weekEarnings`) drop silently
 * when the backend hasn't shipped them — the UI never lies about a "0".
 */
function BrowseBountiesContent() {
  const f = useBrowseFilters();
  const apiSort = mapSortToApi(f.filters.sortBy);

  const { data, isLoading, error, refetch } = useBounties({
    page: f.filters.page,
    limit: PAGE_LIMIT,
    status: BountyStatus.LIVE,
    category: f.filters.category === 'all' ? undefined : f.filters.category,
    rewardType: f.filters.rewardType === 'all' ? undefined : f.filters.rewardType,
    sortBy: apiSort.sortBy,
    sortOrder: apiSort.sortOrder,
    search: f.filters.search || undefined,
  });

  // Forward-compat meta — backend ticket pending. Drop clauses silently.
  type MetaForwardCompat = {
    total: number;
    newToday?: number;
    weekEarnings?: number;
  };
  const meta = (data?.meta ?? { total: 0 }) as MetaForwardCompat;
  const bounties: BountyListItem[] = data?.data ?? [];
  const hasFilters = f.activeChips.length > 0;
  const isGrid = f.filters.view === 'grid';

  return (
    <>
      <BrowseHero
        live={meta.total ?? 0}
        newToday={meta.newToday}
        earnings={meta.weekEarnings}
        viewMode={f.filters.view}
        onViewChange={f.setView}
      />

      <div className="mb-3 sm:mb-4">
        <BrowseCategoryPills value={f.filters.category} onChange={f.setCategory} />
      </div>

      <BrowseFilterBar
        search={f.searchInput}
        onSearchChange={f.setSearch}
        rewardType={f.filters.rewardType}
        onRewardTypeChange={f.setRewardType}
        sortBy={f.filters.sortBy}
        onSortByChange={f.setSortBy}
        hasActiveFilters={hasFilters}
        onClearAll={f.clearAll}
      />

      {hasFilters && (
        <div className="pt-3 sm:pt-4">
          <ActiveFilterChips chips={f.activeChips} onRemove={f.removeChip} />
        </div>
      )}

      <div className="pb-7 pt-4 sm:pt-5">
        {isLoading && (
          <div
            className={
              isGrid
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'grid grid-cols-1 gap-3'
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <BountyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && error && <ErrorState error={error as Error} onRetry={() => refetch()} />}

        {!isLoading && !error && bounties.length === 0 && (
          <EmptyState
            Icon={hasFilters ? Search : Inbox}
            title={hasFilters ? 'No bounties match' : 'Nothing live right now'}
            message={
              hasFilters
                ? 'Try a wider category or different reward type.'
                : 'Fresh hunts get added daily — check back soon.'
            }
            ctaLabel={hasFilters ? 'Clear filters' : undefined}
            ctaAction={hasFilters ? f.clearAll : undefined}
            CtaIcon={hasFilters ? X : undefined}
          />
        )}

        {!isLoading && !error && bounties.length > 0 && (
          <>
            {isGrid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bounties.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>
            ) : (
              <BountyListView bounties={bounties} />
            )}

            {meta.total > PAGE_LIMIT && (
              <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <span
                  className="font-mono tabular-nums text-text-muted"
                  style={{ fontSize: 12 }}
                >
                  {Math.min(bounties.length + (f.filters.page - 1) * PAGE_LIMIT, meta.total)} of{' '}
                  {meta.total} results
                </span>
                <Paginator
                  first={(f.filters.page - 1) * PAGE_LIMIT}
                  rows={PAGE_LIMIT}
                  totalRecords={meta.total}
                  onPageChange={(e) => f.setPage(e.page + 1)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function BrowseBountiesPage() {
  // `useSearchParams` requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <BrowseBountiesContent />
    </Suspense>
  );
}
