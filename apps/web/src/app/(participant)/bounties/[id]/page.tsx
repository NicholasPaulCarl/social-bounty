'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Check,
  Clock,
  Download,
  File,
  Globe,
  Lock,
  Mail,
  Send,
  Upload,
  Wallet,
  X,
  XCircle,
  Undo2,
} from 'lucide-react';
import { useBounty } from '@/hooks/useBounties';
import { useAuth } from '@/hooks/useAuth';
import { useMyApplication, useWithdrawApplication, useMyInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useBountyAccess';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { VerificationReportPanel } from '@/components/features/submission/VerificationReportPanel';
import { derivePreviewChecks } from '@/lib/utils/bounty-preview-checks';
import { formatCurrency, formatDate, timeRemaining, formatEnumLabel, formatBytes } from '@/lib/utils/format';
import { PostVisibilityRule, BountyAccessType, BountyApplicationStatus, BountyInvitationStatus } from '@social-bounty/shared';
import { ApiError } from '@/lib/api/client';

// Local enum until shared package exports PayoutMethod
enum PayoutMethod {
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  E_WALLET = 'E_WALLET',
}

const PAYOUT_METHOD_CONFIG: Record<string, { label: string; Icon: LucideIcon; colorClass: string }> = {
  [PayoutMethod.PAYPAL]: {
    label: 'PayPal',
    Icon: Wallet,
    colorClass: 'bg-pink-600/15 text-pink-600 border-pink-600/30',
  },
  [PayoutMethod.BANK_TRANSFER]: {
    label: 'Bank transfer',
    Icon: Building2,
    colorClass: 'bg-pink-600/15 text-pink-600 border-pink-600/30',
  },
  [PayoutMethod.E_WALLET]: {
    label: 'E-wallet',
    Icon: Wallet,
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
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

// Channel colors — FB swapped to slate neutral (blue is reserved for gradient + .info per DS).
const CHANNEL_COLORS: Record<string, string> = {
  INSTAGRAM: 'bg-danger-600/15 text-danger-600 border-danger-600/30',
  FACEBOOK: 'bg-slate-100 text-slate-700 border-slate-200',
  TIKTOK: 'bg-pink-600/15 text-pink-600 border-pink-600/30',
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
          label="Submit proof"
          icon={<Upload size={16} strokeWidth={2} />}
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
            label="Submit proof"
            icon={<Upload size={16} strokeWidth={2} />}
            onClick={() => router.push(`/bounties/${id}/submit`)}
          />
        );
      }

      // Application states
      if (!myApplication && !myInvitation) {
        return (
          <Button
            label="Apply to hunt"
            icon={<Send size={16} strokeWidth={2} />}
            className="p-button-outlined"
            onClick={() => router.push(`/bounties/${id}/apply`)}
          />
        );
      }
      if (myApplication?.status === BountyApplicationStatus.APPROVED) {
        return (
          <Button
            label="Submit proof"
            icon={<Upload size={16} strokeWidth={2} />}
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
        <div className="glass-card border border-warning-600/40 bg-warning-600/5 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warning-600/20 flex items-center justify-center flex-shrink-0">
              <Mail size={16} strokeWidth={2} className="text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">You&apos;re invited</p>
              <p className="text-xs text-text-secondary mt-0.5">
                You have been personally invited to this bounty.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              label="Accept"
              icon={<Check size={14} strokeWidth={2} />}
              size="small"
              loading={acceptMutation.isPending}
              onClick={handleAcceptInvitation}
            />
            <Button
              label="Decline"
              icon={<X size={14} strokeWidth={2} />}
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
            <div className="glass-card border border-warning-600/40 bg-warning-600/5 p-4 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock size={20} strokeWidth={2} className="text-warning-600" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Application pending</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Under review — we&apos;ll let you know.
                  </p>
                </div>
              </div>
              <Button
                label="Withdraw"
                icon={<Undo2 size={14} strokeWidth={2} />}
                size="small"
                outlined
                severity="secondary"
                loading={withdrawMutation.isPending}
                onClick={handleWithdraw}
              />
            </div>
          )}

          {!appLoading && myApplication?.status === BountyApplicationStatus.REJECTED && (
            <div className="glass-card border border-danger-600/40 bg-danger-600/5 p-4 mb-4 flex items-center gap-3">
              <XCircle size={20} strokeWidth={2} className="text-danger-600" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Application not approved</p>
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
                    ? 'bg-success-600/10 text-success-600 border-success-600/30'
                    : 'bg-warning-600/10 text-warning-600 border-warning-600/30'
                }`}
              >
                {isPublic
                  ? <Globe size={12} strokeWidth={2} />
                  : <Lock size={12} strokeWidth={2} />}
                {isPublic ? 'Open' : 'Apply only'}
              </span>
            </div>

            <p className="text-text-secondary mb-6 leading-relaxed">{bounty.shortDescription}</p>

            <div className="h-px bg-glass-border my-6" />

            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Instructions</h3>
            <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">{bounty.fullInstructions}</div>

            <div className="h-px bg-glass-border my-6" />

            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Proof requirements</h3>
            <div className="text-text-secondary">
              {bounty.proofRequirements && (bounty.proofRequirements === 'url' || bounty.proofRequirements === 'screenshot' || bounty.proofRequirements === 'url,screenshot' || bounty.proofRequirements === 'screenshot,url') ? (
                <ul className="space-y-2">
                  {bounty.proofRequirements.split(',').map((req) => (
                    <li key={req} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-600 flex-shrink-0" />
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
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Required channels</h3>
              <div className="space-y-4">
                {channelKeys.map((ch) => (
                  <div key={ch} className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${CHANNEL_COLORS[ch] || 'bg-pink-600/15 text-pink-600 border-pink-600/30'}`}>
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
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Post visibility</h3>
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

          {/* Auto-verification preview — shows hunters what the scraper will check */}
          <VerificationReportPanel
            previewMode
            audience="hunter"
            previewChecks={derivePreviewChecks(bounty)}
          />
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
                    <div key={reward.id} className="flex justify-between items-center py-1.5 gap-3">
                      <div className="min-w-0">
                        <span className="text-sm text-text-primary">{reward.name}</span>
                        <span className="text-xs text-text-muted ml-2">({formatEnumLabel(reward.rewardType)})</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary font-mono tabular-nums">
                        {formatCurrency(reward.monetaryValue, bounty.currency)}
                      </span>
                    </div>
                  ))}
                  {bounty.totalRewardValue && (
                    <>
                      {/*
                        Per ADR 0013 §1, `bounty.totalRewardValue` is the
                        full escrowed pool (`per-claim × maxSubmissions`).
                        Hunters see the per-claim number first (it's what
                        they personally earn) and the total below as
                        secondary context — "this brand has committed
                        R{total} across {N} claims".
                      */}
                      {bounty.maxSubmissions != null && bounty.maxSubmissions > 1 && (
                        <div className="pt-3 border-t border-glass-border flex justify-between items-center gap-3">
                          <span className="eyebrow !text-text-muted">Per claim</span>
                          <span className="font-mono tabular-nums text-base font-medium text-text-secondary">
                            {formatCurrency(
                              bounty.rewards
                                .reduce((s, r) => s + parseFloat(r.monetaryValue), 0)
                                .toFixed(2),
                              bounty.currency,
                            )}
                          </span>
                        </div>
                      )}
                      <div
                        className={
                          bounty.maxSubmissions != null && bounty.maxSubmissions > 1
                            ? 'flex justify-between items-center gap-3'
                            : 'pt-3 border-t border-glass-border flex justify-between items-center gap-3'
                        }
                      >
                        <span className="eyebrow !text-text-muted">
                          {bounty.maxSubmissions != null && bounty.maxSubmissions > 1
                            ? `Total (${bounty.maxSubmissions} claims)`
                            : 'Total'}
                        </span>
                        <span className="metric !text-xl text-success-600">
                          {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {bounty.rewardValue && (
                    <div>
                      <p className="eyebrow !text-text-muted">Value</p>
                      <p className="metric !text-2xl text-success-600">{formatCurrency(bounty.rewardValue, bounty.currency)}</p>
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
            const MethodIcon = config.Icon;
            return (
              <div className="glass-card p-6">
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Payment method</h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.colorClass}`}>
                    <MethodIcon size={14} strokeWidth={2} />
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
                  <p className="eyebrow !text-text-muted !text-[11px]">Start date</p>
                  <p className="font-medium text-text-primary mt-0.5">{formatDate(bounty.startDate)}</p>
                </div>
              )}
              {bounty.endDate && (
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">End date</p>
                  <p className="font-medium text-text-primary mt-0.5">{formatDate(bounty.endDate)}</p>
                  <p className="text-xs text-warning-600 mt-0.5">{timeRemaining(bounty.endDate)}</p>
                </div>
              )}
              {bounty.maxSubmissions && (
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Submissions</p>
                  <p className="font-medium text-text-primary mt-0.5 font-mono tabular-nums">{bounty.submissionCount ?? 0} / {bounty.maxSubmissions}</p>
                </div>
              )}
              <div>
                <p className="eyebrow !text-text-muted !text-[11px]">AI content</p>
                <p className="font-medium text-text-primary mt-0.5">{bounty.aiContentPermitted ? 'Permitted' : 'Not permitted'}</p>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-600 flex-shrink-0" />
                    <p>Tag <span className="font-medium text-text-primary">{bounty.engagementRequirements.tagAccount}</span></p>
                  </div>
                )}
                {bounty.engagementRequirements.mention && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-600 flex-shrink-0" />
                    <p>Mention the brand in your post</p>
                  </div>
                )}
                {bounty.engagementRequirements.comment && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-600 flex-shrink-0" />
                    <p>Leave a comment on the post</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Assets */}
          {bounty.brandAssets && bounty.brandAssets.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Brand assets</h3>
              <div className="space-y-2">
                {bounty.brandAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2.5 border-b border-glass-border last:border-b-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shrink-0">
                        <File size={16} strokeWidth={2} className="text-text-muted" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{asset.fileName}</p>
                        <p className="text-xs text-text-muted font-mono tabular-nums">{formatBytes(asset.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      label="Download"
                      icon={<Download size={14} strokeWidth={2} />}
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
