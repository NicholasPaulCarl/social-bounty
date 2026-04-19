'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { SelectButton } from 'primereact/selectbutton';
import { CheckCircle2, Clock, Send, Wallet, List, Search } from 'lucide-react';
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

  const hasActiveFilters = !!(statusFilter || payoutFilter || sortOrder !== 'desc');

  return (
    <>
      <PageHeader
        title="My submissions"
        subtitle="Track your bounty submissions"
        toolbar={{
          filters: [
            { key: 'status', placeholder: 'Filter by status', options: statusOptions, ariaLabel: 'Filter by status', className: 'w-full sm:w-48' },
            { key: 'payoutStatus', placeholder: 'Filter by payout', options: payoutOptions, ariaLabel: 'Filter by payout status', className: 'w-full sm:w-44' },
          ],
          filterValues: { status: statusFilter, payoutStatus: payoutFilter },
          onFilterChange: (key, value) => {
            if (key === 'status') setStatusFilter(value as SubmissionStatus | '');
            else if (key === 'payoutStatus') setPayoutFilter(value);
          },
          onClearFilters: () => { setStatusFilter(''); setPayoutFilter(''); setSortOrder('desc'); },
          hasActiveFilters,
          extra: (
            <SelectButton
              value={sortOrder}
              options={sortOptions}
              onChange={(e) => { if (e.value) setSortOrder(e.value); }}
              aria-label="Sort order"
            />
          ),
        }}
      />

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 animate-fade-up">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <Send size={20} strokeWidth={2} className="text-pink-600" />
            </div>
            <div>
              <p className="metric !text-2xl text-text-primary">{earnings?.totalSubmissions ?? 0}</p>
              <p className="eyebrow !text-text-muted">Submissions</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} strokeWidth={2} className="text-success-600" />
            </div>
            <div>
              <p className="metric !text-2xl text-text-primary">{earnings?.approvedCount ?? 0}</p>
              <p className="eyebrow !text-text-muted">Approved</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <Wallet size={20} strokeWidth={2} className="text-success-600" />
            </div>
            <div>
              <p className="metric !text-2xl text-success-600">{formatCurrency(earnings?.totalEarned ?? 0)}</p>
              <p className="eyebrow !text-text-muted">Total earned</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
              <Clock size={20} strokeWidth={2} className="text-pink-600" />
            </div>
            <div>
              <p className="metric !text-2xl text-success-600">{formatCurrency(earnings?.pendingPayout ?? 0)}</p>
              <p className="eyebrow !text-text-muted">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          Icon={List}
          title="No submissions yet"
          message="Hunt a bounty, drop your proof, claim the reward."
          ctaLabel="Browse bounties"
          ctaAction={() => router.push('/bounties')}
          CtaIcon={Search}
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="glass-card overflow-x-auto">
          <DataTable
            value={data.data}
            onRowClick={(e) => router.push(`/my-submissions/${(e.data as MySubmissionListItem).id}`)}
            rowClassName={() => 'cursor-pointer'}
            aria-label="My submissions table"
            scrollable
            className="min-w-[700px]"
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
          </div>

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
