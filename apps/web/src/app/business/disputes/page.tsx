'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { useOrgDisputes } from '@/hooks/useDisputes';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatEnumLabel } from '@/lib/utils/format';
import { DISPUTE_STATUS_OPTIONS, DISPUTE_CATEGORY_OPTIONS } from '@/lib/constants/disputes';
import { DisputeStatus, DisputeCategory } from '@social-bounty/shared';
import type { DisputeListItem } from '@social-bounty/shared';

const statusOptions = DISPUTE_STATUS_OPTIONS.filter((o) => o.value !== 'DRAFT');
const categoryOptions = DISPUTE_CATEGORY_OPTIONS;

const categoryColors: Record<string, string> = {
  NON_PAYMENT: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30',
  POST_QUALITY: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30',
  POST_NON_COMPLIANCE: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30',
};

export default function BusinessDisputesPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading, error, refetch } = useOrgDisputes({
    page,
    limit,
    status: (statusFilter as DisputeStatus) || undefined,
    category: (categoryFilter as DisputeCategory) || undefined,
  });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const disputes: DisputeListItem[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const openCount = disputes.filter((d) => d.status === DisputeStatus.OPEN).length;
  const escalatedCount = disputes.filter((d) => d.status === DisputeStatus.ESCALATED).length;
  const resolvedCount = disputes.filter((d) => d.status === DisputeStatus.RESOLVED).length;

  const kpis = [
    { label: 'Open', value: openCount, icon: 'pi-flag', bg: 'bg-accent-blue/10', text: 'text-accent-blue' },
    { label: 'Escalated', value: escalatedCount, icon: 'pi-exclamation-triangle', bg: 'bg-accent-rose/10', text: 'text-accent-rose' },
    { label: 'Resolved', value: resolvedCount, icon: 'pi-check-circle', bg: 'bg-accent-emerald/10', text: 'text-accent-emerald' },
  ];

  const disputeNumberTemplate = (rowData: DisputeListItem) => (
    <span className="font-mono text-xs text-text-secondary">{rowData.disputeNumber}</span>
  );

  const categoryTemplate = (rowData: DisputeListItem) => (
    <Tag
      value={formatEnumLabel(rowData.category)}
      className={`text-xs ${categoryColors[rowData.category] ?? 'bg-elevated text-text-muted border border-glass-border'}`}
    />
  );

  const statusTemplate = (rowData: DisputeListItem) => (
    <StatusBadge type="dispute" value={rowData.status} />
  );

  const participantTemplate = (rowData: DisputeListItem) => (
    <span className="text-sm text-text-secondary">
      {rowData.openedBy ? `${rowData.openedBy.firstName} ${rowData.openedBy.lastName}` : '—'}
    </span>
  );

  const dateTemplate = (rowData: DisputeListItem) => (
    <span className="text-sm text-text-muted">{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: DisputeListItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/business/disputes/${rowData.id}`)}
      tooltip="View Dispute"
    />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Disputes"
        subtitle="Review and manage disputes for your organisation"
        actions={
          <Button
            label="File Dispute"
            icon="pi pi-plus"
            onClick={() => router.push('/business/disputes/new')}
          />
        }
        toolbar={{
          filters: [
            { key: 'status', placeholder: 'Filter by status', options: statusOptions, ariaLabel: 'Filter by status', className: 'w-full sm:w-52' },
            { key: 'category', placeholder: 'Filter by category', options: categoryOptions, ariaLabel: 'Filter by category', className: 'w-full sm:w-56' },
          ],
          filterValues: { status: statusFilter, category: categoryFilter },
          onFilterChange: (key, value) => {
            if (key === 'status') setStatusFilter(value);
            else if (key === 'category') setCategoryFilter(value);
          },
          onClearFilters: () => { setStatusFilter(''); setCategoryFilter(''); },
          hasActiveFilters: !!(statusFilter || categoryFilter),
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${kpi.bg}`}>
                <i className={`pi ${kpi.icon} ${kpi.text} text-xl`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
                <p className="text-sm text-text-muted">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {disputes.length > 0 ? (
        <>
          <div className="glass-card p-6 overflow-x-auto">
            <DataTable
              value={disputes}
              stripedRows
              onRowClick={(e) => router.push(`/business/disputes/${(e.data as DisputeListItem).id}`)}
              className="cursor-pointer min-w-[700px]"
            >
              <Column header="Dispute #" body={disputeNumberTemplate} style={{ width: '10rem' }} />
              <Column field="bountyTitle" header="Bounty" />
              <Column header="Filed By" body={participantTemplate} />
              <Column header="Category" body={categoryTemplate} />
              <Column header="Status" body={statusTemplate} />
              <Column header="Opened" body={dateTemplate} />
              <Column header="" body={actionsTemplate} style={{ width: '4rem' }} />
            </DataTable>
          </div>
          <Paginator
            first={first}
            rows={limit}
            totalRecords={total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      ) : (
        <EmptyState
          icon="pi-flag"
          title="All clear"
          message="No disputes on file. That's a good sign."
          ctaLabel="File a Dispute"
          ctaAction={() => router.push('/business/disputes/new')}
        />
      )}
    </div>
  );
}
