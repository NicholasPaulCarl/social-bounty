'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import { useMySubmissions } from '@/hooks/useSubmissions';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils/format';
import type { MySubmissionListItem, SubmissionStatus } from '@social-bounty/shared';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Needs More Info', value: 'NEEDS_MORE_INFO' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function MySubmissionsPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('');

  const { data, isLoading, error, refetch } = useMySubmissions({
    page,
    limit,
    status: statusFilter || undefined,
  });

  return (
    <>
      <PageHeader title="My Submissions" subtitle="Track your bounty submissions" />

      <div className="flex gap-3 mb-4">
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Filter by status"
          aria-label="Filter by status"
          className="w-48"
        />
      </div>

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-list"
          title="No submissions yet"
          message="Browse bounties and submit proof to get started."
          ctaLabel="Browse Bounties"
          ctaAction={() => router.push('/bounties')}
          ctaIcon="pi-search"
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <DataTable
            value={data.data}
            onRowClick={(e) => router.push(`/my-submissions/${(e.data as MySubmissionListItem).id}`)}
            rowClassName={() => 'cursor-pointer'}
            aria-label="My submissions table"
          >
            <Column field="bountyTitle" header="Bounty" />
            <Column
              field="status"
              header="Status"
              body={(row: MySubmissionListItem) => (
                <StatusBadge type="submission" value={row.status} size="small" />
              )}
            />
            <Column
              field="payoutStatus"
              header="Payout"
              body={(row: MySubmissionListItem) =>
                row.payoutStatus ? <StatusBadge type="payout" value={row.payoutStatus} size="small" /> : '-'
              }
            />
            <Column
              field="createdAt"
              header="Submitted"
              body={(row: MySubmissionListItem) => formatDate(row.createdAt)}
            />
            <Column
              field="updatedAt"
              header="Updated"
              body={(row: MySubmissionListItem) => formatDate(row.updatedAt)}
            />
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
