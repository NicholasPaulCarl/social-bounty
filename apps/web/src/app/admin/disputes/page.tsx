'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
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
import { DISPUTE_STATUS_OPTIONS, DISPUTE_CATEGORY_OPTIONS } from '@/lib/constants/disputes';
import { DisputeStatus, DisputeCategory } from '@social-bounty/shared';
import { Flag, Eye, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { DisputeListItem } from '@social-bounty/shared';

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

const statusOptions = DISPUTE_STATUS_OPTIONS.filter((o) => o.value !== 'DRAFT');
const categoryOptions = DISPUTE_CATEGORY_OPTIONS;

const categoryColors: Record<string, string> = {
  NON_PAYMENT: 'bg-danger-600/10 text-danger-600 border border-danger-600/30',
  POST_QUALITY: 'bg-warning-600/10 text-warning-600 border border-warning-600/30',
  POST_NON_COMPLIANCE: 'bg-pink-100 text-pink-600 border border-pink-200',
};

const kpiConfig: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'open', label: 'Total open', Icon: Flag },
  { key: 'underReview', label: 'Under review', Icon: Eye },
  { key: 'awaitingResponse', label: 'Awaiting response', Icon: Clock },
  { key: 'escalated', label: 'Escalated', Icon: AlertTriangle },
  { key: 'avgResolutionDays', label: 'Avg resolution days', Icon: BarChart3 },
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
    <span className="font-mono tabular-nums text-xs text-text-secondary">{rowData.disputeNumber}</span>
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
    <span className="text-sm text-text-secondary">{rowData.brandName || '—'}</span>
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
    <span className="text-sm text-text-muted font-mono tabular-nums">{formatDate(rowData.createdAt)}</span>
  );

  const ageTemplate = (rowData: DisputeListItem) => {
    const days = daysSince(rowData.createdAt);
    return (
      <span className={`text-sm font-medium font-mono tabular-nums ${days > 14 ? 'text-danger-600' : days > 7 ? 'text-warning-600' : 'text-text-muted'}`}>
        {days}d
      </span>
    );
  };

  const hasActiveFilters = !!(statusFilter || categoryFilter || search);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Disputes"
        subtitle="Manage all platform disputes"
        toolbar={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: 'Search disputes...',
          },
          filters: [
            { key: 'status', placeholder: 'Status', options: statusOptions, ariaLabel: 'Filter by status', className: 'w-full sm:w-52' },
            { key: 'category', placeholder: 'Category', options: categoryOptions, ariaLabel: 'Filter by category', className: 'w-full sm:w-56' },
          ],
          filterValues: { status: statusFilter, category: categoryFilter },
          onFilterChange: (key, value) => {
            if (key === 'status') setStatusFilter(value);
            else if (key === 'category') setCategoryFilter(value);
          },
          onClearFilters: () => { setStatusFilter(''); setCategoryFilter(''); setSearch(''); },
          hasActiveFilters,
        }}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpiConfig.map((kpi) => (
          <div key={kpi.key} className="glass-card p-5 cursor-pointer hover:shadow-glass-lg transition-shadow rounded-xl"
            onClick={() => kpi.key !== 'avgResolutionDays' && router.push(`/admin/disputes?status=${kpi.key.toUpperCase()}`)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-100 text-pink-600">
                <kpi.Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="font-mono tabular-nums text-xl font-bold text-text-primary">{kpiValues[kpi.key]}</p>
                <p className="eyebrow">{kpi.label}</p>
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
              onRowClick={(e) => router.push(`/admin/disputes/${(e.data as DisputeListItem).id}`)}
              className="cursor-pointer min-w-[800px]"
              sortMode="single"
            >
              <Column header="Dispute #" body={disputeNumberTemplate} sortField="disputeNumber" sortable style={{ width: '9rem' }} />
              <Column header="Category" body={categoryTemplate} sortField="category" sortable />
              <Column header="Status" body={statusTemplate} sortField="status" sortable />
              <Column header="Filed By" body={openedByTemplate} />
              <Column header="Brand" body={orgTemplate} sortField="brandName" sortable />
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
        <EmptyState icon="pi-flag" title="All clear" message="No disputes to review right now." />
      )}
    </div>
  );
}
