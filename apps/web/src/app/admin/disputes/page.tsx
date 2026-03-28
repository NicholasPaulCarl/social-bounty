'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { useAdminDisputes, useDisputeStats } from '@/hooks/useDisputes';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatEnumLabel } from '@/lib/utils/format';
import { DisputeStatus, DisputeCategory } from '@social-bounty/shared';
import type { DisputeListItem } from '@social-bounty/shared';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Open', value: DisputeStatus.OPEN },
  { label: 'Under Review', value: DisputeStatus.UNDER_REVIEW },
  { label: 'Awaiting Response', value: DisputeStatus.AWAITING_RESPONSE },
  { label: 'Escalated', value: DisputeStatus.ESCALATED },
  { label: 'Resolved', value: DisputeStatus.RESOLVED },
  { label: 'Closed', value: DisputeStatus.CLOSED },
  { label: 'Withdrawn', value: DisputeStatus.WITHDRAWN },
];

const categoryOptions = [
  { label: 'All Categories', value: '' },
  { label: 'Non Payment', value: DisputeCategory.NON_PAYMENT },
  { label: 'Post Quality', value: DisputeCategory.POST_QUALITY },
  { label: 'Post Non Compliance', value: DisputeCategory.POST_NON_COMPLIANCE },
];

const categoryColors: Record<DisputeCategory, string> = {
  [DisputeCategory.NON_PAYMENT]: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30',
  [DisputeCategory.POST_QUALITY]: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30',
  [DisputeCategory.POST_NON_COMPLIANCE]: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30',
};

const kpiConfig = [
  { key: 'open', label: 'Total Open', icon: 'pi-flag', bg: 'bg-accent-blue/10', text: 'text-accent-blue' },
  { key: 'underReview', label: 'Under Review', icon: 'pi-eye', bg: 'bg-accent-amber/10', text: 'text-accent-amber' },
  { key: 'awaitingResponse', label: 'Awaiting Response', icon: 'pi-clock', bg: 'bg-accent-violet/10', text: 'text-accent-violet' },
  { key: 'escalated', label: 'Escalated', icon: 'pi-exclamation-triangle', bg: 'bg-accent-rose/10', text: 'text-accent-rose' },
  { key: 'avgResolutionDays', label: 'Avg Resolution Days', icon: 'pi-chart-bar', bg: 'bg-accent-cyan/10', text: 'text-accent-cyan' },
];

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useAdminDisputes({
    page,
    limit,
    status: (statusFilter as DisputeStatus) || undefined,
    category: (categoryFilter as DisputeCategory) || undefined,
    search: search || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: stats } = useDisputeStats();

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const disputes: DisputeListItem[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const kpiValues: Record<string, number | string> = {
    open: stats?.open ?? 0,
    underReview: stats?.underReview ?? 0,
    awaitingResponse: stats?.awaitingResponse ?? 0,
    escalated: stats?.escalated ?? 0,
    avgResolutionDays: stats?.avgResolutionDays != null ? stats.avgResolutionDays.toFixed(1) : '—',
  };

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

  const openedByTemplate = (rowData: DisputeListItem) => (
    <span className="text-sm text-text-secondary">
      {rowData.openedBy ? `${rowData.openedBy.firstName} ${rowData.openedBy.lastName}` : '—'}
    </span>
  );

  const orgTemplate = (rowData: DisputeListItem) => (
    <span className="text-sm text-text-secondary">{rowData.organisationName || '—'}</span>
  );

  const assignedToTemplate = (rowData: DisputeListItem) => (
    rowData.assignedTo ? (
      <span className="text-sm text-text-secondary">
        {rowData.assignedTo.firstName} {rowData.assignedTo.lastName}
      </span>
    ) : (
      <span className="text-xs text-text-muted italic">Unassigned</span>
    )
  );

  const dateTemplate = (rowData: DisputeListItem) => (
    <span className="text-sm text-text-muted">{formatDate(rowData.createdAt)}</span>
  );

  const ageTemplate = (rowData: DisputeListItem) => {
    const days = daysSince(rowData.createdAt);
    return (
      <span className={`text-sm font-medium ${days > 14 ? 'text-accent-rose' : days > 7 ? 'text-accent-amber' : 'text-text-muted'}`}>
        {days}d
      </span>
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Disputes" subtitle="Manage all platform disputes" />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpiConfig.map((kpi) => (
          <div key={kpi.key} className="glass-card p-5 cursor-pointer hover:shadow-glass-lg transition-shadow"
            onClick={() => kpi.key !== 'avgResolutionDays' && router.push(`/admin/disputes?status=${kpi.key.toUpperCase()}`)}
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${kpi.bg}`}>
                <i className={`pi ${kpi.icon} ${kpi.text} text-lg`} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary">{kpiValues[kpi.key]}</p>
                <p className="text-xs text-text-muted">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search disputes..."
            className="w-60"
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Status"
          className="w-52"
        />
        <Dropdown
          value={categoryFilter}
          options={categoryOptions}
          onChange={(e) => setCategoryFilter(e.value)}
          placeholder="Category"
          className="w-56"
        />
        {(statusFilter || categoryFilter || search) && (
          <Button
            icon="pi pi-filter-slash"
            outlined
            severity="secondary"
            onClick={() => { setStatusFilter(''); setCategoryFilter(''); setSearch(''); }}
            tooltip="Clear filters"
          />
        )}
      </div>

      {disputes.length > 0 ? (
        <>
          <div className="glass-card p-6">
            <DataTable
              value={disputes}
              stripedRows
              onRowClick={(e) => router.push(`/admin/disputes/${(e.data as DisputeListItem).id}`)}
              className="cursor-pointer"
              sortMode="single"
            >
              <Column header="Dispute #" body={disputeNumberTemplate} sortField="disputeNumber" sortable style={{ width: '9rem' }} />
              <Column header="Category" body={categoryTemplate} sortField="category" sortable />
              <Column header="Status" body={statusTemplate} sortField="status" sortable />
              <Column header="Filed By" body={openedByTemplate} />
              <Column header="Organisation" body={orgTemplate} sortField="organisationName" sortable />
              <Column header="Assigned To" body={assignedToTemplate} />
              <Column header="Opened" body={dateTemplate} sortField="createdAt" sortable />
              <Column header="Age" body={ageTemplate} sortField="createdAt" sortable style={{ width: '5rem' }} />
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
        <EmptyState icon="pi-flag" title="No disputes found" message="No disputes match your current filters." />
      )}
    </div>
  );
}
