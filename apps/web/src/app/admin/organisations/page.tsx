'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
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

export default function AdminOrganisationsPage() {
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
      onClick={() => router.push(`/admin/organisations/${rowData.id}`)}
      tooltip="View Details"
    />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Organisations"
        subtitle="Manage platform organisations"
        actions={
          <Button label="Create Organisation" icon="pi pi-plus" onClick={() => router.push('/admin/organisations/new')} />
        }
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
            placeholder="Search organisations..."
            className="w-64"
          />
        </span>

        <Dropdown
          value={filters.status || ''}
          options={statusOptions}
          onChange={(e) => setFilters({ ...filters, status: e.value || undefined, page: 1 })}
          placeholder="Status"
          className="w-40"
        />

        <Button
          icon="pi pi-filter-slash"
          outlined
          severity="secondary"
          onClick={() => setFilters({ page: 1, limit })}
          tooltip="Clear filters"
        />
      </div>

      {data && data.data.length > 0 ? (
        <>
          <DataTable value={data.data} stripedRows>
            <Column field="name" header="Name" sortable />
            <Column field="contactEmail" header="Contact Email" />
            <Column header="Status" body={statusTemplate} />
            <Column field="memberCount" header="Members" />
            <Column field="bountyCount" header="Bounties" />
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
        <EmptyState
          icon="pi-building"
          title="No organisations found"
          message="No organisations match your current filters."
        />
      )}
    </div>
  );
}
