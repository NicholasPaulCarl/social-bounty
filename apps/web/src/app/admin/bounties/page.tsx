'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { useAdminBounties } from '@/hooks/useAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { BountyListParams, BountyListItem, BountyStatus, RewardType } from '@social-bounty/shared';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Closed', value: 'CLOSED' },
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

export default function AdminBountiesPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<BountyListParams>({ page, limit });

  const { data, isLoading, error, refetch } = useAdminBounties({ ...filters, page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const statusTemplate = (rowData: BountyListItem) => (
    <StatusBadge type="bounty" value={rowData.status} />
  );

  const rewardTemplate = (rowData: BountyListItem) => (
    <span>{formatCurrency(rowData.rewardValue, rowData.currency)}</span>
  );

  const dateTemplate = (rowData: BountyListItem) => (
    <span>{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: BountyListItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/admin/bounties/${rowData.id}`)}
      tooltip="View Details"
    />
  );

  const hasActiveFilters = !!(filters.search || filters.status || filters.rewardType || (filters.sortBy && filters.sortBy !== 'createdAt'));

  return (
    <>
      <PageHeader
        title="Bounties"
        subtitle="View and manage all bounties"
        toolbar={{
          search: {
            value: filters.search || '',
            onChange: (value) => setFilters({ ...filters, search: value || undefined, page: 1 }),
            placeholder: 'Search bounties...',
          },
          filters: [
            { key: 'status', placeholder: 'Status', options: statusOptions, ariaLabel: 'Filter by status' },
            { key: 'rewardType', placeholder: 'Reward Type', options: rewardTypeOptions, ariaLabel: 'Filter by reward type' },
            { key: 'sortBy', placeholder: 'Sort By', options: sortOptions, ariaLabel: 'Sort bounties' },
          ],
          filterValues: {
            status: (filters.status as string) || '',
            rewardType: (filters.rewardType as string) || '',
            sortBy: filters.sortBy || 'createdAt',
          },
          onFilterChange: (key, value) => {
            if (key === 'status') setFilters({ ...filters, status: (value || undefined) as BountyStatus, page: 1 });
            else if (key === 'rewardType') setFilters({ ...filters, rewardType: (value || undefined) as RewardType, page: 1 });
            else setFilters({ ...filters, [key]: value || undefined, page: 1 });
          },
          onClearFilters: () => setFilters({ page: 1, limit }),
          hasActiveFilters,
        }}
      />

      {data && data.data.length > 0 ? (
        <>
          <div className="glass-card overflow-x-auto">
          <DataTable value={data.data} stripedRows className="min-w-[600px]">
            <Column field="title" header="Title" sortable />
            <Column field="organisationName" header="Brand" />
            <Column header="Status" body={statusTemplate} />
            <Column header="Reward" body={rewardTemplate} />
            <Column field="submissionCount" header="Submissions" />
            <Column header="Created" body={dateTemplate} />
            <Column header="Actions" body={actionsTemplate} style={{ width: '6rem' }} />
          </DataTable>
          </div>
          <Paginator
            first={first}
            rows={limit}
            totalRecords={data.meta.total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      ) : (
        <EmptyState icon="pi-megaphone" title="No bounties found" message="Nothing matches your current filters." />
      )}
    </>
  );
}
