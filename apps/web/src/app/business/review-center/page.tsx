'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { useAuth } from '@/hooks/useAuth';
import { useReviewQueue } from '@/hooks/useSubmissions';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import type { SubmissionReviewListItem, ReviewQueueStats, SubmissionBountyInfo } from '@social-bounty/shared';

// The review queue API includes bounty info alongside the standard SubmissionReviewListItem fields
type QueueItem = SubmissionReviewListItem & { bounty?: SubmissionBountyInfo & { category?: string } };

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Needs More Info', value: 'NEEDS_MORE_INFO' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

interface StatCardProps {
  icon: string;
  count: number;
  label: string;
  iconClass: string;
}

function StatCard({ icon, count, label, iconClass }: StatCardProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg border border-glass-border flex items-center justify-center">
          <i className={`pi ${icon} ${iconClass}`} />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold text-text-primary">{count}</p>
          <p className="text-sm text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewCenterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { page, limit, first, onPageChange } = usePagination();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [bountyFilter, setBountyFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const params: Record<string, unknown> = {
    brandId: user?.brandId,
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  };
  if (statusFilter) params.status = statusFilter;
  if (bountyFilter) params.bountyId = bountyFilter;
  if (search) params.search = search;

  const { data, isLoading, error, refetch } = useReviewQueue(params);

  const stats: ReviewQueueStats = data?.stats ?? {
    pending: 0,
    inReview: 0,
    needsMoreInfo: 0,
    approvedToday: 0,
    rejectedToday: 0,
  };

  // Build bounty filter options from the data
  const bountyOptions = [{ label: 'All Bounties', value: '' }];
  if (data?.data) {
    const seen = new Set<string>();
    for (const item of data.data as QueueItem[]) {
      if (item.bounty && !seen.has(item.bounty.id)) {
        seen.add(item.bounty.id);
        bountyOptions.push({ label: item.bounty.title, value: item.bounty.id });
      }
    }
  }

  const breadcrumbs = [{ label: 'Review Center' }];

  const participantTemplate = (rowData: QueueItem) => (
    <div>
      <p className="text-sm font-medium text-text-primary">
        {rowData.user.firstName} {rowData.user.lastName}
      </p>
      <p className="text-xs text-text-muted">{rowData.user.email}</p>
    </div>
  );

  const bountyTemplate = (rowData: QueueItem) => (
    <span className="text-sm text-text-primary">
      {rowData.bounty?.title ?? '-'}
    </span>
  );

  const statusTemplate = (rowData: QueueItem) => (
    <StatusBadge type="submission" value={rowData.status} size="small" />
  );

  const dateTemplate = (rowData: QueueItem) => (
    <span className="font-mono text-sm text-text-secondary">{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: QueueItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/business/review-center/${rowData.id}`)}
      tooltip="Review"
    />
  );

  const hasActiveFilters = !!(statusFilter || bountyFilter || search);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Review Center"
        subtitle="Review Hunter submissions"
        breadcrumbs={breadcrumbs}
        toolbar={{
          search: {
            value: search,
            onChange: setSearch,
            placeholder: 'Search hunter...',
          },
          filters: [
            { key: 'status', placeholder: 'Filter by status', options: statusOptions, ariaLabel: 'Filter by status', className: 'w-full sm:w-48' },
            { key: 'bountyId', placeholder: 'Filter by bounty', options: bountyOptions, ariaLabel: 'Filter by bounty', className: 'w-full sm:w-52' },
          ],
          filterValues: { status: statusFilter, bountyId: bountyFilter },
          onFilterChange: (key, value) => {
            if (key === 'status') setStatusFilter(value);
            else if (key === 'bountyId') setBountyFilter(value);
          },
          onClearFilters: () => { setStatusFilter(''); setBountyFilter(''); setSearch(''); },
          hasActiveFilters,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon="pi-clock"               count={stats.pending}        label="Pending"          iconClass="text-amber-400"   />
        <StatCard icon="pi-eye"                  count={stats.inReview}       label="In Review"        iconClass="text-cyan-400"    />
        <StatCard icon="pi-exclamation-triangle" count={stats.needsMoreInfo}  label="Needs More Info"  iconClass="text-violet-400"  />
        <StatCard icon="pi-check-circle"         count={stats.approvedToday}  label="Approved Today"   iconClass="text-emerald-400" />
        <StatCard icon="pi-times-circle"         count={stats.rejectedToday}  label="Rejected Today"   iconClass="text-red-400"     />
      </div>

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-inbox"
          title="All caught up!"
          message="New submissions will appear here when Hunters drop their proof."
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <DataTable value={data.data} stripedRows aria-label="Submission review queue">
            <Column header="Hunter" body={participantTemplate} />
            <Column header="Bounty" body={bountyTemplate} />
            <Column header="Status" body={statusTemplate} />
            <Column header="Submitted" body={dateTemplate} sortable sortField="createdAt" />
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
      )}
    </div>
  );
}
