'use client';

import { useState } from 'react';
import { Paginator } from 'primereact/paginator';
import { useBounties } from '@/hooks/useBounties';
import { usePagination } from '@/hooks/usePagination';
import { BountyCard } from '@/components/features/bounty/BountyCard';
import { BountyFilters } from '@/components/features/bounty/BountyFilters';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { BountyStatus, type BountyListParams } from '@social-bounty/shared';

export default function BrowseBountiesPage() {
  const { page, limit, first, onPageChange, resetPage } = usePagination(12);
  const [filters, setFilters] = useState<BountyListParams>({
    page,
    limit,
    status: BountyStatus.LIVE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const mergedFilters = { ...filters, page, limit };
  const { data, isLoading, error, refetch } = useBounties(mergedFilters);

  const handleFilterChange = (newFilters: BountyListParams) => {
    setFilters(newFilters);
    resetPage();
  };

  return (
    <>
      <PageHeader title="Browse Bounties" subtitle="Find bounties and earn rewards" />

      <BountyFilters filters={filters} onChange={handleFilterChange} />

      {isLoading && <LoadingState type="cards-grid" cards={6} />}

      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-search"
          title="No bounties match your filters"
          message="Try adjusting your search criteria or check back later."
          ctaLabel="Clear Filters"
          ctaAction={() => setFilters({ page: 1, limit, status: BountyStatus.LIVE })}
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>

          <Paginator
            first={first}
            rows={limit}
            totalRecords={data.meta.total}
            onPageChange={onPageChange}
            className="mt-6"
          />
        </>
      )}
    </>
  );
}
