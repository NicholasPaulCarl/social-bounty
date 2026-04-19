'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paginator } from 'primereact/paginator';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useBounties } from '@/hooks/useBounties';
import { usePagination } from '@/hooks/usePagination';
import { BountyCard } from '@/components/features/bounty/BountyCard';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Search } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, timeRemaining } from '@/lib/utils/format';
import { BountyStatus, BOUNTY_CATEGORIES } from '@social-bounty/shared';
import type { BountyListParams, BountyListItem, RewardType } from '@social-bounty/shared';

type LayoutMode = 'grid' | 'list';

const categories = [
  { id: 'all', label: 'All' },
  ...BOUNTY_CATEGORIES.map((c) => ({ id: c.id, label: c.name })),
];

const rewardTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Other', value: 'OTHER' },
];

const sortOptions = [
  { label: 'Newest', value: 'createdAt' },
  { label: 'Reward (High)', value: 'rewardValue' },
  { label: 'Ending Soon', value: 'ending_soon' },
  { label: 'Title', value: 'title' },
];

export default function BrowseBountiesPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange, resetPage } = usePagination(12);
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filters, setFilters] = useState<BountyListParams>({
    page,
    limit,
    status: BountyStatus.LIVE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const categoryFilter = selectedCategory === 'all' ? undefined : selectedCategory;
  const mergedFilters = { ...filters, page, limit, category: categoryFilter };
  const { data, isLoading, error, refetch } = useBounties(mergedFilters);

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'rewardType') setFilters({ ...filters, rewardType: (value || undefined) as RewardType, page: 1 });
    else setFilters({ ...filters, [key]: value || undefined, page: 1 });
    resetPage();
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    resetPage();
  };

  const hasActiveFilters = !!(filters.search || filters.rewardType || (filters.sortBy && filters.sortBy !== 'createdAt'));

  // For ending_soon sort, sort client-side by endDate ascending and filter to only those with endDate
  const sortedData = (() => {
    if (!data?.data) return [];
    if (filters.sortBy === 'ending_soon') {
      return [...data.data]
        .filter((b) => b.endDate)
        .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());
    }
    return data.data;
  })();

  return (
    <>
      <PageHeader
        title="Browse bounties"
        subtitle="Find bounties and earn rewards"
        pills={{
          items: categories,
          activeId: selectedCategory,
          onChange: handleCategoryChange,
        }}
        toolbar={{
          search: {
            value: filters.search || '',
            onChange: (value) => {
              setFilters({ ...filters, search: value || undefined, page: 1 });
              resetPage();
            },
            placeholder: 'Search bounties...',
          },
          filters: [
            { key: 'rewardType', placeholder: 'Reward Type', options: rewardTypeOptions, ariaLabel: 'Filter by reward type' },
            { key: 'sortBy', placeholder: 'Sort By', options: sortOptions, ariaLabel: 'Sort bounties' },
          ],
          filterValues: {
            rewardType: (filters.rewardType as string) || '',
            sortBy: filters.sortBy || 'createdAt',
          },
          onFilterChange: handleFilterChange,
          onClearFilters: () => {
            setFilters({ page: 1, limit, status: BountyStatus.LIVE, sortBy: 'createdAt', sortOrder: 'desc' });
            setSelectedCategory('all');
            resetPage();
          },
          hasActiveFilters,
          viewMode: layout,
          onViewModeChange: setLayout,
        }}
      />

      {/* Main content area with fade-up animation */}
      <div className="animate-fade-up">
        {isLoading && <LoadingState type={layout === 'grid' ? 'cards-grid' : 'table'} cards={6} />}

        {error && <ErrorState error={error} onRetry={() => refetch()} />}

        {!isLoading && !error && sortedData.length === 0 && (
          <EmptyState
            Icon={Search}
            title="No bounties in sight"
            message="Fresh hunts get added daily — adjust your filters or check back soon."
            ctaLabel="Clear filters"
            ctaAction={() => {
              setFilters({ page: 1, limit, status: BountyStatus.LIVE });
              setSelectedCategory('all');
            }}
          />
        )}

        {!isLoading && !error && sortedData.length > 0 && (
          <>
            {layout === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedData.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>
            ) : (
              <div className="glass-card overflow-x-auto">
                <DataTable
                  value={sortedData}
                  onRowClick={(e) => router.push(`/bounties/${(e.data as BountyListItem).id}`)}
                  rowClassName={() => 'cursor-pointer'}
                  aria-label="Bounties table"
                  scrollable
                  className="min-w-[600px]"
                >
                  <Column field="title" header="Title" />
                  <Column
                    header="Status"
                    body={(row: BountyListItem) => <StatusBadge type="bounty" value={row.status} size="small" />}
                  />
                  <Column field="category" header="Category" />
                  <Column
                    header="Reward"
                    body={(row: BountyListItem) => (
                      <span className="font-mono tabular-nums">
                        {row.rewardValue ? formatCurrency(row.rewardValue, row.currency) : '-'}
                      </span>
                    )}
                  />
                  <Column
                    header="Deadline"
                    body={(row: BountyListItem) => row.endDate ? timeRemaining(row.endDate) : 'No deadline'}
                  />
                  <Column field="submissionCount" header="Submissions" />
                </DataTable>
              </div>
            )}

            <Paginator
              first={first}
              rows={limit}
              totalRecords={data?.meta.total ?? 0}
              onPageChange={onPageChange}
              className="mt-6"
            />
          </>
        )}
      </div>
    </>
  );
}
