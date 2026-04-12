'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useAdminBountyDetail, useOverrideBountyStatus } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { BountyStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OverrideModal } from '@/components/common/OverrideModal';
import { formatDate, formatDateTime, formatCurrency, formatEnumLabel } from '@/lib/utils/format';

const bountyStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function AdminBountyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: bounty, isLoading, error, refetch } = useAdminBountyDetail(id);
  const overrideStatus = useOverrideBountyStatus(id);
  const [showOverride, setShowOverride] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleOverride = (newStatus: string, reason: string) => {
    overrideStatus.mutate(
      { status: newStatus as BountyStatus, reason },
      {
        onSuccess: () => {
          toast.showSuccess(`Bounty status overridden to ${formatEnumLabel(newStatus)}`);
          setShowOverride(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t override bounty status. Try again.'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/admin/bounties' },
    { label: bounty.title },
  ];

  return (
    <>
      <PageHeader
        title={bounty.title}
        breadcrumbs={breadcrumbs}
        actions={
          <Button label="Override Status" icon="pi pi-exclamation-triangle" severity="warning" onClick={() => setShowOverride(true)} />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge type="bounty" value={bounty.status} size="large" />
                <span className="text-lg font-semibold text-text-primary">{formatCurrency(bounty.rewardValue, bounty.currency)}</span>
                <span className="text-sm text-text-muted">{formatEnumLabel(bounty.rewardType)}</span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-1">Description</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{bounty.shortDescription}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-1">Full Instructions</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{bounty.fullInstructions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-text-muted">Organisation</dt>
                <dd className="text-sm font-medium text-text-primary">{bounty.brand?.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Created By</dt>
                <dd className="text-sm font-medium text-text-primary">{bounty.createdBy ? `${bounty.createdBy.firstName} ${bounty.createdBy.lastName}` : '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Created</dt>
                <dd className="text-sm font-medium text-text-primary">{formatDateTime(bounty.createdAt)}</dd>
              </div>
              {bounty.endDate && (
                <div>
                  <dt className="text-sm text-text-muted">Ends</dt>
                  <dd className="text-sm font-medium text-text-primary">{formatDate(bounty.endDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-text-muted">Total Submissions</dt>
                <dd className="text-sm font-medium text-text-primary">{bounty.submissionCount ?? 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <OverrideModal
        visible={showOverride}
        onHide={() => setShowOverride(false)}
        title="Override Bounty Status"
        entityType="bounty"
        currentStatus={bounty.status}
        statusOptions={bountyStatusOptions}
        onOverride={handleOverride}
        loading={overrideStatus.isPending}
      />
    </>
  );
}
