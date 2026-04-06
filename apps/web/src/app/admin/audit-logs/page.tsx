'use client';

import { useState } from 'react';
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
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<AuditLogListParams>({ page, limit });
  const [expandedRows, setExpandedRows] = useState<any>(null);

  const { data, isLoading, error, refetch } = useAuditLogs({ ...filters, page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const dateTemplate = (rowData: AuditLogListItem) => (
    <span>{formatDateTime(rowData.createdAt)}</span>
  );

  const rowExpansionTemplate = (data: AuditLogListItem) => (
    <div className="p-4 bg-surface space-y-3">
      {data.reason && (
        <div>
          <span className="text-xs font-medium text-on-surface-variant uppercase">Reason</span>
          <p className="text-sm text-on-surface mt-1">{data.reason}</p>
        </div>
      )}
      {data.beforeState && (
        <div>
          <span className="text-xs font-medium text-on-surface-variant uppercase">Before</span>
          <pre className="text-xs font-mono bg-white p-2 rounded border border-outline-variant mt-1 overflow-auto">
            {JSON.stringify(data.beforeState, null, 2)}
          </pre>
        </div>
      )}
      {data.afterState && (
        <div>
          <span className="text-xs font-medium text-on-surface-variant uppercase">After</span>
          <pre className="text-xs font-mono bg-white p-2 rounded border border-outline-variant mt-1 overflow-auto">
            {JSON.stringify(data.afterState, null, 2)}
          </pre>
        </div>
      )}
      {data.ipAddress && (
        <p className="text-xs text-on-surface-variant">IP: <span className="font-mono">{data.ipAddress}</span></p>
      )}
      {!data.reason && !data.beforeState && !data.afterState && !data.ipAddress && (
        <p className="text-sm text-on-surface-variant">No additional details available.</p>
      )}
    </div>
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
          <DataTable
            value={data.data}
            stripedRows
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            dataKey="id"
          >
            <Column expander style={{ width: '3rem' }} />
            <Column field="action" header="Action" sortable />
            <Column field="entityType" header="Entity Type" />
            <Column field="entityId" header="Entity ID" style={{ maxWidth: '10rem' }} />
            <Column header="User" body={(rowData: AuditLogListItem) => rowData.actor?.email || rowData.actorId} />
            <Column header="Timestamp" body={dateTemplate} />
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
