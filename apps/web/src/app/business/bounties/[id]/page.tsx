'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { useBounty, useUpdateBountyStatus, useDeleteBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { BountyStatus, PostVisibilityRule, DurationUnit, PaymentStatus } from '@social-bounty/shared';
import { bountyApi } from '@/lib/api/bounties';
import { PaymentDialog } from '@/components/payment/PaymentDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatCurrency, formatEnumLabel, formatBytes } from '@/lib/utils/format';

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
  const [showDelete, setShowDelete] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleStatusChange = async (newStatus: string) => {
    // For DRAFT→LIVE, require payment first
    if (bounty.status === 'DRAFT' && newStatus === 'LIVE' && bounty.paymentStatus !== PaymentStatus.PAID) {
      setStatusAction(null);
      setPaymentLoading(true);
      try {
        const { clientSecret: secret } = await bountyApi.createPaymentIntent(id);
        setClientSecret(secret);
        setShowPayment(true);
      } catch {
        toast.showError('Failed to create payment. Please try again.');
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    updateStatus.mutate(newStatus as BountyStatus, {
      onSuccess: () => {
        toast.showSuccess(`Bounty status updated to ${formatEnumLabel(newStatus)}`);
        setStatusAction(null);
        refetch();
      },
      onError: () => toast.showError('Failed to update status'),
    });
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setClientSecret(null);
    // After successful payment, publish the bounty
    updateStatus.mutate(BountyStatus.LIVE, {
      onSuccess: () => {
        toast.showSuccess('Payment successful! Bounty is now live.');
        refetch();
      },
      onError: () => toast.showError('Payment succeeded but failed to update status. Please try again.'),
    });
  };

  const handleDelete = () => {
    deleteBounty.mutate(id, {
      onSuccess: () => {
        toast.showSuccess('Bounty deleted');
        router.push('/business/bounties');
      },
      onError: () => toast.showError('Failed to delete bounty'),
    });
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty.title },
  ];

  const statusButtons = () => {
    const actions: { label: string; status: string; severity: 'success' | 'warning' | 'danger' | 'secondary' }[] = [];
    switch (bounty.status) {
      case 'DRAFT':
        actions.push({ label: 'Go Live', status: 'LIVE', severity: 'success' });
        break;
      case 'LIVE':
        actions.push({ label: 'Pause', status: 'PAUSED', severity: 'warning' });
        actions.push({ label: 'Close', status: 'CLOSED', severity: 'danger' });
        break;
      case 'PAUSED':
        actions.push({ label: 'Resume', status: 'LIVE', severity: 'success' });
        actions.push({ label: 'Close', status: 'CLOSED', severity: 'danger' });
        break;
    }
    return actions;
  };

  const channels = bounty.channels || {};
  const channelKeys = Object.keys(channels);

  return (
    <>
      <PageHeader
        title={bounty.title}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            {statusButtons().map((action) => (
              <Button
                key={action.status}
                label={action.label}
                severity={action.severity}
                outlined
                loading={action.status === 'LIVE' && paymentLoading}
                onClick={() => setStatusAction(action.status)}
              />
            ))}
            <Button
              icon="pi pi-pencil"
              label="Edit"
              outlined
              severity="secondary"
              onClick={() => router.push(`/business/bounties/${id}/edit`)}
            />
            <Button
              icon="pi pi-list"
              label="Submissions"
              outlined
              onClick={() => router.push(`/business/bounties/${id}/submissions`)}
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={() => setShowDelete(true)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge type="bounty" value={bounty.status} size="large" />
                {bounty.totalRewardValue && (
                  <span className="text-lg font-semibold">
                    {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                  </span>
                )}
                {!bounty.totalRewardValue && bounty.rewardValue && (
                  <span className="text-lg font-semibold">{formatCurrency(bounty.rewardValue)}</span>
                )}
                <span className="text-sm text-neutral-500">{formatEnumLabel(bounty.rewardType)}</span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Description</h3>
                <p className="text-neutral-800 whitespace-pre-wrap">{bounty.shortDescription}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Full Instructions</h3>
                <p className="text-neutral-800 whitespace-pre-wrap">{bounty.fullInstructions}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Proof Requirements</h3>
                {bounty.proofRequirements && (bounty.proofRequirements === 'url' || bounty.proofRequirements === 'screenshot' || bounty.proofRequirements === 'url,screenshot' || bounty.proofRequirements === 'screenshot,url') ? (
                  <ul className="list-disc list-inside space-y-1 text-neutral-800">
                    {bounty.proofRequirements.split(',').map((req) => (
                      <li key={req}>
                        {req === 'url' ? 'Submit a URL link' : req === 'screenshot' ? 'Submit a screenshot' : req}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutral-800 whitespace-pre-wrap">{bounty.proofRequirements}</p>
                )}
              </div>

              {bounty.rewardDescription && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Reward Details</h3>
                  <p className="text-neutral-800">{bounty.rewardDescription}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Channels Card */}
          {channelKeys.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Channels</h3>
              <div className="space-y-3">
                {channelKeys.map((ch) => (
                  <div key={ch} className="flex items-center gap-3">
                    <Tag value={CHANNEL_LABELS[ch] || ch} severity="info" />
                    <div className="flex gap-2">
                      {(channels[ch as keyof typeof channels] || []).map((fmt: string) => (
                        <span key={fmt} className="text-sm text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          {FORMAT_LABELS[fmt] || fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Rewards Card */}
          {bounty.rewards && bounty.rewards.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Rewards</h3>
              <div className="space-y-2">
                {bounty.rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Tag value={formatEnumLabel(reward.rewardType)} severity="info" />
                      <span className="text-sm text-neutral-800">{reward.name}</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                      {formatCurrency(reward.monetaryValue, bounty.currency)}
                    </span>
                  </div>
                ))}
              </div>
              {bounty.totalRewardValue && (
                <div className="flex justify-end mt-3 pt-3 border-t border-neutral-200">
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 uppercase">Total</span>
                    <p className="text-lg font-bold text-neutral-900">
                      {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Eligibility Card */}
          {bounty.structuredEligibility && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Eligibility Rules</h3>
              <div className="space-y-2 text-sm text-neutral-700">
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
            </Card>
          )}

          {/* Payout Metrics Card */}
          {bounty.payoutMetrics && (bounty.payoutMetrics.minViews || bounty.payoutMetrics.minLikes || bounty.payoutMetrics.minComments) && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Payout Metrics</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                {bounty.payoutMetrics.minViews != null && (
                  <div className="flex items-center justify-between">
                    <span>Minimum Views</span>
                    <span className="font-medium text-neutral-900">{bounty.payoutMetrics.minViews.toLocaleString()}</span>
                  </div>
                )}
                {bounty.payoutMetrics.minLikes != null && (
                  <div className="flex items-center justify-between">
                    <span>Minimum Likes</span>
                    <span className="font-medium text-neutral-900">{bounty.payoutMetrics.minLikes.toLocaleString()}</span>
                  </div>
                )}
                {bounty.payoutMetrics.minComments != null && (
                  <div className="flex items-center justify-between">
                    <span>Minimum Comments</span>
                    <span className="font-medium text-neutral-900">{bounty.payoutMetrics.minComments.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Brand Assets Card */}
          {bounty.brandAssets && bounty.brandAssets.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Brand Assets</h3>
              <div className="space-y-2">
                {bounty.brandAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className={`pi ${asset.mimeType === 'application/pdf' ? 'pi-file-pdf' : 'pi-image'} text-neutral-500 text-sm`} />
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-800 truncate">{asset.fileName}</p>
                        <p className="text-xs text-neutral-500">{formatBytes(asset.fileSize)}</p>
                      </div>
                    </div>
                    <Button
                      icon="pi pi-download"
                      outlined
                      size="small"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/files/brand-assets/${asset.id}/download`, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-neutral-500">Created</dt>
                <dd className="text-sm font-medium text-neutral-900">{formatDate(bounty.createdAt)}</dd>
              </div>
              {bounty.endDate && (
                <div>
                  <dt className="text-sm text-neutral-500">Ends</dt>
                  <dd className="text-sm font-medium text-neutral-900">{formatDate(bounty.endDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-neutral-500">Max Submissions</dt>
                <dd className="text-sm font-medium text-neutral-900">
                  {bounty.maxSubmissions ?? 'Unlimited'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Total Submissions</dt>
                <dd className="text-sm font-medium text-neutral-900">{bounty.submissionCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Currency</dt>
                <dd className="text-sm font-medium text-neutral-900">{bounty.currency}</dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">AI Content</dt>
                <dd className="text-sm font-medium text-neutral-900">
                  {bounty.aiContentPermitted ? 'Permitted' : 'Not permitted'}
                </dd>
              </div>
              {bounty.paymentStatus && (
                <div>
                  <dt className="text-sm text-neutral-500">Payment Status</dt>
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
          </Card>

          {/* Post Visibility Card */}
          {bounty.postVisibility && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Post Visibility</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                {bounty.postVisibility.rule === PostVisibilityRule.MUST_NOT_REMOVE && (
                  <p>Post must never be removed</p>
                )}
                {bounty.postVisibility.rule === PostVisibilityRule.MINIMUM_DURATION && (
                  <p>
                    Post must remain visible for at least{' '}
                    {bounty.postVisibility.minDurationValue} {bounty.postVisibility.minDurationUnit?.toLowerCase()}
                  </p>
                )}
                <p className={bounty.visibilityAcknowledged ? 'text-success-600' : 'text-warning-600'}>
                  {bounty.visibilityAcknowledged ? 'Visibility acknowledged' : 'Visibility not yet acknowledged'}
                </p>
              </div>
            </Card>
          )}

          {/* Engagement Requirements Card */}
          {bounty.engagementRequirements && (
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Engagement</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                {bounty.engagementRequirements.tagAccount && (
                  <p>Tag: {bounty.engagementRequirements.tagAccount}</p>
                )}
                {bounty.engagementRequirements.mention && <p>Must mention brand</p>}
                {bounty.engagementRequirements.comment && <p>Must leave a comment</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {statusAction && (
        <ConfirmAction
          visible
          onHide={() => setStatusAction(null)}
          title={`Change Status to ${formatEnumLabel(statusAction)}`}
          message={`Are you sure you want to change this bounty's status to ${formatEnumLabel(statusAction)}?`}
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

      {clientSecret && (
        <PaymentDialog
          visible={showPayment}
          onHide={() => { setShowPayment(false); setClientSecret(null); }}
          clientSecret={clientSecret}
          amount={bounty.totalRewardValue ?? bounty.rewardValue ?? '0'}
          currency={bounty.currency}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
