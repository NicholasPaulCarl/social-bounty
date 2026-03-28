'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { useMyDisputes } from '@/hooks/useDisputes';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatEnumLabel } from '@/lib/utils/format';
import { DisputeStatus } from '@social-bounty/shared';
import type { DisputeListItem } from '@social-bounty/shared';

const statusFilters: { label: string; value: DisputeStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: DisputeStatus.DRAFT },
  { label: 'Open', value: DisputeStatus.OPEN },
  { label: 'Under Review', value: DisputeStatus.UNDER_REVIEW },
  { label: 'Awaiting Response', value: DisputeStatus.AWAITING_RESPONSE },
  { label: 'Escalated', value: DisputeStatus.ESCALATED },
  { label: 'Resolved', value: DisputeStatus.RESOLVED },
  { label: 'Closed', value: DisputeStatus.CLOSED },
  { label: 'Withdrawn', value: DisputeStatus.WITHDRAWN },
];

export default function MyDisputesPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | ''>('');

  const { data, isLoading, error, refetch } = useMyDisputes({
    page,
    limit,
    status: statusFilter || undefined,
    sortOrder: 'desc',
  });

  return (
    <>
      <PageHeader
        title="My Disputes"
        subtitle="Track and manage your filed disputes"
        actions={
          <Button
            label="File a Dispute"
            icon="pi pi-plus"
            className="bg-accent-cyan border-accent-cyan text-background hover:bg-accent-cyan/90"
            onClick={() => router.push('/my-disputes/new')}
          />
        }
      />

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
              statusFilter === f.value
                ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50'
                : 'bg-elevated text-text-muted border-glass-border hover:border-accent-cyan/30 hover:text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState type="table" rows={8} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-flag"
          title="You have no disputes"
          message="If you have an issue with a submission or payment, you can file a dispute."
          ctaLabel="File a Dispute"
          ctaAction={() => router.push('/my-disputes/new')}
          ctaIcon="pi-plus"
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="animate-fade-up">
            <DataTable
              value={data.data}
              onRowClick={(e) => router.push(`/my-disputes/${(e.data as DisputeListItem).id}`)}
              rowClassName={() => 'cursor-pointer'}
              aria-label="My disputes table"
              className="glass-card"
            >
              <Column
                field="disputeNumber"
                header="Dispute #"
                body={(row: DisputeListItem) => (
                  <span className="font-mono text-accent-cyan text-sm">{row.disputeNumber}</span>
                )}
              />
              <Column
                field="bountyTitle"
                header="Bounty"
                body={(row: DisputeListItem) => (
                  <span className="text-text-primary">{row.bountyTitle}</span>
                )}
              />
              <Column
                field="category"
                header="Category"
                body={(row: DisputeListItem) => (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                    {formatEnumLabel(row.category)}
                  </span>
                )}
              />
              <Column
                field="status"
                header="Status"
                body={(row: DisputeListItem) => (
                  <StatusBadge type="dispute" value={row.status} size="small" />
                )}
              />
              <Column
                field="createdAt"
                header="Filed"
                body={(row: DisputeListItem) => (
                  <span className="text-text-muted text-sm">{formatDate(row.createdAt)}</span>
                )}
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
