'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paginator } from 'primereact/paginator';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useBounties } from '@/hooks/useBounties';
import { usePagination } from '@/hooks/usePagination';
import { BountyCard } from '@/components/features/bounty/BountyCard';
import { BountyFilters } from '@/components/features/bounty/BountyFilters';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, timeRemaining } from '@/lib/utils/format';
import { BountyStatus, BOUNTY_CATEGORIES } from '@social-bounty/shared';
import type { BountyListParams, BountyListItem } from '@social-bounty/shared';

type LayoutMode = 'grid' | 'list';

const categories = [
  { id: 'all', name: 'All' },
  ...BOUNTY_CATEGORIES,
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

  const handleFilterChange = (newFilters: BountyListParams) => {
    setFilters(newFilters);
    resetPage();
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    resetPage();
  };

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
      <PageHeader title="Browse Bounties" subtitle="Find bounties and earn rewards" />

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-3 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border
              ${
                selectedCategory === cat.id
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 shadow-glow-cyan'
                  : 'bg-glass-bg border-glass-border text-text-secondary hover:bg-white/5 hover:text-text-primary hover:border-white/20'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filters + Layout toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1">
          <BountyFilters filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Glass layout toggle buttons */}
        <div className="flex items-center glass-card !rounded-lg overflow-hidden !p-0">
          <button
            onClick={() => setLayout('grid')}
            aria-label="Grid view"
            className={`flex items-center justify-center w-10 h-10 transition-all duration-200
              ${
                layout === 'grid'
                  ? 'bg-accent-cyan/15 text-accent-cyan shadow-glow-cyan'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
          >
            <i className="pi pi-th-large text-sm" />
          </button>
          <div className="w-px h-5 bg-glass-border" />
          <button
            onClick={() => setLayout('list')}
            aria-label="List view"
            className={`flex items-center justify-center w-10 h-10 transition-all duration-200
              ${
                layout === 'list'
                  ? 'bg-accent-cyan/15 text-accent-cyan shadow-glow-cyan'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
          >
            <i className="pi pi-list text-sm" />
          </button>
        </div>
      </div>

      {/* Main content area with fade-up animation */}
      <div className="animate-fade-up">
        {isLoading && <LoadingState type={layout === 'grid' ? 'cards-grid' : 'table'} cards={6} />}

        {error && <ErrorState error={error} onRetry={() => refetch()} />}

        {!isLoading && !error && sortedData.length === 0 && (
          <EmptyState
            icon="pi-search"
            title="No bounties match your filters"
            message="Try adjusting your search criteria or check back later."
            ctaLabel="Clear Filters"
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
              <div className="glass-card overflow-hidden">
                <DataTable
                  value={sortedData}
                  onRowClick={(e) => router.push(`/bounties/${(e.data as BountyListItem).id}`)}
                  rowClassName={() => 'cursor-pointer'}
                  aria-label="Bounties table"
                >
                  <Column field="title" header="Title" />
                  <Column
                    header="Status"
                    body={(row: BountyListItem) => <StatusBadge type="bounty" value={row.status} size="small" />}
                  />
                  <Column field="category" header="Category" />
                  <Column
                    header="Reward"
                    body={(row: BountyListItem) => row.rewardValue ? formatCurrency(row.rewardValue, row.currency) : '-'}
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
