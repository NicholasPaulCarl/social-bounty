'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useAdminSubmissions } from '@/hooks/useAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import { Eye, Inbox } from 'lucide-react';

interface SubmissionListFilters {
  page?: number;
  limit?: number;
  status?: string;
  payoutStatus?: string;
  search?: string;
}

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Needs More Info', value: 'NEEDS_MORE_INFO' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const payoutStatusOptions = [
  { label: 'All Payout Statuses', value: '' },
  { label: 'Not Paid', value: 'NOT_PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
];

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<SubmissionListFilters>({ page, limit });

  const { data, isLoading, error, refetch } = useAdminSubmissions({ ...filters, page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const idTemplate = (rowData: any) => (
    <span className="font-mono text-xs">{rowData.id?.slice(0, 8)}...</span>
  );

  const bountyTemplate = (rowData: any) => (
    <span>{rowData.bounty?.title || '-'}</span>
  );

  const participantTemplate = (rowData: any) => (
    <span>
      {rowData.user ? `${rowData.user.firstName} ${rowData.user.lastName}` : '-'}
    </span>
  );

  const statusTemplate = (rowData: any) => (
    <StatusBadge type="submission" value={rowData.status} />
  );

  const payoutTemplate = (rowData: any) => (
    <StatusBadge type="payout" value={rowData.payoutStatus} />
  );

  const dateTemplate = (rowData: any) => (
    <span className="font-mono tabular-nums">{formatDateTime(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: any) => (
    <Button
      icon={<Eye size={18} strokeWidth={2} />}
      rounded
      text
      severity="secondary"
      onClick={() => router.push(`/admin/submissions/${rowData.id}`)}
      tooltip="View details"
    />
  );

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="View and manage all submissions"
        toolbar={{
          search: {
            value: filters.search || '',
            onChange: (value) => setFilters({ ...filters, search: value || undefined, page: 1 }),
            placeholder: 'Search submissions...',
          },
          filters: [
            { key: 'status', placeholder: 'Status', options: statusOptions, ariaLabel: 'Filter by status', className: 'w-full sm:w-48' },
            { key: 'payoutStatus', placeholder: 'Payout Status', options: payoutStatusOptions, ariaLabel: 'Filter by payout status', className: 'w-full sm:w-48' },
          ],
          filterValues: { status: filters.status || '', payoutStatus: filters.payoutStatus || '' },
          onFilterChange: (key, value) => setFilters({ ...filters, [key]: value || undefined, page: 1 }),
          onClearFilters: () => setFilters({ page: 1, limit }),
          hasActiveFilters: !!(filters.search || filters.status || filters.payoutStatus),
        }}
      />

      {data && data.data.length > 0 ? (
        <>
          <div className="glass-card overflow-x-auto">
          <DataTable value={data.data} stripedRows onRowClick={(e) => router.push(`/admin/submissions/${e.data.id}`)} className="cursor-pointer min-w-[600px]">
            <Column header="ID" body={idTemplate} style={{ width: '8rem' }} />
            <Column header="Bounty" body={bountyTemplate} />
            <Column header="Participant" body={participantTemplate} />
            <Column header="Status" body={statusTemplate} />
            <Column header="Submitted" body={dateTemplate} />
            <Column header="Payout" body={payoutTemplate} />
            <Column header="" body={actionsTemplate} style={{ width: '4rem' }} />
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
        <EmptyState Icon={Inbox} title="No submissions" message="Nothing matches your current filters." />
      )}
    </>
  );
}
