'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useAdminOrgDetail, useUpdateOrgStatus } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { OrgStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default function AdminOrgDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: org, isLoading, error, refetch } = useAdminOrgDetail(id);
  const updateStatus = useUpdateOrgStatus(id);

  const [showSuspend, setShowSuspend] = useState(false);
  const [showActivate, setShowActivate] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!org) return null;

  const handleStatusChange = (status: OrgStatus, reason?: string) => {
    updateStatus.mutate(
      { status, reason: reason || '' },
      {
        onSuccess: () => {
          toast.showSuccess(`Organisation ${status === OrgStatus.ACTIVE ? 'activated' : 'suspended'}`);
          setShowSuspend(false);
          setShowActivate(false);
          refetch();
        },
        onError: () => toast.showError('Failed to update organisation status'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Organisations', url: '/admin/organisations' },
    { label: org.name || 'Organisation' },
  ];

  return (
    <>
      <PageHeader
        title={org.name || 'Organisation'}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            {org.status === 'ACTIVE' ? (
              <Button label="Suspend" icon="pi pi-ban" severity="danger" outlined onClick={() => setShowSuspend(true)} />
            ) : (
              <Button label="Activate" icon="pi pi-check" severity="success" outlined onClick={() => setShowActivate(true)} />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Organisation Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-neutral-500">Name</dt>
                <dd className="text-sm font-medium text-neutral-900">{org.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Contact Email</dt>
                <dd className="text-sm font-medium text-neutral-900">{org.contactEmail || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Status</dt>
                <dd><StatusBadge type="organisation" value={org.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Created</dt>
                <dd className="text-sm font-medium text-neutral-900">{formatDateTime(org.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Stats</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-neutral-500">Members</dt>
                <dd className="text-sm font-medium text-neutral-900">{org.memberCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Bounties</dt>
                <dd className="text-sm font-medium text-neutral-900">{org.bountyCount ?? 0}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmAction
        visible={showSuspend}
        onHide={() => setShowSuspend(false)}
        title="Suspend Organisation"
        message={`Are you sure you want to suspend "${org.name}"? All members will lose access and active bounties will be paused.`}
        confirmLabel="Suspend"
        confirmSeverity="danger"
        requireReason
        onConfirm={(reason) => handleStatusChange(OrgStatus.SUSPENDED, reason)}
        loading={updateStatus.isPending}
      />

      <ConfirmAction
        visible={showActivate}
        onHide={() => setShowActivate(false)}
        title="Activate Organisation"
        message={`Are you sure you want to reactivate "${org.name}"?`}
        confirmLabel="Activate"
        confirmSeverity="success"
        requireReason
        onConfirm={(reason) => handleStatusChange(OrgStatus.ACTIVE, reason)}
        loading={updateStatus.isPending}
      />
    </>
  );
}
