'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { useBounty } from '@/hooks/useBounties';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatDate, timeRemaining, formatEnumLabel, formatBytes } from '@/lib/utils/format';
import { PostVisibilityRule } from '@social-bounty/shared';

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

export default function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: bounty, isLoading, error, refetch } = useBounty(id);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return <ErrorState error={new Error('Bounty not found')} />;

  const canSubmit =
    bounty.status === 'LIVE' &&
    user?.role === 'PARTICIPANT' &&
    (!bounty.maxSubmissions || (bounty.submissionCount ?? 0) < bounty.maxSubmissions);

  const breadcrumbs = [
    { label: 'Bounties', url: '/bounties' },
    { label: bounty.title },
  ];

  const channels = bounty.channels || {};
  const channelKeys = Object.keys(channels);

  return (
    <>
      <PageHeader
        title={bounty.title}
        breadcrumbs={breadcrumbs}
        actions={
          canSubmit ? (
            <Button
              label="Submit Proof"
              icon="pi pi-upload"
              onClick={() => router.push(`/bounties/${id}/submit`)}
            />
          ) : undefined
        }
      />

      {bounty.status === 'PAUSED' && (
        <Message severity="warn" text="This bounty is currently paused and not accepting submissions." className="w-full mb-4" />
      )}

      {bounty.status === 'CLOSED' && (
        <Message severity="info" text="This bounty is closed." className="w-full mb-4" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge type="bounty" value={bounty.status} />
            </div>

            <p className="text-on-surface mb-4">{bounty.shortDescription}</p>

            <Divider />

            <h3 className="text-lg font-semibold text-on-surface mb-2">Instructions</h3>
            <div className="text-on-surface whitespace-pre-wrap">{bounty.fullInstructions}</div>

            <Divider />

            <h3 className="text-lg font-semibold text-on-surface mb-2">Proof Requirements</h3>
            <div className="text-on-surface">
              {bounty.proofRequirements && (bounty.proofRequirements === 'url' || bounty.proofRequirements === 'screenshot' || bounty.proofRequirements === 'url,screenshot' || bounty.proofRequirements === 'screenshot,url') ? (
                <ul className="list-disc list-inside space-y-1">
                  {bounty.proofRequirements.split(',').map((req) => (
                    <li key={req}>
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
                <Divider />
                <h3 className="text-lg font-semibold text-on-surface mb-2">Eligibility</h3>
                <div className="text-on-surface whitespace-pre-wrap">{bounty.eligibilityRules}</div>
              </>
            )}
          </Card>

          {/* Channels */}
          {channelKeys.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-on-surface mb-4">Required Channels</h3>
              <div className="space-y-3">
                {channelKeys.map((ch) => (
                  <div key={ch} className="flex items-center gap-3">
                    <Tag value={CHANNEL_LABELS[ch] || ch} severity="info" />
                    <div className="flex gap-2">
                      {(channels[ch as keyof typeof channels] || []).map((fmt: string) => (
                        <span key={fmt} className="text-sm text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
                          {FORMAT_LABELS[fmt] || fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Post Visibility */}
          {bounty.postVisibility && (
            <Card>
              <h3 className="text-lg font-semibold text-on-surface mb-4">Post Visibility Requirements</h3>
              <div className="text-sm text-on-surface">
                {bounty.postVisibility.rule === PostVisibilityRule.MUST_NOT_REMOVE && (
                  <p>Your post must never be removed after submission.</p>
                )}
                {bounty.postVisibility.rule === PostVisibilityRule.MINIMUM_DURATION &&
                  bounty.postVisibility.minDurationValue != null &&
                  bounty.postVisibility.minDurationUnit && (
                  <p>
                    Your post must remain visible for at least{' '}
                    <span className="font-medium">
                      {bounty.postVisibility.minDurationValue} {bounty.postVisibility.minDurationUnit.toLowerCase()}
                    </span>
                    .
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-on-surface mb-4">Reward</h3>
            <div className="space-y-3">
              {bounty.rewards && bounty.rewards.length > 0 ? (
                <>
                  {bounty.rewards.map((reward) => (
                    <div key={reward.id} className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-sm text-on-surface">{reward.name}</span>
                        <span className="text-xs text-on-surface-variant ml-2">({formatEnumLabel(reward.rewardType)})</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(reward.monetaryValue, bounty.currency)}
                      </span>
                    </div>
                  ))}
                  {bounty.totalRewardValue && (
                    <div className="pt-2 border-t border-outline-variant flex justify-between">
                      <span className="text-sm font-semibold text-on-surface">Total</span>
                      <span className="text-lg font-bold text-success">
                        {formatCurrency(bounty.totalRewardValue, bounty.currency)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {bounty.rewardValue && (
                    <div>
                      <p className="text-sm text-on-surface-variant">Value</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(bounty.rewardValue, bounty.currency)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-on-surface-variant">Type</p>
                    <p className="font-medium">{formatEnumLabel(bounty.rewardType)}</p>
                  </div>
                  {bounty.rewardDescription && (
                    <div>
                      <p className="text-sm text-on-surface-variant">Description</p>
                      <p className="text-on-surface">{bounty.rewardDescription}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-on-surface mb-4">Details</h3>
            <div className="space-y-3">
              {bounty.startDate && (
                <div>
                  <p className="text-sm text-on-surface-variant">Start Date</p>
                  <p className="font-medium">{formatDate(bounty.startDate)}</p>
                </div>
              )}
              {bounty.endDate && (
                <div>
                  <p className="text-sm text-on-surface-variant">End Date</p>
                  <p className="font-medium">{formatDate(bounty.endDate)}</p>
                  <p className="text-xs text-on-surface-variant">{timeRemaining(bounty.endDate)}</p>
                </div>
              )}
              {bounty.maxSubmissions && (
                <div>
                  <p className="text-sm text-on-surface-variant">Submissions</p>
                  <p className="font-medium">{bounty.submissionCount ?? 0} / {bounty.maxSubmissions}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-on-surface-variant">AI Content</p>
                <p className="font-medium">{bounty.aiContentPermitted ? 'Permitted' : 'Not permitted'}</p>
              </div>
            </div>
          </Card>

          {/* Engagement Requirements */}
          {bounty.engagementRequirements && (
            bounty.engagementRequirements.tagAccount ||
            bounty.engagementRequirements.mention ||
            bounty.engagementRequirements.comment
          ) && (
            <Card>
              <h3 className="text-lg font-semibold text-on-surface mb-4">Engagement</h3>
              <div className="space-y-2 text-sm text-on-surface">
                {bounty.engagementRequirements.tagAccount && (
                  <p>Tag <span className="font-medium">{bounty.engagementRequirements.tagAccount}</span></p>
                )}
                {bounty.engagementRequirements.mention && <p>Mention the brand in your post</p>}
                {bounty.engagementRequirements.comment && <p>Leave a comment on the post</p>}
              </div>
            </Card>
          )}

          {/* Brand Assets */}
          {bounty.brandAssets && bounty.brandAssets.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-on-surface mb-4">Brand Assets</h3>
              <div className="space-y-2">
                {bounty.brandAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className={`pi ${asset.mimeType === 'application/pdf' ? 'pi-file-pdf' : 'pi-image'} text-on-surface-variant text-sm`} />
                      <div className="min-w-0">
                        <p className="text-sm text-on-surface truncate">{asset.fileName}</p>
                        <p className="text-xs text-on-surface-variant">{formatBytes(asset.fileSize)}</p>
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
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
