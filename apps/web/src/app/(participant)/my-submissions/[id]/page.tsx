'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Image } from 'primereact/image';
import { Divider } from 'primereact/divider';
import { useSubmission } from '@/hooks/useSubmissions';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/lib/utils/format';

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: submission, isLoading, error, refetch } = useSubmission(id);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!submission) return <ErrorState error={new Error('Submission not found')} />;

  const canUpdate = submission.status === 'NEEDS_MORE_INFO';

  const breadcrumbs = [
    { label: 'My Submissions', url: '/my-submissions' },
    { label: `Submission #${id.slice(0, 8)}` },
  ];

  return (
    <>
      <PageHeader
        title={`Submission for ${submission.bounty?.title || 'Bounty'}`}
        breadcrumbs={breadcrumbs}
        actions={
          canUpdate ? (
            <Button
              label="Update Submission"
              icon="pi pi-pencil"
              // Route to the per-format submit page — it detects existing
              // NEEDS_MORE_INFO submissions and switches into resubmit
              // mode (verified URLs read-only, only failed URLs editable).
              // The legacy /my-submissions/[id]/update route was removed
              // alongside the per-format flow rollout.
              onClick={() => router.push(`/bounties/${submission.bountyId}/submit`)}
            />
          ) : undefined
        }
      />

      {submission.status === 'NEEDS_MORE_INFO' && submission.reviewerNote && (
        <Message
          severity="warn"
          text={`Reviewer feedback: ${submission.reviewerNote}`}
          className="w-full mb-4"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge type="submission" value={submission.status} />
              {submission.payoutStatus && (
                <StatusBadge type="payout" value={submission.payoutStatus} />
              )}
            </div>

            <h3 className="text-lg font-semibold text-text-primary mb-2">Proof</h3>
            <div className="text-text-secondary whitespace-pre-wrap">{submission.proofText}</div>

            {submission.proofLinks && submission.proofLinks.length > 0 && (
              <>
                <Divider />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Links</h3>
                <ul className="space-y-1">
                  {submission.proofLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-600/80 text-sm"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {submission.proofImages && submission.proofImages.length > 0 && (
              <>
                <Divider />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Images</h3>
                <div className="glass-card rounded-lg overflow-hidden p-4">
                  <div className="flex flex-wrap gap-4">
                    {submission.proofImages.map((img, i) => (
                      <Image
                        key={img.id || i}
                        src={img.fileUrl}
                        alt={`Proof image ${i + 1} of ${submission.proofImages.length}`}
                        width="200"
                        preview
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <p className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Submitted</p>
                <p className="font-medium text-text-primary">{formatDate(submission.createdAt)}</p>
              </div>
              {submission.reviewedBy && (
                <div>
                  <p className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Reviewed By</p>
                  <p className="font-medium text-text-primary">{submission.reviewedBy.firstName} {submission.reviewedBy.lastName}</p>
                </div>
              )}
              <div>
                <p className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Last Updated</p>
                <p className="font-medium text-text-primary">{formatDate(submission.updatedAt)}</p>
              </div>
            </div>
          </div>

          {submission.reviewerNote && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Reviewer Note</h3>
              <p className="text-text-secondary">{submission.reviewerNote}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
