'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useAdminUsers } from '@/hooks/useAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import type { AdminUserListItem, AdminUserListParams } from '@social-bounty/shared';

const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Participant', value: 'PARTICIPANT' },
  { label: 'Business Admin', value: 'BUSINESS_ADMIN' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
];

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<AdminUserListParams>({ page, limit });

  const { data, isLoading, error, refetch } = useAdminUsers({ ...filters, page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const statusTemplate = (rowData: AdminUserListItem) => (
    <StatusBadge type="user" value={rowData.status} />
  );

  const roleTemplate = (rowData: AdminUserListItem) => (
    <StatusBadge type="role" value={rowData.role} />
  );

  const dateTemplate = (rowData: AdminUserListItem) => (
    <span className="text-text-secondary">{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: AdminUserListItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/admin/users/${rowData.id}`)}
      tooltip="View Details"
    />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title="Users" subtitle="Manage platform users" />

      <div className="flex flex-wrap gap-3 mb-6">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
            placeholder="Search users..."
            className="w-64"
          />
        </span>

        <Dropdown
          value={filters.role || ''}
          options={roleOptions}
          onChange={(e) => setFilters({ ...filters, role: e.value || undefined, page: 1 })}
          placeholder="Role"
          className="w-40"
        />

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
          <div className="glass-card overflow-x-auto">
          <DataTable value={data.data} stripedRows className="min-w-[600px]">
            <Column field="email" header="Email" sortable />
            <Column field="firstName" header="First Name" />
            <Column field="lastName" header="Last Name" />
            <Column header="Role" body={roleTemplate} />
            <Column header="Status" body={statusTemplate} />
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
        <EmptyState icon="pi-users" title="No users found" message="No users match your current filters." />
      )}
    </div>
  );
}
