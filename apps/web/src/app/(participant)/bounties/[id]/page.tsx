'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { useBounty } from '@/hooks/useBounties';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatDate, timeRemaining } from '@/lib/utils/format';

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
              <span className="text-sm text-neutral-500">{bounty.category}</span>
            </div>

            <p className="text-neutral-700 mb-4">{bounty.shortDescription}</p>

            <Divider />

            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Instructions</h3>
            <div className="text-neutral-700 whitespace-pre-wrap">{bounty.fullInstructions}</div>

            <Divider />

            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Proof Requirements</h3>
            <div className="text-neutral-700 whitespace-pre-wrap">{bounty.proofRequirements}</div>

            {bounty.eligibilityRules && (
              <>
                <Divider />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Eligibility</h3>
                <div className="text-neutral-700 whitespace-pre-wrap">{bounty.eligibilityRules}</div>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reward</h3>
            <div className="space-y-3">
              {bounty.rewardValue && (
                <div>
                  <p className="text-sm text-neutral-500">Value</p>
                  <p className="text-2xl font-bold text-success-700">{formatCurrency(bounty.rewardValue)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-neutral-500">Type</p>
                <p className="font-medium">{bounty.rewardType}</p>
              </div>
              {bounty.rewardDescription && (
                <div>
                  <p className="text-sm text-neutral-500">Description</p>
                  <p className="text-neutral-700">{bounty.rewardDescription}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Details</h3>
            <div className="space-y-3">
              {bounty.startDate && (
                <div>
                  <p className="text-sm text-neutral-500">Start Date</p>
                  <p className="font-medium">{formatDate(bounty.startDate)}</p>
                </div>
              )}
              {bounty.endDate && (
                <div>
                  <p className="text-sm text-neutral-500">End Date</p>
                  <p className="font-medium">{formatDate(bounty.endDate)}</p>
                  <p className="text-xs text-neutral-500">{timeRemaining(bounty.endDate)}</p>
                </div>
              )}
              {bounty.maxSubmissions && (
                <div>
                  <p className="text-sm text-neutral-500">Submissions</p>
                  <p className="font-medium">{bounty.submissionCount ?? 0} / {bounty.maxSubmissions}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
