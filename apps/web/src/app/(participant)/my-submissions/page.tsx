'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { useMySubmissions, useMyEarnings } from '@/hooks/useSubmissions';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { PayoutStatus } from '@social-bounty/shared';
import type { MySubmissionListItem, SubmissionStatus } from '@social-bounty/shared';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Needs More Info', value: 'NEEDS_MORE_INFO' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const payoutOptions = [
  { label: 'All Payouts', value: '' },
  { label: 'Not Paid', value: PayoutStatus.NOT_PAID },
  { label: 'Pending', value: PayoutStatus.PENDING },
  { label: 'Paid', value: PayoutStatus.PAID },
];

const sortOptions = [
  { label: 'Newest', value: 'desc' },
  { label: 'Oldest', value: 'asc' },
];

export default function MySubmissionsPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('');
  const [payoutFilter, setPayoutFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error, refetch } = useMySubmissions({
    page,
    limit,
    status: statusFilter || undefined,
    payoutStatus: payoutFilter || undefined,
    sortOrder,
  } as Parameters<typeof useMySubmissions>[0]);

  const { data: earnings } = useMyEarnings();

  return (
    <>
      <PageHeader title="My Submissions" subtitle="Track your bounty submissions" />

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
              <i className="pi pi-send text-accent-cyan" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-text-primary">{earnings?.totalSubmissions ?? 0}</p>
              <p className="text-sm text-text-muted">Total Submissions</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
              <i className="pi pi-check-circle text-accent-emerald" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-text-primary">{earnings?.approvedCount ?? 0}</p>
              <p className="text-sm text-text-muted">Approved</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
              <i className="pi pi-wallet text-accent-emerald" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-accent-emerald font-mono">{formatCurrency(earnings?.totalEarned ?? 0)}</p>
              <p className="text-sm text-text-muted">Total Earned</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
              <i className="pi pi-clock text-accent-cyan" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-accent-emerald font-mono">{formatCurrency(earnings?.pendingPayout ?? 0)}</p>
              <p className="text-sm text-text-muted">Pending Payout</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Filter by status"
          aria-label="Filter by status"
          className="w-48"
        />
        <Dropdown
          value={payoutFilter}
          options={payoutOptions}
          onChange={(e) => setPayoutFilter(e.value)}
          placeholder="Filter by payout"
          aria-label="Filter by payout status"
          className="w-44"
        />
        <SelectButton
          value={sortOrder}
          options={sortOptions}
          onChange={(e) => { if (e.value) setSortOrder(e.value); }}
          aria-label="Sort order"
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
