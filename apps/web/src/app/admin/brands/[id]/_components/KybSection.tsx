'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Check, X, KeyRound, Inbox } from 'lucide-react';
import { useAdminKybReview, useApproveKyb, useRejectKyb } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime, formatRelativeTime, formatEnumLabel } from '@/lib/utils/format';
import type { BrandKybSubmissionView } from '@social-bounty/shared';
import { KybDocumentsCard } from './KybDocumentsCard';
import { KybAuditTimeline } from './KybAuditTimeline';
import { RejectKybDialog } from './RejectKybDialog';

interface KybSectionProps {
  brandId: string;
}

/**
 * KYB verification section rendered on the admin brand detail page. Hosts:
 *   - Submitted-data card (left) + Documents card (right)
 *   - Decision panel (Approve / Reject buttons or status-appropriate text)
 *   - Audit log timeline of `kyb.*` events
 *
 * The section is anchored at `id="kyb"` so the queue page can deep-link via
 * `/admin/brands/:brandId#kyb`.
 */
export function KybSection({ brandId }: KybSectionProps) {
  const { data, isLoading, error, refetch } = useAdminKybReview(brandId);
  const toast = useToast();

  const approve = useApproveKyb(brandId);
  const reject = useRejectKyb(brandId);

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;
  if (!data) return null;

  const handleApprove = () => {
    approve.mutate(undefined, {
      onSuccess: () => {
        toast.showSuccess('KYB approved — TradeSafe token mint scheduled.');
        setShowApprove(false);
      },
      onError: () => toast.showError("Couldn't approve KYB. Try again."),
    });
  };

  const handleReject = (reason: string) => {
    reject.mutate(
      { reason },
      {
        onSuccess: () => {
          toast.showSuccess('KYB rejected — brand has been notified.');
          setShowReject(false);
        },
        onError: () => toast.showError("Couldn't reject KYB. Try again."),
      },
    );
  };

  const isPending = data.kybStatus === 'PENDING';

  return (
    <section id="kyb" className="mt-8 scroll-mt-20 space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-wider text-text-muted font-mono mb-1">
          Verification
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
            KYB Verification
          </h2>
          <StatusBadge type="kyb" value={data.kybStatus} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubmissionCard data={data} />
        <KybDocumentsCard documents={data.documents} />
      </div>

      <DecisionPanel
        data={data}
        approveLoading={approve.isPending}
        rejectLoading={reject.isPending}
        onApproveClick={() => setShowApprove(true)}
        onRejectClick={() => setShowReject(true)}
        documentsCount={data.documents.length}
      />

      <section className="glass-card p-6">
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
          Audit trail
        </h3>
        <KybAuditTimeline entries={data.recentAuditLog} />
      </section>

      {/* Approve dialog reuses ConfirmAction without requireReason — approval
          doesn't need an admin justification. */}
      <ConfirmAction
        visible={showApprove}
        onHide={() => setShowApprove(false)}
        title="Approve KYB?"
        message={`Approve KYB for "${data.registeredName ?? data.brandName}"? This will mint a TradeSafe BUYER party token for the brand. This action cannot be undone.`}
        confirmLabel="Approve"
        confirmSeverity="success"
        onConfirm={() => handleApprove()}
        loading={approve.isPending}
      />

      <RejectKybDialog
        visible={showReject}
        onHide={() => setShowReject(false)}
        brandName={data.registeredName ?? data.brandName}
        onConfirm={handleReject}
        loading={reject.isPending}
      />
    </section>
  );
}

function SubmissionCard({ data }: { data: BrandKybSubmissionView }) {
  return (
    <section className="glass-card p-6">
      <header className="mb-4">
        <h3 className="text-lg font-heading font-semibold text-text-primary">
          Submission data
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Submitted by the brand on its KYB form.
        </p>
      </header>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Registered name" value={data.registeredName} />
        <Field label="Trading name" value={data.tradeName} />
        <Field label="Registration number" value={data.registrationNumber} mono />
        <Field label="VAT number" value={data.vatNumber} mono />
        <Field label="Tax number" value={data.taxNumber} mono />
        <Field label="Country" value={data.country} />
        <Field
          label="Org type"
          value={data.orgType ? formatEnumLabel(data.orgType) : null}
        />
        <Field label="Contact email" value={data.contactEmail} />
      </dl>

      <hr className="my-4 border-glass-border" />

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
        <DateField label="Submitted" iso={data.kybSubmittedAt} />
        <DateField label="Approved" iso={data.kybApprovedAt} />
        <DateField label="Rejected" iso={data.kybRejectedAt} />
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</dt>
      <dd
        className={`text-sm ${
          value
            ? `text-text-primary ${mono ? 'font-mono tabular-nums' : ''}`
            : 'text-slate-400'
        }`}
      >
        {value ?? '—'}
      </dd>
    </div>
  );
}

function DateField({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div>
      <dt className="text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</dt>
      {iso ? (
        <dd
          className="text-sm text-text-primary font-mono tabular-nums"
          title={formatDateTime(iso)}
        >
          {formatRelativeTime(iso)}
          <span className="block text-xs text-text-muted font-normal">
            {formatDate(iso)}
          </span>
        </dd>
      ) : (
        <dd className="text-sm text-slate-400">—</dd>
      )}
    </div>
  );
}

interface DecisionPanelProps {
  data: BrandKybSubmissionView;
  approveLoading: boolean;
  rejectLoading: boolean;
  onApproveClick: () => void;
  onRejectClick: () => void;
  documentsCount: number;
}

function DecisionPanel({
  data,
  approveLoading,
  rejectLoading,
  onApproveClick,
  onRejectClick,
  documentsCount,
}: DecisionPanelProps) {
  if (data.kybStatus === 'PENDING') {
    return (
      <section className="glass-card p-6">
        <header className="mb-4">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Decision
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Approving mints a TradeSafe BUYER party token. Rejecting requires a
            reason that the brand will see.
          </p>
        </header>

        {documentsCount === 0 && (
          <Message
            severity="warn"
            text="No documents uploaded — approving without evidence is strongly discouraged."
            className="w-full mb-4"
          />
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            label="Approve KYB"
            icon={<Check size={16} strokeWidth={2} />}
            severity="success"
            onClick={onApproveClick}
            disabled={approveLoading || rejectLoading}
            loading={approveLoading}
          />
          <Button
            label="Reject"
            icon={<X size={16} strokeWidth={2} />}
            severity="danger"
            outlined
            onClick={onRejectClick}
            disabled={approveLoading || rejectLoading}
            loading={rejectLoading}
          />
        </div>
      </section>
    );
  }

  if (data.kybStatus === 'APPROVED') {
    return (
      <section className="glass-card p-6">
        <header className="mb-3">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Approved
          </h3>
        </header>
        <p className="text-sm text-text-secondary">
          Approved on{' '}
          <span className="font-mono tabular-nums text-text-primary">
            {data.kybApprovedAt ? formatDate(data.kybApprovedAt) : 'unknown date'}
          </span>
          .
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <KeyRound size={14} strokeWidth={2} className="text-text-muted shrink-0" />
          {data.tradeSafeTokenId ? (
            <span className="text-sm text-text-primary font-mono tabular-nums break-all">
              TradeSafe token: {data.tradeSafeTokenId}
            </span>
          ) : (
            <Message
              severity="error"
              text="TradeSafe token not minted — see audit log for the failure."
              className="w-full mt-1"
            />
          )}
        </div>
      </section>
    );
  }

  if (data.kybStatus === 'REJECTED') {
    return (
      <section className="glass-card p-6">
        <header className="mb-3">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Rejected
          </h3>
        </header>
        <p className="text-sm text-text-secondary">
          Rejected on{' '}
          <span className="font-mono tabular-nums text-text-primary">
            {data.kybRejectedAt ? formatDate(data.kybRejectedAt) : 'unknown date'}
          </span>
          .
        </p>
        {data.kybRejectionReason && (
          <div className="mt-3 rounded-xl bg-danger-600/5 border border-danger-600/20 p-3">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Reason</p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {data.kybRejectionReason}
            </p>
          </div>
        )}
      </section>
    );
  }

  // NOT_STARTED
  return (
    <section className="glass-card p-6 flex items-center gap-3">
      <Inbox size={20} strokeWidth={2} className="text-text-muted shrink-0" />
      <p className="text-sm text-text-secondary">
        Brand has not started KYB submission.
      </p>
    </section>
  );
}
