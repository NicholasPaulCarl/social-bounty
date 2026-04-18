'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate } from '@/lib/utils/format';
import { SocialPlatform, BountyInvitationStatus } from '@social-bounty/shared';
import { ApiError } from '@/lib/api/client';
import { bountyAccessApi } from '@/lib/api/bounty-access';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { BountyInvitationResponse } from '@social-bounty/shared';
import { AtSign, Send, Mail, Ban } from 'lucide-react';

const PLATFORM_OPTIONS = [
  { label: 'X (Twitter)', value: SocialPlatform.X, icon: 'pi-twitter' },
  { label: 'Instagram', value: SocialPlatform.INSTAGRAM, icon: 'pi-instagram' },
  { label: 'Facebook', value: SocialPlatform.FACEBOOK, icon: 'pi-facebook' },
  { label: 'TikTok', value: SocialPlatform.TIKTOK, icon: 'pi-mobile' },
];

const PLATFORM_COLORS: Record<string, string> = {
  [SocialPlatform.X]: 'bg-slate-100 text-slate-700 border-slate-200',
  [SocialPlatform.INSTAGRAM]: 'bg-danger-600/10 text-danger-600 border-danger-600/30',
  [SocialPlatform.FACEBOOK]: 'bg-slate-100 text-slate-700 border-slate-200',
  [SocialPlatform.TIKTOK]: 'bg-pink-600/10 text-pink-600 border-pink-600/30',
};

const PLATFORM_LABELS: Record<string, string> = {
  [SocialPlatform.X]: 'X',
  [SocialPlatform.INSTAGRAM]: 'Instagram',
  [SocialPlatform.FACEBOOK]: 'Facebook',
  [SocialPlatform.TIKTOK]: 'TikTok',
};

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  [BountyInvitationStatus.PENDING]: {
    className: 'bg-warning-600/10 text-warning-600 border-warning-600/30',
    label: 'Pending',
  },
  [BountyInvitationStatus.ACCEPTED]: {
    className: 'bg-success-600/10 text-success-600 border-success-600/30',
    label: 'Accepted',
  },
  [BountyInvitationStatus.DECLINED]: {
    className: 'bg-danger-600/10 text-danger-600 border-danger-600/30',
    label: 'Declined',
  },
  [BountyInvitationStatus.EXPIRED]: {
    className: 'bg-elevated text-text-muted border-glass-border',
    label: 'Expired',
  },
};

export default function InvitationsPage() {
  const { id: bountyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const { data: bounty } = useBounty(bountyId);

  const { data: invitations = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bountyAccess.invitations(bountyId),
    queryFn: () => bountyAccessApi.listInvitations(bountyId),
    enabled: !!bountyId,
  });

  const createInvitationsMutation = useMutation({
    mutationFn: (invs: Array<{ platform: SocialPlatform; handle: string }>) =>
      bountyAccessApi.createInvitations(bountyId, { invitations: invs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bountyAccess.invitations(bountyId) });
    },
  });

  const [platform, setPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [handle, setHandle] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<BountyInvitationResponse | null>(null);

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty?.title ?? 'Bounty', url: `/business/bounties/${bountyId}` },
    { label: 'Invitations' },
  ];

  async function handleAddInvitation() {
    setFormError('');
    const trimmed = handle.trim().replace(/^@/, '');
    if (!trimmed) {
      setFormError('Please enter a handle.');
      return;
    }

    try {
      await createInvitationsMutation.mutateAsync([{ platform, handle: trimmed }]);
      showSuccess(`Invitation sent to @${trimmed} on ${PLATFORM_LABELS[platform]}.`);
      setHandle('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Couldn\'t send invitation. Try again.';
      setFormError(msg);
      showError(msg);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInvitation();
    }
  }

  async function handleRevoke() {
    // No revoke endpoint in spec — just a UI affordance; show note
    showError('Revoke is not yet supported by the API.');
    setConfirmRevoke(null);
  }

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const pendingInvitations = invitations.filter((i) => i.status === BountyInvitationStatus.PENDING);
  const otherInvitations = invitations.filter((i) => i.status !== BountyInvitationStatus.PENDING);

  return (
    <>
      <PageHeader
        title="Invitations"
        breadcrumbs={breadcrumbs}
      />

      {/* Add invitation form */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-base font-heading font-semibold text-text-primary mb-4">Invite a Hunter</h2>
        <p className="text-sm text-text-secondary mb-5">
          Invite specific social media accounts to participate in this bounty. They&apos;ll receive a notification
          to accept or decline.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dropdown
            value={platform}
            options={PLATFORM_OPTIONS}
            onChange={(e) => setPlatform(e.value)}
            optionLabel="label"
            optionValue="value"
            className="w-full sm:w-48 flex-shrink-0"
            placeholder="Platform"
          />
          <div className="flex-1 flex gap-3">
            <span className="p-input-icon-left flex-1">
              <AtSign size={16} strokeWidth={2} />
              <InputText
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="username"
                className="w-full"
              />
            </span>
            <Button
              label="Send invite"
              icon={<Send size={16} strokeWidth={2} />}
              loading={createInvitationsMutation.isPending}
              onClick={handleAddInvitation}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {formError && (
          <Message severity="error" text={formError} className="w-full mt-3" />
        )}
      </div>

      {/* Invitations list */}
      <div className="glass-card overflow-hidden">
        {invitations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-text-muted flex items-center justify-center mx-auto mb-4">
              <Mail size={28} strokeWidth={2} />
            </div>
            <p className="text-text-secondary font-medium">No invitations sent yet</p>
            <p className="text-text-muted text-sm mt-1">Invite hunters using the form above.</p>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {/* Pending first */}
            {pendingInvitations.length > 0 && (
              <div>
                <div className="px-5 py-3 bg-white/2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Pending ({pendingInvitations.length})
                  </p>
                </div>
                {pendingInvitations.map((inv) => (
                  <InvitationRow
                    key={inv.id}
                    inv={inv}
                    onRevoke={() => setConfirmRevoke(inv)}
                  />
                ))}
              </div>
            )}

            {/* Others */}
            {otherInvitations.length > 0 && (
              <div>
                {pendingInvitations.length > 0 && (
                  <div className="px-5 py-3 bg-white/2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Responded ({otherInvitations.length})
                    </p>
                  </div>
                )}
                {otherInvitations.map((inv) => (
                  <InvitationRow
                    key={inv.id}
                    inv={inv}
                    onRevoke={undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmAction
        visible={!!confirmRevoke}
        onHide={() => setConfirmRevoke(null)}
        title="Revoke Invitation"
        message={`Revoke the invitation sent to @${confirmRevoke?.socialHandle} on ${confirmRevoke ? PLATFORM_LABELS[confirmRevoke.socialPlatform] : ''}?`}
        confirmLabel="Revoke"
        confirmSeverity="danger"
        onConfirm={handleRevoke}
      />
    </>
  );
}

// ─── Row component ──────────────────────────────────────────────────────────

function InvitationRow({
  inv,
  onRevoke,
}: {
  inv: BountyInvitationResponse;
  onRevoke?: () => void;
}) {
  const statusCfg = STATUS_CONFIG[inv.status] ?? { className: 'bg-elevated text-text-muted border-glass-border', label: inv.status };
  const platformColor = PLATFORM_COLORS[inv.socialPlatform] ?? 'bg-elevated text-text-muted border-glass-border';

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/2 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        {/* Platform badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${platformColor}`}>
          {PLATFORM_LABELS[inv.socialPlatform]}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            @{inv.socialHandle}
          </p>
          {inv.userName && (
            <p className="text-xs text-text-muted mt-0.5">Matched: {inv.userName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
        <span className="text-xs text-text-muted hidden sm:block">{formatDate(inv.invitedAt)}</span>
        {inv.status === BountyInvitationStatus.PENDING && onRevoke && (
          <Button
            icon={<Ban size={14} strokeWidth={2} />}
            size="small"
            text
            severity="danger"
            tooltip="Revoke"
            tooltipOptions={{ position: 'left' }}
            onClick={onRevoke}
          />
        )}
      </div>
    </div>
  );
}
