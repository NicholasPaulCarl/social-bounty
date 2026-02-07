'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useAuditLogs } from '@/hooks/useAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/utils/format';
import type { AuditLogListItem, AuditLogListParams } from '@social-bounty/shared';

const actionOptions = [
  { label: 'All Actions', value: '' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Status Change', value: 'STATUS_CHANGE' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Override', value: 'OVERRIDE' },
];

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<AuditLogListParams>({ page, limit });

  const { data, isLoading, error, refetch } = useAuditLogs({ ...filters, page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const dateTemplate = (rowData: AuditLogListItem) => (
    <span>{formatDateTime(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: AuditLogListItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/admin/audit-logs/${rowData.id}`)}
      tooltip="View Details"
    />
  );

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Track all platform actions and changes" />

      <div className="flex flex-wrap gap-3 mb-6">
        <Dropdown
          value={filters.action || ''}
          options={actionOptions}
          onChange={(e) => setFilters({ ...filters, action: e.value || undefined, page: 1 })}
          placeholder="Action"
          className="w-40"
        />

        <InputText
          value={filters.entityType || ''}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value || undefined, page: 1 })}
          placeholder="Entity type..."
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
            <Column field="action" header="Action" sortable />
            <Column field="entityType" header="Entity Type" />
            <Column field="entityId" header="Entity ID" style={{ maxWidth: '10rem' }} />
            <Column header="User" body={(rowData: AuditLogListItem) => rowData.actor?.email || rowData.actorId} />
            <Column header="Timestamp" body={dateTemplate} />
            <Column header="" body={actionsTemplate} style={{ width: '4rem' }} />
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
        <EmptyState icon="pi-history" title="No audit logs found" message="No audit log entries match your current filters." />
      )}
    </>
  );
}
