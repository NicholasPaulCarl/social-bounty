'use client';

import { useRouter, useParams } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useBounty } from '@/hooks/useBounties';
import { useSubmissionsForBounty } from '@/hooks/useSubmissions';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import type { SubmissionReviewListItem } from '@social-bounty/shared';

export default function BountySubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const bountyId = params.id as string;
  const { page, limit, first, onPageChange } = usePagination();

  const { data: bounty } = useBounty(bountyId);
  const { data, isLoading, error, refetch } = useSubmissionsForBounty(bountyId, { page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty?.title || 'Bounty', url: `/business/bounties/${bountyId}` },
    { label: 'Submissions' },
  ];

  const statusTemplate = (rowData: SubmissionReviewListItem) => (
    <StatusBadge type="submission" value={rowData.status} />
  );

  const payoutTemplate = (rowData: SubmissionReviewListItem) => (
    <StatusBadge type="payout" value={rowData.payoutStatus} />
  );

  const dateTemplate = (rowData: SubmissionReviewListItem) => (
    <span>{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: SubmissionReviewListItem) => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => router.push(`/business/bounties/${bountyId}/submissions/${rowData.id}`)}
      tooltip="Review"
    />
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Submissions"
        subtitle={bounty ? `For: ${bounty.title}` : undefined}
        breadcrumbs={breadcrumbs}
      />

      {data && data.data.length > 0 ? (
        <>
          <div className="glass-card p-6">
            <DataTable value={data.data} stripedRows>
              <Column header="Participant" body={(rowData: SubmissionReviewListItem) => `${rowData.user.firstName} ${rowData.user.lastName}`} />
              <Column header="Status" body={statusTemplate} />
              <Column header="Payout" body={payoutTemplate} />
              <Column header="Submitted" body={dateTemplate} />
              <Column header="Actions" body={actionsTemplate} style={{ width: '6rem' }} />
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
        <EmptyState
          icon="pi-inbox"
          title="No submissions yet"
          message="No participants have submitted proof for this bounty yet."
        />
      )}
    </div>
  );
}
