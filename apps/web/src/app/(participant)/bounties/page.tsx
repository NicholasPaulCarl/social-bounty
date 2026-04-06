'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paginator } from 'primereact/paginator';
import { SelectButton } from 'primereact/selectbutton';
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

const layoutOptions = [
  { icon: 'pi pi-th-large', value: 'grid' },
  { icon: 'pi pi-list', value: 'list' },
];

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

  const layoutTemplate = (option: { icon: string; value: string }) => (
    <i className={option.icon} />
  );

  return (
    <>
      <PageHeader title="Browse Bounties" subtitle="Find bounties and earn rewards" />

      {/* Category chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary hover:opacity-80'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1">
          <BountyFilters filters={filters} onChange={handleFilterChange} />
        </div>
        <SelectButton
          value={layout}
          options={layoutOptions}
          onChange={(e) => { if (e.value) setLayout(e.value); }}
          itemTemplate={layoutTemplate}
          aria-label="Layout toggle"
        />
      </div>

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
                body={(row: BountyListItem) => row.rewardValue ? formatCurrency(row.rewardValue) : '-'}
              />
              <Column
                header="Deadline"
                body={(row: BountyListItem) => row.endDate ? timeRemaining(row.endDate) : 'No deadline'}
              />
              <Column field="submissionCount" header="Submissions" />
            </DataTable>
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
    </>
  );
}
