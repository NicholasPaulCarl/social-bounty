'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useBounty } from '@/hooks/useBounties';
import { useAuth } from '@/hooks/useAuth';
import { useMyApplication, useWithdrawApplication, useMyInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useBountyAccess';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatDate, timeRemaining, formatEnumLabel, formatBytes } from '@/lib/utils/format';
import { PostVisibilityRule, BountyAccessType, BountyApplicationStatus, BountyInvitationStatus } from '@social-bounty/shared';
import { ApiError } from '@/lib/api/client';

// Local enum until shared package exports PayoutMethod
enum PayoutMethod {
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  E_WALLET = 'E_WALLET',
}

const PAYOUT_METHOD_CONFIG: Record<string, { label: string; icon: string; colorClass: string }> = {
  [PayoutMethod.PAYPAL]: {
    label: 'PayPal',
    icon: 'pi-paypal',
    colorClass: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  },
  [PayoutMethod.BANK_TRANSFER]: {
    label: 'Bank Transfer',
    icon: 'pi-building',
    colorClass: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
  },
  [PayoutMethod.E_WALLET]: {
    label: 'E-Wallet',
    icon: 'pi-wallet',
    colorClass: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
  },
};

const CHANNEL_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
};

const FORMAT_LABELS: Record<string, string> = {
  STORY: 'Story',
  REEL: 'Reel',
  FEED_POST: 'Feed Post',
  VIDEO_POST: 'Video',
};

const CHANNEL_COLORS: Record<string, string> = {
  INSTAGRAM: 'bg-accent-rose/15 text-accent-rose border-accent-rose/30',
  FACEBOOK: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  TIKTOK: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
};

export default function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { data: bounty, isLoading, error, refetch } = useBounty(id);

  const isParticipant = user?.role === 'PARTICIPANT';

  const { data: myApplication, isLoading: appLoading } = useMyApplication(id);
  const { data: myInvitations = [] } = useMyInvitations();
  const withdrawMutation = useWithdrawApplication(id);
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const myInvitation = myInvitations.find((inv) => inv.bountyId === id);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return <ErrorState error={new Error('Bounty not found')} />;

  const isLive = bounty.status === 'LIVE';
  const isPublic = bounty.accessType === BountyAccessType.PUBLIC;
  const isClosed = bounty.accessType === BountyAccessType.CLOSED;

  const baseCanSubmit =
    isLive &&
    isParticipant &&
    (!bounty.maxSubmissions || (bounty.submissionCount ?? 0) < bounty.maxSubmissions);

  // Determine if access is granted for closed bounties
  const hasApprovedApplication = myApplication?.status === BountyApplicationStatus.APPROVED;
  const hasAcceptedInvitation = myInvitation?.status === BountyInvitationStatus.ACCEPTED;
  const closedAccessGranted = hasApprovedApplication || hasAcceptedInvitation;

  const canSubmit = baseCanSubmit && (isPublic || closedAccessGranted);

  const breadcrumbs = [
    { label: 'Bounties', url: '/bounties' },
    { label: bounty.title },
  ];

  const channels = bounty.channels || {};
  const channelKeys = Object.keys(channels);

  // ─── Access CTA for header ─────────────────────────────────────────────

  function renderAccessCTA() {
    if (!isParticipant || !isLive) return null;

    if (isPublic) {
      if (!canSubmit) return null;
      return (
        <Button
          label="Submit Proof"
          icon="pi pi-upload"
          onClick={() => router.push(`/bounties/${id}/submit`)}
        />
      );
    }

    // CLOSED bounty logic
    if (isClosed) {
      // Invitation is highest priority
      if (myInvitation?.status === BountyInvitationStatus.PENDING) {
        return null; // invitation banner shown inline below
      }
      if (myInvitation?.status === BountyInvitationStatus.ACCEPTED) {
        return (
          <Button
            label="Submit Proof"
            icon="pi pi-upload"
            onClick={() => router.push(`/bounties/${id}/submit`)}
          />
        );
      }

      // Application states
      if (!myApplication && !myInvitation) {
        return (
          <Button
            label="Apply to Hunt"
            icon="pi pi-send"
            className="p-button-outlined"
            onClick={() => router.push(`/bounties/${id}/apply`)}
          />
        );
      }
      if (myApplication?.status === BountyApplicationStatus.APPROVED) {
        return (
          <Button
            label="Submit Proof"
            icon="pi pi-upload"
            onClick={() => router.push(`/bounties/${id}/submit`)}
          />
        );
      }
    }

    return null;
  }

  async function handleWithdraw() {
    try {
      await withdrawMutation.mutateAsync();
      showSuccess('Application withdrawn. On to the next hunt.');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Couldn\'t withdraw application. Try again.');
    }
  }

  async function handleAcceptInvitation() {
    if (!myInvitation) return;
    try {
      await acceptMutation.mutateAsync(myInvitation.id);
      showSuccess('You\'re in! Time to drop your proof.');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Couldn\'t accept invitation. Try again.');
    }
  }

  async function handleDeclineInvitation() {
    if (!myInvitation) return;
    try {
      await declineMutation.mutateAsync(myInvitation.id);
      showSuccess('Invitation declined. No worries.');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Couldn\'t decline invitation. Try again.');
    }
  }

  return (
    <>
      <PageHeader
        title={bounty.title}
        breadcrumbs={breadcrumbs}
        actions={renderAccessCTA() ?? undefined}
      />

      {bounty.status === 'PAUSED' && (
        <Message severity="warn" text="This bounty is currently paused and not accepting submissions." className="w-full mb-4" />
      )}

      {bounty.status === 'CLOSED' && (
        <Message severity="info" text="This bounty is closed." className="w-full mb-4" />
      )}

      {/* Pending invitation banner */}
      {isParticipant && myInvitation?.status === BountyInvitationStatus.PENDING && (
        <div className="glass-card border border-accent-amber/40 bg-accent-amber/5 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-amber/20 flex items-center justify-center flex-shrink-0">
              <i className="pi pi-envelope text-accent-amber text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">You&apos;re Invited!</p>
              <p className="text-xs text-text-secondary mt-0.5">
                You have been personally invited to participate in this bounty.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              label="Accept"
              icon="pi pi-check"
              size="small"
              loading={acceptMutation.isPending}
              onClick={handleAcceptInvitation}
            />
            <Button
              label="Decline"
              icon="pi pi-times"
              size="small"
              outlined
              severity="secondary"
              loading={declineMutation.isPending}
              onClick={handleDeclineInvitation}
            />
          </div>
        </div>
      )}

      {/* Application status banners */}
      {isParticipant && isClosed && !myInvitation && isLive && (
        <>
          {!appLoading && myApplication?.status === BountyApplicationStatus.PENDING && (
            <div className="glass-card border border-accent-amber/40 bg-accent-amber/5 p-4 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <i className="pi pi-clock text-accent-amber" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Application Pending</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Your application is under review. You&apos;ll be notified of the outcome.
                  </p>
                </div>
              </div>
              <Button
                label="Withdraw"
                icon="pi pi-undo"
                size="small"
                outlined
                severity="secondary"
                loading={withdrawMutation.isPending}
                onClick={handleWithdraw}
              />
            </div>
          )}

          {!appLoading && myApplication?.status === BountyApplicationStatus.REJECTED && (
            <div className="glass-card border border-accent-rose/40 bg-accent-rose/5 p-4 mb-4 flex items-center gap-3">
              <i className="pi pi-times-circle text-accent-rose" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Application Not Approved</p>
                {myApplication.reviewNote && (
                  <p className="text-xs text-text-secondary mt-0.5">{myApplication.reviewNote}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        {/* Main content column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Overview section */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge type="bounty" value={bounty.status} />
              {/* Access type badge */}
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isPublic
                    ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30'
                    : 'bg-accent-amber/10 text-accent-amber border-accent-amber/30'
                }`}
              >
                <i className={`pi ${isPublic ? 'pi-globe' : 'pi-lock'} text-[10px]`} />
                {isPublic ? 'Open' : 'Apply Only'}
              </span>
            </div>

            <p className="text-text-secondary mb-6 leading-relaxed">{bounty.shortDescription}</p>

            <div className="h-px bg-glass-border my-6" />

            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Instructions</h3>
            <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">{bounty.fullInstructions}</div>

            <div className="h-px bg-glass-border my-6" />

            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Proof Requirements</h3>
            <div className="text-text-secondary">
              {bounty.proofRequirements && (bounty.proofRequirements === 'url' || bounty.proofRequirements === 'screenshot' || bounty.proofRequirements === 'url,screenshot' || bounty.proofRequirements === 'screenshot,url') ? (
                <ul className="space-y-2">
                  {bounty.proofRequirements.split(',').map((req) => (
                    <li key={req} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan flex-shrink-0" />
                      {req === 'url' ? 'Submit a URL link' : req === 'screenshot' ? 'Submit a screenshot' : req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="whitespace-pre-wrap">{bounty.proofRequirements}</p>
              )}
            </div>

            {bounty.eligibilityRules && (
              <>
                <div className="h-px bg-glass-border my-6" />
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Eligibility</h3>
                <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">{bounty.eligibilityRules}</div>
              </>
            )}
          </div>

          {/* Channels */}
          {channelKeys.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Required Channels</h3>
              <div className="space-y-4">
                {channelKeys.map((ch) => (
                  <div key={ch} className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${CHANNEL_COLORS[ch] || 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'}`}>
                      {CHANNEL_LABELS[ch] || ch}
                    </span>
                    <div className="flex gap-2">
                      {(channels[ch as keyof typeof channels] || []).map((fmt: string) => (
                        <span key={fmt} className="text-xs text-text-muted bg-white/5 border border-glass-border px-2.5 py-1 rounded-full">
                          {FORMAT_LABELS[fmt] || fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Visibility */}
          {bounty.postVisibility && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Post Visibility Requirements</h3>
              <div className="text-sm text-text-secondary">
                {bounty.postVisibility.rule === PostVisibilityRule.MUST_NOT_REMOVE && (
                  <p>Your post must never be removed after submission.</p>
                )}
                {bounty.postVisibility.rule === PostVisibilityRule.MINIMUM_DURATION &&
                  bounty.postVisibility.minDurationValue != null &&
                  bounty.postVisibility.minDurationUnit && (
                  <p>
                    Your post must remain visible for at least{' '}
                    <span className="font-medium text-text-primary">
                      {bounty.postVisibility.minDurationValue} {bounty.postVisibility.minDurationUnit.toLowerCase()}
                    </span>
                    .
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Reward card */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Reward</h3>
            <div className="space-y-3">
              {bounty.rewards && bounty.rewards.length > 0 ? (
                <>
                  {bounty.rewards.map((reward) => (
                    <div key={reward.id} className="flex justify-between items-center py-1.5">
                      <div>
                        <span className="text-sm text-text-primary">{reward.name}</span>
                        <span className="text-xs text-text-muted ml-2">({formatEnumLabel(reward.rewardType)})</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {formatCurrency(reward.monetaryValue, bounty.currency)}
                      </span>
                    </div>
                  ))}
                  {bounty.totalRewardValue && (
                    <div className="pt-3 border-t border-glass-border flex justify-between items-center">
                      <span className="text-sm font-semibold text-text-secondary">Total</span>
                      <span className="text-xl font-heading font-bold text-accent-emerald">
                        {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {bounty.rewardValue && (
                    <div>
                      <p className="text-sm text-text-muted mb-1">Value</p>
                      <p className="text-2xl font-heading font-bold text-accent-emerald">{formatCurrency(bounty.rewardValue, bounty.currency)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-text-muted mb-1">Type</p>
                    <p className="font-medium text-text-primary">{formatEnumLabel(bounty.rewardType)}</p>
                  </div>
                  {bounty.rewardDescription && (
                    <div>
                      <p className="text-sm text-text-muted mb-1">Description</p>
                      <p className="text-text-secondary">{bounty.rewardDescription}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment Method card */}
          {bounty.payoutMethod && PAYOUT_METHOD_CONFIG[bounty.payoutMethod] && (() => {
            const config = PAYOUT_METHOD_CONFIG[bounty.payoutMethod as string];
            return (
              <div className="glass-card p-6">
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Payment Method</h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.colorClass}`}>
                    <i className={`pi ${config.icon} text-sm`} />
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Details card */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Details</h3>
            <div className="space-y-4">
              {bounty.startDate && (
                <div>
                  <p className="text-sm text-text-muted mb-0.5">Start Date</p>
                  <p className="font-medium text-text-primary">{formatDate(bounty.startDate)}</p>
                </div>
              )}
              {bounty.endDate && (
                <div>
                  <p className="text-sm text-text-muted mb-0.5">End Date</p>
                  <p className="font-medium text-text-primary">{formatDate(bounty.endDate)}</p>
                  <p className="text-xs text-accent-amber mt-0.5">{timeRemaining(bounty.endDate)}</p>
                </div>
              )}
              {bounty.maxSubmissions && (
                <div>
                  <p className="text-sm text-text-muted mb-0.5">Submissions</p>
                  <p className="font-medium text-text-primary">{bounty.submissionCount ?? 0} / {bounty.maxSubmissions}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-text-muted mb-0.5">AI Content</p>
                <p className="font-medium text-text-primary">{bounty.aiContentPermitted ? 'Permitted' : 'Not permitted'}</p>
              </div>
            </div>
          </div>

          {/* Engagement Requirements */}
          {bounty.engagementRequirements && (
            bounty.engagementRequirements.tagAccount ||
            bounty.engagementRequirements.mention ||
            bounty.engagementRequirements.comment
          ) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Engagement</h3>
              <div className="space-y-3 text-sm text-text-secondary">
                {bounty.engagementRequirements.tagAccount && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet flex-shrink-0" />
                    <p>Tag <span className="font-medium text-text-primary">{bounty.engagementRequirements.tagAccount}</span></p>
                  </div>
                )}
                {bounty.engagementRequirements.mention && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet flex-shrink-0" />
                    <p>Mention the brand in your post</p>
                  </div>
                )}
                {bounty.engagementRequirements.comment && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet flex-shrink-0" />
                    <p>Leave a comment on the post</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Assets */}
          {bounty.brandAssets && bounty.brandAssets.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Brand Assets</h3>
              <div className="space-y-2">
                {bounty.brandAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2.5 border-b border-glass-border last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                        <i className={`pi ${asset.mimeType === 'application/pdf' ? 'pi-file-pdf' : 'pi-image'} text-text-muted text-sm`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{asset.fileName}</p>
                        <p className="text-xs text-text-muted">{formatBytes(asset.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      label="Download"
                      icon="pi pi-download"
                      outlined
                      size="small"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/files/brand-assets/${asset.id}/download`, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
