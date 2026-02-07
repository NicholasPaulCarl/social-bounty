'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useBounty, useUpdateBountyStatus, useDeleteBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { BountyStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatCurrency, formatEnumLabel } from '@/lib/utils/format';

export default function BusinessBountyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: bounty, isLoading, error, refetch } = useBounty(id);
  const updateStatus = useUpdateBountyStatus(id);
  const deleteBounty = useDeleteBounty();
  const [showDelete, setShowDelete] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(newStatus as BountyStatus, {
      onSuccess: () => {
        toast.showSuccess(`Bounty status updated to ${formatEnumLabel(newStatus)}`);
        setStatusAction(null);
        refetch();
      },
      onError: () => toast.showError('Failed to update status'),
    });
  };

  const handleDelete = () => {
    deleteBounty.mutate(id, {
      onSuccess: () => {
        toast.showSuccess('Bounty deleted');
        router.push('/business/bounties');
      },
      onError: () => toast.showError('Failed to delete bounty'),
    });
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty.title },
  ];

  const statusButtons = () => {
    const actions: { label: string; status: string; severity: 'success' | 'warning' | 'danger' | 'secondary' }[] = [];
    switch (bounty.status) {
      case 'DRAFT':
        actions.push({ label: 'Go Live', status: 'LIVE', severity: 'success' });
        break;
      case 'LIVE':
        actions.push({ label: 'Pause', status: 'PAUSED', severity: 'warning' });
        actions.push({ label: 'Close', status: 'CLOSED', severity: 'danger' });
        break;
      case 'PAUSED':
        actions.push({ label: 'Resume', status: 'LIVE', severity: 'success' });
        actions.push({ label: 'Close', status: 'CLOSED', severity: 'danger' });
        break;
    }
    return actions;
  };

  return (
    <>
      <PageHeader
        title={bounty.title}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            {statusButtons().map((action) => (
              <Button
                key={action.status}
                label={action.label}
                severity={action.severity}
                outlined
                onClick={() => setStatusAction(action.status)}
              />
            ))}
            <Button
              icon="pi pi-pencil"
              label="Edit"
              outlined
              severity="secondary"
              onClick={() => router.push(`/business/bounties/${id}/edit`)}
            />
            <Button
              icon="pi pi-list"
              label="Submissions"
              outlined
              onClick={() => router.push(`/business/bounties/${id}/submissions`)}
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={() => setShowDelete(true)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge type="bounty" value={bounty.status} size="large" />
                <span className="text-lg font-semibold">{formatCurrency(bounty.rewardValue)}</span>
                <span className="text-sm text-neutral-500">{formatEnumLabel(bounty.rewardType)}</span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Description</h3>
                <p className="text-neutral-800 whitespace-pre-wrap">{bounty.shortDescription}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Full Instructions</h3>
                <p className="text-neutral-800 whitespace-pre-wrap">{bounty.fullInstructions}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Proof Requirements</h3>
                <p className="text-neutral-800 whitespace-pre-wrap">{bounty.proofRequirements}</p>
              </div>

              {bounty.rewardDescription && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Reward Details</h3>
                  <p className="text-neutral-800">{bounty.rewardDescription}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-neutral-500">Created</dt>
                <dd className="text-sm font-medium text-neutral-900">{formatDate(bounty.createdAt)}</dd>
              </div>
              {bounty.endDate && (
                <div>
                  <dt className="text-sm text-neutral-500">Ends</dt>
                  <dd className="text-sm font-medium text-neutral-900">{formatDate(bounty.endDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-neutral-500">Max Submissions</dt>
                <dd className="text-sm font-medium text-neutral-900">
                  {bounty.maxSubmissions ?? 'Unlimited'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Total Submissions</dt>
                <dd className="text-sm font-medium text-neutral-900">{bounty.submissionCount ?? 0}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {statusAction && (
        <ConfirmAction
          visible
          onHide={() => setStatusAction(null)}
          title={`Change Status to ${formatEnumLabel(statusAction)}`}
          message={`Are you sure you want to change this bounty's status to ${formatEnumLabel(statusAction)}?`}
          confirmLabel={`Yes, ${formatEnumLabel(statusAction)}`}
          confirmSeverity={statusAction === 'CLOSED' ? 'danger' : statusAction === 'PAUSED' ? 'warning' : 'success'}
          onConfirm={() => handleStatusChange(statusAction)}
          loading={updateStatus.isPending}
        />
      )}

      <ConfirmAction
        visible={showDelete}
        onHide={() => setShowDelete(false)}
        title="Delete Bounty"
        message="Are you sure you want to delete this bounty? This action cannot be undone."
        confirmLabel="Delete"
        confirmSeverity="danger"
        onConfirm={handleDelete}
        loading={deleteBounty.isPending}
      />
    </>
  );
}
