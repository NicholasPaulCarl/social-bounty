'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useBounty, useUpdateBountyStatus, useDeleteBounty } from '@/hooks/useBounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-checkout';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { BountyStatus, PostVisibilityRule, DurationUnit, PaymentStatus } from '@social-bounty/shared';
import { bountyApi } from '@/lib/api/bounties';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { VerificationReportPanel } from '@/components/features/submission/VerificationReportPanel';
import { derivePreviewChecks } from '@/lib/utils/bounty-preview-checks';
import { formatDate, formatCurrency, formatEnumLabel, formatBytes } from '@/lib/utils/format';
import { Eye, Pencil, List, Undo2, Trash2, Download, File as FileIcon, Image as ImageIcon } from 'lucide-react';

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

export default function BusinessBountyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: bounty, isLoading, error, refetch } = useBounty(id);
  const updateStatus = useUpdateBountyStatus(id);
  const deleteBounty = useDeleteBounty();
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleStatusChange = async (newStatus: string) => {
    // For DRAFT→LIVE, require payment first — route to TradeSafe hosted checkout.
    if (bounty.status === 'DRAFT' && newStatus === 'LIVE' && bounty.paymentStatus !== PaymentStatus.PAID) {
      setStatusAction(null);
      setPaymentLoading(true);
      try {
        const payerName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim().slice(0, 40) || 'Brand Admin';
        const { hostedUrl } = await bountyApi.fundBounty(id, {
          payerName,
          payerEmail: user?.email,
        });
        redirectToHostedCheckout(hostedUrl, id, {
          onDevNotice: (msg) => toast.showInfo(msg),
        });
        // paymentLoading cleared by the finally block below.
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Couldn\'t start funding. Try again.';
        toast.showError(message);
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    updateStatus.mutate(newStatus as BountyStatus, {
      onSuccess: () => {
        toast.showSuccess(`Bounty is now ${formatEnumLabel(newStatus)}.`);
        setStatusAction(null);
        refetch();
      },
      onError: () => toast.showError('Couldn\'t update status. Try again.'),
    });
  };

  const handleDelete = () => {
    deleteBounty.mutate(id, {
      onSuccess: () => {
        toast.showSuccess('Bounty removed.');
        router.push('/business/bounties');
      },
      onError: () => toast.showError('Couldn\'t delete bounty. Try again.'),
    });
  };

  const handleRefundRequest = async () => {
    setRefundLoading(true);
    try {
      await bountyApi.requestRefundBeforeApproval(
        id,
        'Brand-initiated refund request before any submission has been approved.',
      );
      toast.showSuccess('Refund requested. A Super Admin will review and approve.');
      setShowRefundConfirm(false);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Couldn\'t request refund. Try again.';
      toast.showError(message);
    } finally {
      setRefundLoading(false);
    }
  };

  const handlePreview = () => {
    // Open the hunter-facing bounty view in a new tab
    window.open(`/bounties/${id}?preview=1`, '_blank', 'noopener,noreferrer');
  };

  const statusButtons = () => {
    const actions: {
      label: string;
      status: string;
      severity?: 'success' | 'warning' | 'danger' | 'secondary';
      primary?: boolean;
    }[] = [];
    switch (bounty.status) {
      case 'DRAFT':
        // Primary CTA on the launch page
        actions.push({ label: 'Go Live', status: 'LIVE', primary: true });
        break;
      case 'LIVE':
        actions.push({ label: 'Pause', status: 'PAUSED', severity: 'warning' });
        actions.push({ label: 'Close', status: 'CLOSED', severity: 'danger' });
        break;
      case 'PAUSED':
        actions.push({ label: 'Resume', status: 'LIVE', severity: 'success' });
        actions.push({ label: 'Close', status: 'CLOSED', severity: 'danger' });
        actions.push({ label: 'Revert to Draft', status: 'DRAFT', severity: 'secondary' });
        break;
    }
    return actions;
  };

  const channels = bounty.channels || {};
  const channelKeys = Object.keys(channels);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={bounty.title}
        actions={
          <div className="flex gap-2">
            <Button
              icon={<Eye size={16} strokeWidth={2} />}
              label="Preview"
              outlined
              severity="secondary"
              onClick={handlePreview}
            />
            {statusButtons().map((action) => (
              <Button
                key={action.status}
                label={action.label}
                severity={action.severity}
                outlined={!action.primary}
                loading={action.status === 'LIVE' && paymentLoading}
                onClick={() => setStatusAction(action.status)}
              />
            ))}
            <Button
              icon={<Pencil size={16} strokeWidth={2} />}
              label="Edit"
              outlined
              severity="secondary"
              onClick={() => router.push(`/business/bounties/${id}/edit`)}
            />
            <Button
              icon={<List size={16} strokeWidth={2} />}
              label="Submissions"
              outlined
              onClick={() => router.push(`/business/bounties/${id}/submissions`)}
            />
            {bounty.paymentStatus === PaymentStatus.PAID && bounty.status !== 'CLOSED' && (
              <Button
                icon={<Undo2 size={16} strokeWidth={2} />}
                label="Request refund"
                outlined
                severity="warning"
                onClick={() => setShowRefundConfirm(true)}
              />
            )}
            {bounty.status === 'DRAFT' && (
              <Button
                icon={<Trash2 size={16} strokeWidth={2} />}
                severity="danger"
                outlined
                onClick={() => setShowDelete(true)}
              />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge type="bounty" value={bounty.status} size="large" />
                {bounty.totalRewardValue && (
                  <span className="font-mono tabular-nums text-lg font-semibold text-text-primary">
                    {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                  </span>
                )}
                {!bounty.totalRewardValue && bounty.rewardValue && (
                  <span className="font-mono tabular-nums text-lg font-semibold text-text-primary">{formatCurrency(bounty.rewardValue, bounty.currency)}</span>
                )}
                <span className="text-sm text-text-muted">{formatEnumLabel(bounty.rewardType)}</span>
              </div>

              <div>
                <h3 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Description</h3>
                <p className="text-text-primary whitespace-pre-wrap">{bounty.shortDescription}</p>
              </div>

              <div>
                <h3 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Full Instructions</h3>
                <p className="text-text-primary whitespace-pre-wrap">{bounty.fullInstructions}</p>
              </div>

              <div>
                <h3 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Proof Requirements</h3>
                {bounty.proofRequirements && (bounty.proofRequirements === 'url' || bounty.proofRequirements === 'screenshot' || bounty.proofRequirements === 'url,screenshot' || bounty.proofRequirements === 'screenshot,url') ? (
                  <ul className="list-disc list-inside space-y-1 text-text-primary">
                    {bounty.proofRequirements.split(',').map((req) => (
                      <li key={req}>
                        {req === 'url' ? 'Submit a URL link' : req === 'screenshot' ? 'Submit a screenshot' : req}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text-primary whitespace-pre-wrap">{bounty.proofRequirements}</p>
                )}
              </div>

              {bounty.rewardDescription && (
                <div>
                  <h3 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Reward Details</h3>
                  <p className="text-text-primary">{bounty.rewardDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Channels Card */}
          {channelKeys.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Channels</h3>
              <div className="space-y-3">
                {channelKeys.map((ch) => (
                  <div key={ch} className="flex items-center gap-3">
                    <Tag value={CHANNEL_LABELS[ch] || ch} severity="info" />
                    <div className="flex gap-2">
                      {(channels[ch as keyof typeof channels] || []).map((fmt: string) => (
                        <span key={fmt} className="text-sm text-text-secondary border border-glass-border px-2 py-0.5 rounded">
                          {FORMAT_LABELS[fmt] || fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards Card */}
          {bounty.rewards && bounty.rewards.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Rewards</h3>
              <div className="space-y-2">
                {bounty.rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between py-2 border-b border-glass-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Tag value={formatEnumLabel(reward.rewardType)} severity="info" />
                      <span className="text-sm text-text-primary">{reward.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-medium text-text-primary">
                      {formatCurrency(reward.monetaryValue, bounty.currency)}
                    </span>
                  </div>
                ))}
              </div>
              {bounty.totalRewardValue && (
                <div className="flex justify-end mt-3 pt-3 border-t border-glass-border">
                  <div className="text-right">
                    {/*
                      Per ADR 0013 §1, `bounty.totalRewardValue` is now
                      `sum(rewards) × maxSubmissions`. When a bounty
                      supports multiple claims, surface the breakdown so
                      brands aren't surprised by a "10×" multiplier on
                      the headline number. perClaim is derived from the
                      reward lines we just rendered above (single source
                      of truth — the API and this calculation must agree).
                    */}
                    {bounty.maxSubmissions != null && bounty.maxSubmissions > 1 && (
                      <p className="text-xs text-text-muted mb-1 font-mono tabular-nums">
                        {bounty.maxSubmissions} ×{' '}
                        {formatCurrency(
                          bounty.rewards
                            .reduce((s, r) => s + parseFloat(r.monetaryValue), 0)
                            .toFixed(2),
                          bounty.currency,
                        )}
                      </p>
                    )}
                    <span className="eyebrow">Total bounty value</span>
                    <p className="font-mono tabular-nums text-lg font-bold text-text-primary">
                      {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Eligibility Card */}
          {bounty.structuredEligibility && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Eligibility Rules</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                {bounty.structuredEligibility.minFollowers && (
                  <p>Minimum {bounty.structuredEligibility.minFollowers} followers</p>
                )}
                {bounty.structuredEligibility.publicProfile && <p>Public profile required</p>}
                {bounty.structuredEligibility.minAccountAgeDays && (
                  <p>Account must be at least {bounty.structuredEligibility.minAccountAgeDays} days old</p>
                )}
                {bounty.structuredEligibility.locationRestriction && (
                  <p>Location: {bounty.structuredEligibility.locationRestriction}</p>
                )}
                {bounty.structuredEligibility.noCompetingBrandDays && (
                  <p>No competing brand posts in last {bounty.structuredEligibility.noCompetingBrandDays} days</p>
                )}
                {bounty.structuredEligibility.customRules?.map((rule, i) => (
                  <p key={i}>{rule}</p>
                ))}
              </div>
            </div>
          )}

          {/* Payout Metrics Card */}
          {bounty.payoutMetrics && (bounty.payoutMetrics.minViews || bounty.payoutMetrics.minLikes || bounty.payoutMetrics.minComments) && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Payout Metrics</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                {bounty.payoutMetrics.minViews != null && (
                  <div className="flex items-center justify-between">
                    <span>Minimum Views</span>
                    <span className="font-medium text-text-primary">{bounty.payoutMetrics.minViews.toLocaleString()}</span>
                  </div>
                )}
                {bounty.payoutMetrics.minLikes != null && (
                  <div className="flex items-center justify-between">
                    <span>Minimum Likes</span>
                    <span className="font-medium text-text-primary">{bounty.payoutMetrics.minLikes.toLocaleString()}</span>
                  </div>
                )}
                {bounty.payoutMetrics.minComments != null && (
                  <div className="flex items-center justify-between">
                    <span>Minimum Comments</span>
                    <span className="font-medium text-text-primary">{bounty.payoutMetrics.minComments.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Assets Card */}
          {bounty.brandAssets && bounty.brandAssets.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Brand Assets</h3>
              <div className="space-y-2">
                {bounty.brandAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-glass-border last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {asset.mimeType === 'application/pdf' ? (
                        <FileIcon size={14} strokeWidth={2} className="text-text-muted" />
                      ) : (
                        <ImageIcon size={14} strokeWidth={2} className="text-text-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{asset.fileName}</p>
                        <p className="text-xs text-text-muted font-mono tabular-nums">{formatBytes(asset.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      icon={<Download size={14} strokeWidth={2} />}
                      outlined
                      size="small"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/files/brand-assets/${asset.id}/download`, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-verification preview — shows brands what the scraper will check */}
          <VerificationReportPanel
            previewMode
            audience="brand"
            previewChecks={derivePreviewChecks(bounty)}
          />
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Created</dt>
                <dd className="text-sm font-medium text-text-primary">{formatDate(bounty.createdAt)}</dd>
              </div>
              {bounty.endDate && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Ends</dt>
                  <dd className="text-sm font-medium text-text-primary">{formatDate(bounty.endDate)}</dd>
                </div>
              )}
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Max Submissions</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {bounty.maxSubmissions ?? 'Unlimited'}
                </dd>
              </div>
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Total Submissions</dt>
                <dd className="text-sm font-medium text-text-primary">{bounty.submissionCount ?? 0}</dd>
              </div>
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Currency</dt>
                <dd className="text-sm font-medium text-text-primary">{bounty.currency}</dd>
              </div>
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">AI Content</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {bounty.aiContentPermitted ? 'Permitted' : 'Not permitted'}
                </dd>
              </div>
              {bounty.paymentStatus && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Payment Status</dt>
                  <dd className="mt-1">
                    <Tag
                      value={formatEnumLabel(bounty.paymentStatus)}
                      severity={
                        bounty.paymentStatus === PaymentStatus.PAID ? 'success'
                          : bounty.paymentStatus === PaymentStatus.PENDING ? 'warning'
                          : bounty.paymentStatus === PaymentStatus.REFUNDED ? 'info'
                          : 'danger'
                      }
                    />
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Post Visibility Card */}
          {bounty.postVisibility && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Post Visibility</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                {bounty.postVisibility.rule === PostVisibilityRule.MUST_NOT_REMOVE && (
                  <p>Post must never be removed</p>
                )}
                {bounty.postVisibility.rule === PostVisibilityRule.MINIMUM_DURATION && (
                  <p>
                    Post must remain visible for at least{' '}
                    {bounty.postVisibility.minDurationValue} {bounty.postVisibility.minDurationUnit?.toLowerCase()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Engagement Requirements Card */}
          {bounty.engagementRequirements && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Engagement</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                {bounty.engagementRequirements.tagAccount && (
                  <p>Tag: {bounty.engagementRequirements.tagAccount}</p>
                )}
                {bounty.engagementRequirements.mention && <p>Must mention brand</p>}
                {bounty.engagementRequirements.comment && <p>Must leave a comment</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {statusAction && (
        <ConfirmAction
          visible
          onHide={() => setStatusAction(null)}
          title={`Change Status to ${formatEnumLabel(statusAction)}`}
          message={
            statusAction === 'CLOSED'
              ? 'Are you sure you want to close this bounty? This action cannot be undone.'
              : statusAction === 'DRAFT'
                ? 'This will revert the bounty to draft status. You can make full edits and republish later.'
                : `Are you sure you want to change this bounty's status to ${formatEnumLabel(statusAction)}?`
          }
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

      <ConfirmAction
        visible={showRefundConfirm}
        onHide={() => setShowRefundConfirm(false)}
        title="Request refund"
        message="This asks a Super Admin to refund the face value plus fees back to the original payment method. The bounty will be refunded only if no submission has been approved yet."
        confirmLabel="Request refund"
        confirmSeverity="warning"
        onConfirm={handleRefundRequest}
        loading={refundLoading}
      />

    </div>
  );
}
