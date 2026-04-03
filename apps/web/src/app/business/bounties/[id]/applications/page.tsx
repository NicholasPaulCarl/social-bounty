'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Avatar } from 'primereact/avatar';
import { useBounty } from '@/hooks/useBounties';
import { useApplications, useApproveApplication, useRejectApplication } from '@/hooks/useBountyAccess';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate } from '@/lib/utils/format';
import { BountyApplicationStatus } from '@social-bounty/shared';
import { ApiError } from '@/lib/api/client';
import type { BountyApplicationResponse } from '@social-bounty/shared';

export default function ApplicationsPage() {
  const { id: bountyId } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();

  const { data: bounty } = useBounty(bountyId);
  const { data: applicationsData, isLoading, error, refetch } = useApplications(bountyId);
  const approveMutation = useApproveApplication(bountyId);
  const rejectMutation = useRejectApplication(bountyId);

  const [confirmApprove, setConfirmApprove] = useState<BountyApplicationResponse | null>(null);
  const [confirmReject, setConfirmReject] = useState<BountyApplicationResponse | null>(null);

  const applications = applicationsData?.data ?? [];

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty?.title ?? 'Bounty', url: `/business/bounties/${bountyId}` },
    { label: 'Applications' },
  ];

  async function handleApprove() {
    if (!confirmApprove) return;
    try {
      await approveMutation.mutateAsync(confirmApprove.id);
      showSuccess(`Application from ${confirmApprove.userName} approved.`);
      setConfirmApprove(null);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Couldn\'t approve application. Try again.');
    }
  }

  async function handleReject(note?: string) {
    if (!confirmReject) return;
    try {
      await rejectMutation.mutateAsync({ appId: confirmReject.id, note });
      showSuccess(`Application from ${confirmReject.userName} rejected.`);
      setConfirmReject(null);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Couldn\'t reject application. Try again.');
    }
  }

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  // ─── Column renderers ──────────────────────────────────────────────────

  const hunterTemplate = (row: BountyApplicationResponse) => (
    <div className="flex items-center gap-3">
      <Avatar
        image={row.userProfilePicture ?? undefined}
        label={row.userName.charAt(0).toUpperCase()}
        shape="circle"
        size="normal"
        className="bg-accent-violet/20 text-accent-violet font-semibold"
      />
      <span className="text-sm font-medium text-text-primary">{row.userName}</span>
    </div>
  );

  const messageTemplate = (row: BountyApplicationResponse) => (
    <p className="text-sm text-text-secondary line-clamp-2 max-w-xs">
      {row.message ?? <span className="italic text-text-muted">No message provided</span>}
    </p>
  );

  const statusTemplate = (row: BountyApplicationResponse) => (
    <StatusBadge type={"application" as "bounty"} value={row.status} size="small" />
  );

  const dateTemplate = (row: BountyApplicationResponse) => (
    <span className="text-sm text-text-muted">{formatDate(row.appliedAt)}</span>
  );

  const actionsTemplate = (row: BountyApplicationResponse) => {
    if (row.status !== BountyApplicationStatus.PENDING) {
      return <span className="text-xs text-text-muted italic">No actions</span>;
    }
    return (
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-check"
          label="Approve"
          size="small"
          severity="success"
          outlined
          loading={approveMutation.isPending && confirmApprove?.id === row.id}
          onClick={() => setConfirmApprove(row)}
        />
        <Button
          icon="pi pi-times"
          label="Reject"
          size="small"
          severity="danger"
          outlined
          loading={rejectMutation.isPending && confirmReject?.id === row.id}
          onClick={() => setConfirmReject(row)}
        />
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Applications"
        breadcrumbs={breadcrumbs}
      />

      <div className="glass-card overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <i className="pi pi-inbox text-2xl text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium">No applications yet</p>
            <p className="text-text-muted text-sm mt-1">Applications will appear here once Hunters claim a spot.</p>
          </div>
        ) : (
          <DataTable
            value={applications}
            paginator={applications.length > 10}
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            className="p-datatable-neoglass"
            stripedRows
          >
            <Column
              header="Hunter"
              body={hunterTemplate}
              style={{ minWidth: '180px' }}
            />
            <Column
              header="Message"
              body={messageTemplate}
              style={{ minWidth: '200px' }}
            />
            <Column
              header="Status"
              body={statusTemplate}
              style={{ width: '130px' }}
            />
            <Column
              header="Applied"
              body={dateTemplate}
              style={{ width: '130px' }}
            />
            <Column
              header="Actions"
              body={actionsTemplate}
              style={{ width: '200px' }}
            />
          </DataTable>
        )}
      </div>

      {/* Approve confirmation */}
      <ConfirmAction
        visible={!!confirmApprove}
        onHide={() => setConfirmApprove(null)}
        title="Approve Application"
        message={`Approve the application from ${confirmApprove?.userName}? They will be able to submit proof for this bounty.`}
        confirmLabel="Approve"
        confirmSeverity="success"
        onConfirm={handleApprove}
        loading={approveMutation.isPending}
      />

      {/* Reject confirmation */}
      <ConfirmAction
        visible={!!confirmReject}
        onHide={() => setConfirmReject(null)}
        title="Reject Application"
        message={`Reject the application from ${confirmReject?.userName}? You can optionally provide a reason.`}
        confirmLabel="Reject"
        confirmSeverity="danger"
        onConfirm={handleReject}
        requireReason={false}
        loading={rejectMutation.isPending}
      />
    </>
  );
}
