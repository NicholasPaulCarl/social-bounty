'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { useSubmission, useReviewSubmission, useUpdatePayout } from '@/hooks/useSubmissions';
import { useToast } from '@/hooks/useToast';
import { SubmissionStatus, PayoutStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ReviewActionBar } from '@/components/features/submission/ReviewActionBar';
import { PayoutActionBar } from '@/components/features/submission/PayoutActionBar';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils/format';
import type { ReviewHistoryEntry } from '@social-bounty/shared';

export default function ReviewCenterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;
  const toast = useToast();

  const { data: submission, isLoading, error, refetch } = useSubmission(submissionId);
  const reviewSubmission = useReviewSubmission(submissionId);
  const updatePayout = useUpdatePayout(submissionId);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!submission) return null;

  const handleReview = (action: SubmissionStatus, note?: string) => {
    reviewSubmission.mutate(
      { status: action, reviewerNote: note },
      {
        onSuccess: () => {
          toast.showSuccess(`Submission ${action.toLowerCase().replace('_', ' ')}`);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t review submission. Try again.'),
      },
    );
  };

  const handlePayout = (newStatus: PayoutStatus, note?: string) => {
    updatePayout.mutate(
      { payoutStatus: newStatus, note },
      {
        onSuccess: () => {
          toast.showSuccess(`Payout marked as ${newStatus.toLowerCase()}`);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t update payout. Try again.'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Review Center', url: '/business/review-center' },
    { label: `Submission #${submissionId.slice(0, 8)}` },
  ];

  // Extract review history from the submission if available
  const reviewHistory: ReviewHistoryEntry[] =
    (submission as unknown as { reviewHistory?: ReviewHistoryEntry[] }).reviewHistory ?? [];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Review Submission"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-3">
            <Button
              label="Back"
              icon="pi pi-arrow-left"
              outlined
              onClick={() => router.push('/business/review-center')}
            />
          </div>
        }
      />

      {/* Header info */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="font-mono text-sm text-text-muted">ID: {submissionId.slice(0, 8)}</span>
        <StatusBadge type="submission" value={submission.status} size="large" />
        <StatusBadge type="payout" value={submission.payoutStatus} size="large" />
        <span className="text-sm text-text-muted">
          Submitted {formatDateTime(submission.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - proof and actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proof of Completion */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Proof of Completion</h3>
            <div className="space-y-4">
              <div>
                <h4 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Text Proof</h4>
                <p className="text-text-primary whitespace-pre-wrap">{submission.proofText}</p>
              </div>

              {submission.proofLinks && submission.proofLinks.length > 0 && (
                <div>
                  <h4 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Links</h4>
                  <ul className="space-y-1">
                    {submission.proofLinks.map((link: string, i: number) => (
                      <li key={i}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submission.proofImages && submission.proofImages.length > 0 && (
                <div>
                  <h4 className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {submission.proofImages.map((img) => (
                      <Image
                        key={img.id}
                        src={img.fileUrl}
                        alt={img.fileName}
                        preview
                        width="200"
                        className="rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review Actions */}
          <ReviewActionBar
            currentStatus={submission.status}
            onAction={handleReview}
            loading={reviewSubmission.isPending}
          />

          {/* Payout Actions */}
          {submission.status === SubmissionStatus.APPROVED && (
            <PayoutActionBar
              currentPayoutStatus={submission.payoutStatus}
              onAction={handlePayout}
              loading={updatePayout.isPending}
            />
          )}

          {/* Review History Timeline */}
          {reviewHistory.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Review History</h3>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-glass-border" />
                {reviewHistory.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-glass-border border-2 border-bg-abyss" />
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge type="submission" value={entry.status} size="small" />
                      <span className="font-mono text-xs text-text-muted">
                        {formatDateTime(entry.changedAt)}
                      </span>
                      {entry.changedBy && (
                        <span className="text-xs text-text-muted">by {entry.changedBy}</span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-sm text-text-secondary mt-1">{entry.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - details */}
        <div className="space-y-6">
          {/* Participant Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Hunter</h3>
            <dl className="space-y-3">
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Name</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {submission.user ? `${submission.user.firstName} ${submission.user.lastName}` : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Email</dt>
                <dd className="text-sm font-medium text-text-primary">
                  {submission.user?.email ?? '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Bounty Context */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Bounty Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Title</dt>
                <dd
                  className="text-sm font-medium text-pink-600 hover:underline cursor-pointer"
                  onClick={() => router.push(`/business/bounties/${submission.bountyId}`)}
                >
                  {submission.bounty?.title ?? 'Loading...'}
                </dd>
              </div>
              {submission.bounty?.rewardValue && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Reward</dt>
                  <dd className="text-sm font-medium font-mono text-text-primary">
                    {formatCurrency(submission.bounty.rewardValue, submission.bounty.currency)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Submission Details */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Submitted</dt>
                <dd className="text-sm font-medium font-mono text-text-primary">
                  {formatDateTime(submission.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Last Updated</dt>
                <dd className="text-sm font-medium font-mono text-text-primary">
                  {formatDateTime(submission.updatedAt)}
                </dd>
              </div>
              {submission.reviewedBy && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Reviewed By</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {submission.reviewedBy.firstName} {submission.reviewedBy.lastName}
                  </dd>
                </div>
              )}
              {submission.reviewerNote && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Review Note</dt>
                  <dd className="text-sm text-text-secondary">{submission.reviewerNote}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
