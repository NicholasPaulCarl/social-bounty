'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useAdminOrganisations } from '@/hooks/useAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import type { AdminOrgListItem, AdminOrgListParams } from '@social-bounty/shared';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

export default function AdminBrandsPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<AdminOrgListParams>({ page, limit });

  const { data, isLoading, error, refetch } = useAdminOrganisations({ ...filters, page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const statusTemplate = (rowData: AdminOrgListItem) => (
    <StatusBadge type="organisation" value={rowData.status} />
  );

  const dateTemplate = (rowData: AdminOrgListItem) => (
    <span className="text-text-secondary">{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: AdminOrgListItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/admin/brands/${rowData.id}`)}
      tooltip="View Details"
    />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Brands"
        subtitle="Manage platform brands"
        actions={
          <Button label="Create Brand" icon="pi pi-plus" onClick={() => router.push('/admin/brands/new')} />
        }
        toolbar={{
          search: {
            value: filters.search || '',
            onChange: (value) => setFilters({ ...filters, search: value || undefined, page: 1 }),
            placeholder: 'Search brands...',
          },
          filters: [
            { key: 'status', placeholder: 'Status', options: statusOptions, ariaLabel: 'Filter by status' },
          ],
          filterValues: { status: filters.status || '' },
          onFilterChange: (key, value) => setFilters({ ...filters, [key]: value || undefined, page: 1 }),
          onClearFilters: () => setFilters({ page: 1, limit }),
          hasActiveFilters: !!(filters.search || filters.status),
        }}
      />

      {data && data.data.length > 0 ? (
        <>
          <div className="glass-card overflow-x-auto">
          <DataTable value={data.data} stripedRows className="min-w-[600px]">
            <Column field="name" header="Name" sortable />
            <Column field="contactEmail" header="Contact Email" />
            <Column header="Status" body={statusTemplate} />
            <Column field="memberCount" header="Members" />
            <Column field="bountyCount" header="Bounties" />
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
        <EmptyState
          icon="pi-building"
          title="No brands found"
          message="Nothing matches your current filters."
        />
      )}
    </div>
  );
}
