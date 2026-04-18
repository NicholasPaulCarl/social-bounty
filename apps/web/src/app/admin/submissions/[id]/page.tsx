'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { useAdminSubmissionDetail, useOverrideSubmissionStatus, useOverridePayoutStatus } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { SubmissionStatus } from '@social-bounty/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OverrideModal } from '@/components/common/OverrideModal';
import { formatDateTime, formatEnumLabel } from '@/lib/utils/format';

const submissionStatusOptions = [
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Needs More Info', value: 'NEEDS_MORE_INFO' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const payoutStatusOptions = [
  { label: 'Not Paid', value: 'NOT_PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
];

export default function AdminSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: submission, isLoading, error, refetch } = useAdminSubmissionDetail(id);
  const overrideSubmission = useOverrideSubmissionStatus(id);
  const overridePayout = useOverridePayoutStatus(id);

  const [showSubmissionOverride, setShowSubmissionOverride] = useState(false);
  const [showPayoutOverride, setShowPayoutOverride] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!submission) return null;

  const handleSubmissionOverride = (newStatus: string, reason: string) => {
    overrideSubmission.mutate(
      { status: newStatus as SubmissionStatus, reason },
      {
        onSuccess: () => {
          toast.showSuccess(`Submission status overridden to ${formatEnumLabel(newStatus)}`);
          setShowSubmissionOverride(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t override submission status. Try again.'),
      },
    );
  };

  const handlePayoutOverride = (newStatus: string, reason: string) => {
    overridePayout.mutate(
      { payoutStatus: newStatus, reason },
      {
        onSuccess: () => {
          toast.showSuccess(`Payout status overridden to ${formatEnumLabel(newStatus)}`);
          setShowPayoutOverride(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t override payout status. Try again.'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/admin/bounties' },
    { label: `Submission #${id.slice(0, 8)}` },
  ];

  return (
    <>
      <PageHeader
        title={`Submission #${id.slice(0, 8)}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            <Button label="Override Status" icon="pi pi-exclamation-triangle" severity="warning" onClick={() => setShowSubmissionOverride(true)} />
            <Button label="Override Payout" icon="pi pi-dollar" severity="warning" outlined onClick={() => setShowPayoutOverride(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Proof of Completion</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-text-muted mb-1">Text Proof</h4>
                <p className="text-text-secondary whitespace-pre-wrap">{submission.proofText}</p>
              </div>

              {submission.proofLinks && submission.proofLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-1">Links</h4>
                  <ul className="space-y-1">
                    {submission.proofLinks.map((link: string, i: number) => (
                      <li key={i}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
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
                  <h4 className="text-sm font-medium text-text-muted mb-2">Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {submission.proofImages.map((img: { id: string; fileUrl: string; fileName: string }) => (
                      <Image key={img.id} src={img.fileUrl} alt={img.fileName} preview width="200" className="rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Status</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-text-muted">Submission Status</dt>
                <dd className="mt-1"><StatusBadge type="submission" value={submission.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Payout Status</dt>
                <dd className="mt-1"><StatusBadge type="payout" value={submission.payoutStatus} /></dd>
              </div>
            </dl>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-text-muted">Participant</dt>
                <dd className="text-sm font-medium text-text-primary">{submission.user ? `${submission.user.firstName} ${submission.user.lastName}` : 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Bounty</dt>
                <dd
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
                  onClick={() => router.push(`/admin/bounties/${submission.bountyId}`)}
                >
                  {submission.bounty?.title || 'View Bounty'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Submitted</dt>
                <dd className="text-sm font-medium text-text-primary">{formatDateTime(submission.createdAt)}</dd>
              </div>
              {submission.reviewedBy && (
                <div>
                  <dt className="text-sm text-text-muted">Reviewed By</dt>
                  <dd className="text-sm font-medium text-text-primary">{submission.reviewedBy.firstName} {submission.reviewedBy.lastName}</dd>
                </div>
              )}
              {submission.reviewerNote && (
                <div>
                  <dt className="text-sm text-text-muted">Review Note</dt>
                  <dd className="text-sm text-text-secondary">{submission.reviewerNote}</dd>
                </div>
              )}
            </dl>
          </div>

          {/*
            Phase 3B: Visibility check status panel.

            Surfaced only when the post-approval re-check has logged at least
            one consecutive failure — healthy submissions stay quiet. Two
            consecutive failures auto-trigger a refund (ADR 0010); the panel
            calls that out so SUPER_ADMIN can drill into the per-attempt
            history before the next scheduler tick fires.

            `consecutiveVisibilityFailures` is gated to SUPER_ADMIN at the
            response builder (submissions.service.ts), so the (count > 0)
            check is a sufficient role-and-data guard for this surface.
          */}
          {(submission.consecutiveVisibilityFailures ?? 0) > 0 && (
            <div className="glass-card p-6 border border-accent-rose/30">
              <div className="flex items-start justify-between mb-4 gap-3">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <i className="pi pi-eye-slash text-accent-rose" aria-hidden="true" />
                  Visibility check status
                </h3>
                <Tag
                  value={`${submission.consecutiveVisibilityFailures} consecutive`}
                  severity={
                    (submission.consecutiveVisibilityFailures ?? 0) >= 2
                      ? 'danger'
                      : 'warning'
                  }
                />
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-text-muted">Approved at</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {submission.approvedAt
                      ? formatDateTime(submission.approvedAt)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Last visibility check</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {submission.lastVisibilityCheckAt
                      ? formatDateTime(submission.lastVisibilityCheckAt)
                      : '—'}
                  </dd>
                </div>
                {(submission.consecutiveVisibilityFailures ?? 0) >= 2 && (
                  <div className="bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-xs px-3 py-2 rounded-lg">
                    <i className="pi pi-exclamation-triangle mr-1.5" />
                    Threshold reached — auto-refund will be issued by the
                    next visibility scheduler tick (ADR 0010).
                  </div>
                )}
              </dl>
              <div className="mt-4">
                <Link
                  href="/admin/finance/visibility-failures"
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  View all visibility failures →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <OverrideModal
        visible={showSubmissionOverride}
        onHide={() => setShowSubmissionOverride(false)}
        title="Override Submission Status"
        entityType="submission"
        currentStatus={submission.status}
        statusOptions={submissionStatusOptions}
        onOverride={handleSubmissionOverride}
        loading={overrideSubmission.isPending}
      />

      <OverrideModal
        visible={showPayoutOverride}
        onHide={() => setShowPayoutOverride(false)}
        title="Override Payout Status"
        entityType="payout"
        currentStatus={submission.payoutStatus}
        statusOptions={payoutStatusOptions}
        onOverride={handlePayoutOverride}
        loading={overridePayout.isPending}
      />
    </>
  );
}
