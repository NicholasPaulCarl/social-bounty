'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Inbox,
  Info,
  Lock,
  Search,
  X,
} from 'lucide-react';
import { useCreateDispute } from '@/hooks/useDisputes';
import { useMySubmissions } from '@/hooks/useSubmissions';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatEnumLabel } from '@/lib/utils/format';
import {
  DisputeCategory,
  DisputeReason,
  SubmissionStatus,
  DISPUTE_REASON_CATEGORIES,
  DISPUTE_LIMITS,
} from '@social-bounty/shared';
import type { MySubmissionListItem } from '@social-bounty/shared';

const TOTAL_STEPS = 4;

const NON_PAYMENT_REASONS = DISPUTE_REASON_CATEGORIES.NON_PAYMENT.map((r) => ({
  label: formatEnumLabel(r),
  value: r as DisputeReason,
}));

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-all duration-200 font-mono tabular-nums ${
              step < current
                ? 'bg-pink-600 border-pink-600 text-background'
                : step === current
                  ? 'bg-pink-600/20 border-pink-600 text-pink-600'
                  : 'bg-elevated border-glass-border text-text-muted'
            }`}
          >
            {step < current ? <Check size={14} strokeWidth={2} /> : step}
          </div>
          {step < total && (
            <div
              className={`h-px w-8 transition-all duration-200 ${
                step < current ? 'bg-pink-600' : 'bg-glass-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NewDisputePage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState(1);

  // Form state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [reason, setReason] = useState<DisputeReason | ''>('');
  const [description, setDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');

  const { data: submissionsData, isLoading: submissionsLoading } = useMySubmissions({
    page: 1,
    limit: 100,
    status: SubmissionStatus.APPROVED,
    sortOrder: 'desc',
  });

  const createDispute = useCreateDispute();

  const approvedSubmissions = submissionsData?.data ?? [];

  const selectedSubmission = approvedSubmissions.find(
    (s: MySubmissionListItem) => s.id === selectedSubmissionId,
  );

  const submissionOptions = approvedSubmissions.map((s: MySubmissionListItem) => ({
    label: `${s.bounty.title} — ${formatDate(s.createdAt)}`,
    value: s.id,
  }));

  const descriptionValid = description.trim().length >= 50;
  const desiredOutcomeValid = desiredOutcome.trim().length >= 10;

  function canAdvance(): boolean {
    if (step === 1) return !!selectedSubmissionId;
    if (step === 2) return !!reason;
    if (step === 3) return descriptionValid && desiredOutcomeValid;
    return true;
  }

  function handleSubmit() {
    if (!selectedSubmissionId || !reason) return;
    createDispute.mutate(
      {
        submissionId: selectedSubmissionId,
        category: DisputeCategory.NON_PAYMENT,
        reason: reason as DisputeReason,
        description: description.trim(),
        desiredOutcome: desiredOutcome.trim(),
      },
      {
        onSuccess: (dispute) => {
          showSuccess('Dispute raised. We\'re looking into it.');
          router.push(`/my-disputes/${dispute.id}`);
        },
        onError: () => showError('Couldn\'t file dispute. Try again.'),
      },
    );
  }

  const breadcrumbs = [
    { label: 'My disputes', url: '/my-disputes' },
    { label: 'File' },
  ];

  return (
    <>
      <PageHeader
        title="File a dispute"
        subtitle="Got an issue? Raise it here."
        breadcrumbs={breadcrumbs}
      />

      <div className="max-w-2xl animate-fade-up">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {/* Step 1 — Select Submission */}
        {step === 1 && (
          <div className="glass-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Select submission</h2>
              <p className="text-sm text-text-muted">
                Choose the approved submission this dispute relates to.
              </p>
            </div>

            <Divider />

            {submissionsLoading ? (
              <LoadingState type="form" />
            ) : approvedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <Inbox size={32} strokeWidth={2} className="text-text-muted mx-auto" />
                <p className="text-text-muted text-sm mt-3">
                  No approved submissions yet.
                </p>
                <Button
                  label="Browse bounties"
                  icon={<Search size={14} strokeWidth={2} />}
                  outlined
                  size="small"
                  className="mt-4"
                  onClick={() => router.push('/bounties')}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-secondary">
                  Approved submission
                </label>
                <Dropdown
                  value={selectedSubmissionId}
                  options={submissionOptions}
                  onChange={(e) => setSelectedSubmissionId(e.value)}
                  placeholder="Select a submission..."
                  className="w-full"
                  filter
                  filterPlaceholder="Search submissions..."
                />

                {selectedSubmission && (
                  <div className="p-4 rounded-lg bg-elevated border border-glass-border mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-text-primary">
                        {selectedSubmission.bounty.title}
                      </span>
                      <StatusBadge type="submission" value={selectedSubmission.status} size="small" />
                    </div>
                    <p className="text-xs text-text-muted">
                      Submitted {formatDate(selectedSubmission.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Category & Reason */}
        {step === 2 && (
          <div className="glass-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Category &amp; reason</h2>
              <p className="text-sm text-text-muted">
                Participants can file disputes in the Non-Payment category.
              </p>
            </div>

            <Divider />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-pink-100 border border-pink-200">
                  <Lock size={14} strokeWidth={2} className="text-pink-700" />
                  <span className="text-sm font-medium text-pink-700">Non-payment</span>
                  <span className="ml-auto text-xs text-text-muted">Auto-selected for participants</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Reason</label>
                <Dropdown
                  value={reason}
                  options={NON_PAYMENT_REASONS}
                  onChange={(e) => setReason(e.value)}
                  placeholder="Select the reason for your dispute..."
                  className="w-full"
                />
                {reason && (
                  <p className="text-xs text-text-muted mt-2 flex items-start gap-1">
                    <Info size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
                    <span>
                      {reason === DisputeReason.PAYMENT_NOT_RECEIVED && 'You have not received the payment for your approved submission.'}
                      {reason === DisputeReason.PAYMENT_INCORRECT_AMOUNT && 'The amount paid does not match the bounty reward.'}
                      {reason === DisputeReason.PAYMENT_DELAYED_BEYOND_TERMS && 'Payment has not been made within the agreed timeframe.'}
                      {reason === DisputeReason.PAYOUT_MARKED_BUT_NOT_RECEIVED && 'The payout is marked as paid in the system but you have not received it.'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Description & Desired Outcome */}
        {step === 3 && (
          <div className="glass-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Details</h2>
              <p className="text-sm text-text-muted">
                Provide a clear description of the issue and what outcome you are seeking.
              </p>
            </div>

            <Divider />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                  <span className="text-text-muted font-normal ml-1">(min 50 characters)</span>
                </label>
                <InputTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full"
                  placeholder="Describe the issue in detail. Include relevant dates, amounts, and any steps you have already taken..."
                  autoResize
                  maxLength={DISPUTE_LIMITS.DESCRIPTION_MAX}
                />
                <div className="flex justify-between mt-1">
                  <p className={`text-xs flex items-center gap-1 ${descriptionValid ? 'text-success-600' : 'text-text-muted'}`}>
                    {descriptionValid ? (
                      <><Check size={12} strokeWidth={2} /> Minimum length met</>
                    ) : (
                      <span className="font-mono tabular-nums">{description.trim().length}/50 characters minimum</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted font-mono tabular-nums">
                    {description.length}/{DISPUTE_LIMITS.DESCRIPTION_MAX}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Desired outcome
                </label>
                <InputTextarea
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  rows={3}
                  className="w-full"
                  placeholder="What resolution are you seeking? e.g. Full payment of R500 within 7 days..."
                  autoResize
                  maxLength={DISPUTE_LIMITS.DESIRED_OUTCOME_MAX}
                />
                <p className="text-xs text-text-muted mt-1 text-right font-mono tabular-nums">
                  {desiredOutcome.length}/{DISPUTE_LIMITS.DESIRED_OUTCOME_MAX}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Review & Submit */}
        {step === 4 && (
          <div className="glass-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Review &amp; submit</h2>
              <p className="text-sm text-text-muted">
                Check everything before submitting. Our team reviews every dispute.
              </p>
            </div>

            <Divider />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Submission</p>
                  <p className="text-sm text-text-primary mt-0.5">{selectedSubmission?.bounty.title ?? '—'}</p>
                </div>
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Category</p>
                  <p className="text-sm text-text-primary mt-0.5">Non-payment</p>
                </div>
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Reason</p>
                  <p className="text-sm text-text-primary mt-0.5">{reason ? formatEnumLabel(reason) : '—'}</p>
                </div>
              </div>

              <Divider />

              <div>
                <p className="eyebrow !text-text-muted !text-[11px]">Description</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap mt-0.5">{description}</p>
              </div>

              <Divider />

              <div>
                <p className="eyebrow !text-text-muted !text-[11px]">Desired outcome</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap mt-0.5">{desiredOutcome}</p>
              </div>

              <div className="p-3 rounded-lg bg-warning-600/10 border border-warning-600/20 flex gap-2">
                <Info size={14} strokeWidth={2} className="text-warning-600 mt-0.5 shrink-0" />
                <p className="text-xs text-warning-600 leading-relaxed">
                  We&apos;ll review and update you on any changes. Double-check your details before you submit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            label={step === 1 ? 'Cancel' : 'Back'}
            icon={step === 1 ? <X size={14} strokeWidth={2} /> : <ArrowLeft size={14} strokeWidth={2} />}
            outlined
            onClick={() => (step === 1 ? router.push('/my-disputes') : setStep(step - 1))}
          />
          {step < TOTAL_STEPS ? (
            <Button
              label="Next"
              icon={<ArrowRight size={14} strokeWidth={2} />}
              iconPos="right"
              className="bg-pink-600 border-pink-600 text-background hover:bg-pink-700"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
            />
          ) : (
            <Button
              label="Submit"
              icon={<Flag size={14} strokeWidth={2} />}
              iconPos="right"
              className="bg-pink-600 border-pink-600 text-background hover:bg-pink-700"
              disabled={createDispute.isPending}
              loading={createDispute.isPending}
              onClick={handleSubmit}
            />
          )}
        </div>
      </div>
    </>
  );
}
