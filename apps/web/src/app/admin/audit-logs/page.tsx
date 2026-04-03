'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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
    <span className="text-text-secondary font-mono text-xs">{formatDateTime(rowData.createdAt)}</span>
  );

  const rowExpansionTemplate = (data: AuditLogListItem) => (
    <div className="p-4 space-y-3 border-l-2 border-accent-violet">
      {data.reason && (
        <div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Reason</span>
          <p className="text-sm text-text-secondary mt-1">{data.reason}</p>
        </div>
      )}
      {data.beforeState && (
        <div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Before</span>
          <pre className="text-xs font-mono glass-card p-2 rounded border border-glass-border mt-1 overflow-auto text-text-secondary">
            {JSON.stringify(data.beforeState, null, 2)}
          </pre>
        </div>
      )}
      {data.afterState && (
        <div>
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">After</span>
          <pre className="text-xs font-mono glass-card p-2 rounded border border-glass-border mt-1 overflow-auto text-text-secondary">
            {JSON.stringify(data.afterState, null, 2)}
          </pre>
        </div>
      )}
      {data.ipAddress && (
        <p className="text-xs text-text-muted">IP: <span className="font-mono text-text-secondary">{data.ipAddress}</span></p>
      )}
      {!data.reason && !data.beforeState && !data.afterState && !data.ipAddress && (
        <p className="text-sm text-text-muted">No additional details available.</p>
      )}
    </div>
  );

  const hasActiveFilters = !!(filters.action || filters.entityType);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Audit Logs"
        subtitle="Track all platform actions and changes"
        toolbar={{
          search: {
            value: filters.entityType || '',
            onChange: (value) => setFilters({ ...filters, entityType: value || undefined, page: 1 }),
            placeholder: 'Entity type...',
          },
          filters: [
            { key: 'action', placeholder: 'Action', options: actionOptions, ariaLabel: 'Filter by action' },
          ],
          filterValues: { action: filters.action || '' },
          onFilterChange: (key, value) => setFilters({ ...filters, [key]: value || undefined, page: 1 }),
          onClearFilters: () => setFilters({ page: 1, limit }),
          hasActiveFilters,
        }}
      />

      {data && data.data.length > 0 ? (
        <>
          <div className="glass-card overflow-x-auto">
          <DataTable
            value={data.data}
            stripedRows
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            dataKey="id"
            className="min-w-[600px]"
          >
            <Column expander style={{ width: '3rem' }} />
            <Column field="action" header="Action" sortable />
            <Column field="entityType" header="Entity Type" />
            <Column field="entityId" header="Entity ID" style={{ maxWidth: '10rem' }} />
            <Column header="User" body={(rowData: AuditLogListItem) => (
              <span className="text-text-secondary">{rowData.actor?.email || rowData.actorId}</span>
            )} />
            <Column header="Timestamp" body={dateTemplate} />
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
        <EmptyState icon="pi-history" title="No activity" message="No audit entries match your filters." />
      )}
    </div>
  );
}
