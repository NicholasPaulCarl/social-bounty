'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAdminOrgDetail, useUpdateOrgStatus, useAdminBounties, useAdminSubmissions } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { OrgStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/format';

function OrgBountiesTab({ orgId }: { orgId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminBounties({ organisationId: orgId, limit: 20 });

  if (isLoading) return <LoadingState type="table" />;

  const bounties = data?.data ?? [];

  if (bounties.length === 0) {
    return <p className="text-sm text-text-muted p-4">No bounties found for this organisation.</p>;
  }

  return (
    <DataTable value={bounties} stripedRows onRowClick={(e) => router.push(`/admin/bounties/${e.data.id}`)} className="cursor-pointer">
      <Column field="title" header="Title" />
      <Column header="Status" body={(row: any) => <StatusBadge type="bounty" value={row.status} />} />
      <Column header="Reward" body={(row: any) => formatCurrency(row.rewardValue, row.currency)} />
      <Column field="submissionCount" header="Submissions" />
      <Column header="Created" body={(row: any) => formatDate(row.createdAt)} />
    </DataTable>
  );
}

function OrgSubmissionsTab({ orgId }: { orgId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminSubmissions({ organisationId: orgId, limit: 20 });

  if (isLoading) return <LoadingState type="table" />;

  const submissions = data?.data ?? [];

  if (submissions.length === 0) {
    return <p className="text-sm text-text-muted p-4">No submissions found for this organisation.</p>;
  }

  return (
    <DataTable value={submissions} stripedRows onRowClick={(e) => router.push(`/admin/submissions/${e.data.id}`)} className="cursor-pointer">
      <Column header="ID" body={(row: any) => <span className="font-mono text-xs">{row.id?.slice(0, 8)}</span>} style={{ width: '8rem' }} />
      <Column header="Bounty" body={(row: any) => row.bounty?.title || '-'} />
      <Column header="Participant" body={(row: any) => row.user ? `${row.user.firstName} ${row.user.lastName}` : '-'} />
      <Column header="Status" body={(row: any) => <StatusBadge type="submission" value={row.status} />} />
      <Column header="Payout" body={(row: any) => <StatusBadge type="payout" value={row.payoutStatus} />} />
    </DataTable>
  );
}

export default function AdminOrgDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);

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
        onError: () => toast.showError('Couldn\'t update organisation status. Try again.'),
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

      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 animate-fade-up">
            <div className="lg:col-span-2">
              <div className="glass-card p-6">
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Organisation Information</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-text-muted">Name</dt>
                    <dd className="text-sm font-medium text-text-primary">{org.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-text-muted">Contact Email</dt>
                    <dd className="text-sm font-medium text-text-primary">{org.contactEmail || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-text-muted">Status</dt>
                    <dd><StatusBadge type="organisation" value={org.status} /></dd>
                  </div>
                  <div>
                    <dt className="text-sm text-text-muted">Created</dt>
                    <dd className="text-sm font-medium text-text-primary">{formatDateTime(org.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <div className="glass-card p-6">
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Stats</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-text-muted">Members</dt>
                    <dd className="text-sm font-medium text-text-primary">{org.memberCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-text-muted">Bounties</dt>
                    <dd className="text-sm font-medium text-text-primary">{org.bountyCount ?? 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Bounties">
          <div className="mt-4">
            <OrgBountiesTab orgId={id} />
          </div>
        </TabPanel>

        <TabPanel header="Submissions">
          <div className="mt-4">
            <OrgSubmissionsTab orgId={id} />
          </div>
        </TabPanel>
      </TabView>

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
