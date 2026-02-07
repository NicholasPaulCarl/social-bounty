'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useAdminUserDetail, useUpdateUserStatus, useForcePasswordReset } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { UserStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: user, isLoading, error, refetch } = useAdminUserDetail(id);
  const updateStatus = useUpdateUserStatus(id);
  const forceReset = useForcePasswordReset(id);

  const [showSuspend, setShowSuspend] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [showForceReset, setShowForceReset] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!user) return null;

  const handleStatusChange = (status: UserStatus, reason?: string) => {
    updateStatus.mutate(
      { status, reason: reason || '' },
      {
        onSuccess: () => {
          toast.showSuccess(`User ${status === UserStatus.ACTIVE ? 'activated' : 'suspended'}`);
          setShowSuspend(false);
          setShowActivate(false);
          refetch();
        },
        onError: () => toast.showError('Failed to update user status'),
      },
    );
  };

  const handleForceReset = () => {
    forceReset.mutate(
      { reason: 'Admin-initiated password reset' },
      {
        onSuccess: () => {
          toast.showSuccess('Password reset initiated');
          setShowForceReset(false);
        },
        onError: () => toast.showError('Failed to reset password'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Users', url: '/admin/users' },
    { label: user.email },
  ];

  return (
    <>
      <PageHeader
        title={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            {user.status === 'ACTIVE' ? (
              <Button label="Suspend" icon="pi pi-ban" severity="danger" outlined onClick={() => setShowSuspend(true)} />
            ) : (
              <Button label="Activate" icon="pi pi-check" severity="success" outlined onClick={() => setShowActivate(true)} />
            )}
            <Button label="Force Password Reset" icon="pi pi-lock" severity="warning" outlined onClick={() => setShowForceReset(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">User Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-neutral-500">Email</dt>
                <dd className="text-sm font-medium text-neutral-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Name</dt>
                <dd className="text-sm font-medium text-neutral-900">
                  {`${user.firstName || '-'} ${user.lastName || ''}`.trim()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Role</dt>
                <dd><StatusBadge type="role" value={user.role} /></dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Status</dt>
                <dd><StatusBadge type="user" value={user.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Email Verified</dt>
                <dd className="text-sm font-medium text-neutral-900">{user.emailVerified ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Created</dt>
                <dd className="text-sm font-medium text-neutral-900">{formatDateTime(user.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Activity</h3>
            <dl className="space-y-3">
              {user.organisation && (
                <div>
                  <dt className="text-sm text-neutral-500">Organisation</dt>
                  <dd className="text-sm font-medium text-primary-600">{user.organisation.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-neutral-500">Submissions</dt>
                <dd className="text-sm font-medium text-neutral-900">{user.submissionCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Approved Submissions</dt>
                <dd className="text-sm font-medium text-neutral-900">{user.approvedSubmissionCount ?? 0}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <ConfirmAction
        visible={showSuspend}
        onHide={() => setShowSuspend(false)}
        title="Suspend User"
        message={`Are you sure you want to suspend ${user.email}? They will lose access to the platform.`}
        confirmLabel="Suspend"
        confirmSeverity="danger"
        requireReason
        onConfirm={(reason) => handleStatusChange(UserStatus.SUSPENDED, reason)}
        loading={updateStatus.isPending}
      />

      <ConfirmAction
        visible={showActivate}
        onHide={() => setShowActivate(false)}
        title="Activate User"
        message={`Are you sure you want to reactivate ${user.email}?`}
        confirmLabel="Activate"
        confirmSeverity="success"
        requireReason
        onConfirm={(reason) => handleStatusChange(UserStatus.ACTIVE, reason)}
        loading={updateStatus.isPending}
      />

      <ConfirmAction
        visible={showForceReset}
        onHide={() => setShowForceReset(false)}
        title="Force Password Reset"
        message={`This will send a password reset email to ${user.email} and invalidate their current sessions.`}
        confirmLabel="Reset Password"
        confirmSeverity="warning"
        onConfirm={handleForceReset}
        loading={forceReset.isPending}
      />
    </>
  );
}
