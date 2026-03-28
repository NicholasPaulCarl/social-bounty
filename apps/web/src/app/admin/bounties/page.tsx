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
import { BountyFilters } from '@/components/features/bounty/BountyFilters';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { BountyListParams, BountyListItem } from '@social-bounty/shared';

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

  return (
    <>
      <PageHeader title="Bounties" subtitle="View and manage all bounties" />

      <BountyFilters filters={filters} onChange={setFilters} showStatusFilter />

      {data && data.data.length > 0 ? (
        <>
          <DataTable value={data.data} stripedRows>
            <Column field="title" header="Title" sortable />
            <Column field="organisationName" header="Organisation" />
            <Column header="Status" body={statusTemplate} />
            <Column header="Reward" body={rewardTemplate} />
            <Column field="submissionCount" header="Submissions" />
            <Column header="Created" body={dateTemplate} />
            <Column header="Actions" body={actionsTemplate} style={{ width: '6rem' }} />
          </DataTable>
          <Paginator
            first={first}
            rows={limit}
            totalRecords={data.meta.total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      ) : (
        <EmptyState icon="pi-megaphone" title="No bounties found" message="No bounties match your current filters." />
      )}
    </>
  );
}
