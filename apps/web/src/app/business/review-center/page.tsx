'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
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
  bgColor: string;
  iconColor: string;
}

function StatCard({ icon, count, label, bgColor, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-outline-variant p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <i className={`pi ${icon} ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold text-on-surface">{count}</p>
          <p className="text-sm text-on-surface-variant">{label}</p>
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
    orgId: user?.organisationId,
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
      <p className="text-sm font-medium text-on-surface">
        {rowData.user.firstName} {rowData.user.lastName}
      </p>
      <p className="text-xs text-on-surface-variant">{rowData.user.email}</p>
    </div>
  );

  const bountyTemplate = (rowData: QueueItem) => (
    <span className="text-sm text-on-surface">
      {rowData.bounty?.title ?? '-'}
    </span>
  );

  const statusTemplate = (rowData: QueueItem) => (
    <StatusBadge type="submission" value={rowData.status} size="small" />
  );

  const dateTemplate = (rowData: QueueItem) => (
    <span className="font-mono text-sm text-on-surface">{formatDate(rowData.createdAt)}</span>
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

  return (
    <>
      <PageHeader
        title="Review Center"
        subtitle="Review and manage participant submissions"
        breadcrumbs={breadcrumbs}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon="pi-clock" count={stats.pending} label="Pending" bgColor="bg-amber-100" iconColor="text-amber-600" />
        <StatCard icon="pi-eye" count={stats.inReview} label="In Review" bgColor="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon="pi-exclamation-triangle" count={stats.needsMoreInfo} label="Needs More Info" bgColor="bg-orange-100" iconColor="text-orange-600" />
        <StatCard icon="pi-check-circle" count={stats.approvedToday} label="Approved Today" bgColor="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard icon="pi-times-circle" count={stats.rejectedToday} label="Rejected Today" bgColor="bg-red-100" iconColor="text-red-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Filter by status"
          className="w-48"
        />
        <Dropdown
          value={bountyFilter}
          options={bountyOptions}
          onChange={(e) => setBountyFilter(e.value)}
          placeholder="Filter by bounty"
          className="w-52"
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participant..."
            className="w-56"
          />
        </span>
      </div>

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-inbox"
          title="No submissions to review"
          message="All caught up! New submissions will appear here."
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <DataTable value={data.data} stripedRows aria-label="Submission review queue">
            <Column header="Participant" body={participantTemplate} />
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
    </>
  );
}
