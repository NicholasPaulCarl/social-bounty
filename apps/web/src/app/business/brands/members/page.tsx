'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useBrandMembers, useInviteMember, useRemoveMember } from '@/hooks/useBrand';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate } from '@/lib/utils/format';
import type { BrandMemberResponse } from '@social-bounty/shared';

export default function BrandMembersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const brandId = user?.brandId || '';

  const { data, isLoading, error, refetch } = useBrandMembers(brandId);
  const inviteMember = useInviteMember(brandId);
  const removeMember = useRemoveMember(brandId);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Invite sent!');
          setShowInvite(false);
          setInviteEmail('');
          refetch();
        },
        onError: () => toast.showError('Couldn\'t invite member. Try again.'),
      },
    );
  };

  const handleRemove = () => {
    if (!removeUserId) return;
    removeMember.mutate(removeUserId, {
      onSuccess: () => {
        toast.showSuccess('Member removed from your team.');
        setRemoveUserId(null);
        refetch();
      },
      onError: () => toast.showError('Couldn\'t remove member. Try again.'),
    });
  };

  const roleTemplate = (rowData: BrandMemberResponse) => (
    <StatusBadge type="orgMemberRole" value={rowData.role} />
  );

  const dateTemplate = (rowData: BrandMemberResponse) => (
    <span>{formatDate(rowData.joinedAt)}</span>
  );

  const actionsTemplate = (rowData: BrandMemberResponse) => {
    if (rowData.role === 'OWNER') return null;
    return (
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => setRemoveUserId(rowData.userId)}
        tooltip="Remove Member"
      />
    );
  };

  const breadcrumbs = [
    { label: 'Brands', url: '/business/brands' },
    { label: 'Members' },
  ];

  const members = data?.data || [];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Brand Members"
        breadcrumbs={breadcrumbs}
        actions={
          <Button label="Invite Member" icon="pi pi-user-plus" onClick={() => setShowInvite(true)} />
        }
      />

      {members.length > 0 ? (
        <div className="glass-card p-6">
          <DataTable value={members} stripedRows>
            <Column header="Name" body={(rowData: BrandMemberResponse) => `${rowData.user.firstName} ${rowData.user.lastName}`} />
            <Column header="Email" body={(rowData: BrandMemberResponse) => rowData.user.email} />
            <Column header="Role" body={roleTemplate} />
            <Column header="Joined" body={dateTemplate} />
            <Column header="Actions" body={actionsTemplate} style={{ width: '6rem' }} />
          </DataTable>
        </div>
      ) : (
        <EmptyState
          icon="pi-users"
          title="No members"
          message="Invite team members to help manage bounties."
          ctaLabel="Invite Member"
          ctaAction={() => setShowInvite(true)}
        />
      )}

      <Dialog
        visible={showInvite}
        onHide={() => { setShowInvite(false); setInviteEmail(''); }}
        header="Invite Member"
        modal
        className="w-full max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button label="Cancel" outlined onClick={() => { setShowInvite(false); setInviteEmail(''); }} />
            <Button
              label="Send Invite"
              icon="pi pi-send"
              onClick={handleInvite}
              loading={inviteMember.isPending}
              disabled={!inviteEmail.trim()}
            />
          </div>
        }
      >
        <div>
          <label htmlFor="invite-email" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
            Email Address
          </label>
          <InputText
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full"
            placeholder="colleague@company.com"
          />
        </div>
      </Dialog>

      <ConfirmAction
        visible={!!removeUserId}
        onHide={() => setRemoveUserId(null)}
        title="Remove Member"
        message="Are you sure you want to remove this member from the brand?"
        confirmLabel="Remove"
        confirmSeverity="danger"
        onConfirm={handleRemove}
        loading={removeMember.isPending}
      />
    </div>
  );
}
