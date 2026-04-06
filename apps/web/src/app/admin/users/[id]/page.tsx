'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAdminUserDetail, useUpdateUserStatus, useForcePasswordReset, useAdminSubmissions, useAuditLogs } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { UserStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import type { AuditLogListItem } from '@social-bounty/shared';

function UserSubmissionsTab({ userId }: { userId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminSubmissions({ userId, limit: 20 });

  if (isLoading) return <LoadingState type="table" />;

  const submissions = data?.data ?? [];

  if (submissions.length === 0) {
    return <p className="text-sm text-on-surface-variant p-4">No submissions found for this user.</p>;
  }

  return (
    <DataTable value={submissions} stripedRows onRowClick={(e) => router.push(`/admin/submissions/${e.data.id}`)} className="cursor-pointer">
      <Column header="ID" body={(row: any) => <span className="font-mono text-xs">{row.id?.slice(0, 8)}</span>} style={{ width: '8rem' }} />
      <Column header="Bounty" body={(row: any) => row.bounty?.title || '-'} />
      <Column header="Status" body={(row: any) => <StatusBadge type="submission" value={row.status} />} />
      <Column header="Payout" body={(row: any) => <StatusBadge type="payout" value={row.payoutStatus} />} />
      <Column header="Submitted" body={(row: any) => formatDateTime(row.createdAt)} />
    </DataTable>
  );
}

function UserAuditTab({ userId }: { userId: string }) {
  const { data, isLoading } = useAuditLogs({ actorId: userId, limit: 20 });

  if (isLoading) return <LoadingState type="table" />;

  const logs: AuditLogListItem[] = data?.data ?? [];

  if (logs.length === 0) {
    return <p className="text-sm text-on-surface-variant p-4">No audit activity found for this user.</p>;
  }

  return (
    <DataTable value={logs} stripedRows>
      <Column field="action" header="Action" />
      <Column field="entityType" header="Entity Type" />
      <Column header="Entity ID" body={(row: AuditLogListItem) => <span className="font-mono text-xs">{row.entityId?.slice(0, 8)}</span>} />
      <Column header="Timestamp" body={(row: AuditLogListItem) => formatDateTime(row.createdAt)} />
    </DataTable>
  );
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);

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

      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="lg:col-span-2">
              <Card>
                <h3 className="text-lg font-heading font-semibold text-on-surface mb-4">User Information</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-on-surface-variant">Email</dt>
                    <dd className="text-sm font-medium text-on-surface">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-on-surface-variant">Name</dt>
                    <dd className="text-sm font-medium text-on-surface">
                      {`${user.firstName || '-'} ${user.lastName || ''}`.trim()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-on-surface-variant">Role</dt>
                    <dd><StatusBadge type="role" value={user.role} /></dd>
                  </div>
                  <div>
                    <dt className="text-sm text-on-surface-variant">Status</dt>
                    <dd><StatusBadge type="user" value={user.status} /></dd>
                  </div>
                  <div>
                    <dt className="text-sm text-on-surface-variant">Email Verified</dt>
                    <dd className="text-sm font-medium text-on-surface">{user.emailVerified ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-on-surface-variant">Created</dt>
                    <dd className="text-sm font-medium text-on-surface">{formatDateTime(user.createdAt)}</dd>
                  </div>
                </dl>
              </Card>
            </div>

            <div>
              <Card>
                <h3 className="text-lg font-heading font-semibold text-on-surface mb-4">Activity</h3>
                <dl className="space-y-3">
                  {user.organisation && (
                    <div>
                      <dt className="text-sm text-on-surface-variant">Organisation</dt>
                      <dd className="text-sm font-medium text-primary">{user.organisation.name}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-on-surface-variant">Submissions</dt>
                    <dd className="text-sm font-medium text-on-surface">{user.submissionCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-on-surface-variant">Approved Submissions</dt>
                    <dd className="text-sm font-medium text-on-surface">{user.approvedSubmissionCount ?? 0}</dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Submissions">
          <div className="mt-4">
            <UserSubmissionsTab userId={id} />
          </div>
        </TabPanel>

        <TabPanel header="Audit Activity">
          <div className="mt-4">
            <UserAuditTab userId={id} />
          </div>
        </TabPanel>
      </TabView>

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
