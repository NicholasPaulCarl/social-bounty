'use client';

import { useParams, useRouter } from 'next/navigation';
import { Image } from 'primereact/image';
import { useSubmission, useReviewSubmission, useUpdatePayout } from '@/hooks/useSubmissions';
import { useBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { SubmissionStatus, PayoutStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ReviewActionBar } from '@/components/features/submission/ReviewActionBar';
import { PayoutActionBar } from '@/components/features/submission/PayoutActionBar';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default function BusinessSubmissionReviewPage() {
  const router = useRouter();
  const params = useParams();
  const bountyId = params.id as string;
  const submissionId = params.submissionId as string;
  const toast = useToast();

  const { data: submission, isLoading, error, refetch } = useSubmission(submissionId);
  const { data: bounty } = useBounty(bountyId);
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
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty?.title || 'Bounty', url: `/business/bounties/${bountyId}` },
    { label: 'Submissions', url: `/business/bounties/${bountyId}/submissions` },
    { label: `Submission #${submissionId.slice(0, 8)}` },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Review Submission"
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-3">
            <StatusBadge type="submission" value={submission.status} size="large" />
            <StatusBadge type="payout" value={submission.payoutStatus} size="large" />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                          className="text-accent-cyan hover:underline"
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

          <ReviewActionBar
            currentStatus={submission.status}
            onAction={handleReview}
            loading={reviewSubmission.isPending}
          />

          {submission.status === SubmissionStatus.APPROVED && (
            <PayoutActionBar
              currentPayoutStatus={submission.payoutStatus}
              onAction={handlePayout}
              loading={updatePayout.isPending}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Hunter</dt>
                <dd className="text-sm font-medium text-text-primary">{submission.user ? `${submission.user.firstName} ${submission.user.lastName}` : 'Unknown'}</dd>
              </div>
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Submitted</dt>
                <dd className="text-sm font-medium text-text-primary">{formatDateTime(submission.createdAt)}</dd>
              </div>
              {submission.reviewedBy && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Reviewed By</dt>
                  <dd className="text-sm font-medium text-text-primary">{submission.reviewedBy.firstName} {submission.reviewedBy.lastName}</dd>
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

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Bounty Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Bounty</dt>
                <dd
                  className="text-sm font-medium text-accent-cyan hover:underline cursor-pointer"
                  onClick={() => router.push(`/business/bounties/${bountyId}`)}
                >
                  {bounty?.title || 'Loading...'}
                </dd>
              </div>
              {bounty && (
                <div>
                  <dt className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Created</dt>
                  <dd className="text-sm font-medium text-text-primary">{formatDate(bounty.createdAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
