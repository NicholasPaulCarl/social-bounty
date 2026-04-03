'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Steps } from 'primereact/steps';
import { useCreateDispute } from '@/hooks/useDisputes';
import { useBounties } from '@/hooks/useBounties';
import { useSubmissionsForBounty } from '@/hooks/useSubmissions';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatEnumLabel } from '@/lib/utils/format';
import { DisputeCategory, DisputeReason, PayoutStatus, SubmissionStatus, DISPUTE_REASON_CATEGORIES } from '@social-bounty/shared';
import type { CreateDisputeRequest } from '@social-bounty/shared';

const steps = [
  { label: 'Select Submission' },
  { label: 'Category & Reason' },
  { label: 'Description' },
  { label: 'Review & Submit' },
];

interface SubmissionOption {
  id: string;
  bountyTitle: string;
  participantName: string;
  status: string;
  payoutStatus: string;
  createdAt: string;
}

function suggestCategory(payoutStatus: string): DisputeCategory {
  if (payoutStatus === PayoutStatus.PAID) return DisputeCategory.POST_NON_COMPLIANCE;
  return DisputeCategory.POST_QUALITY;
}

const reasonOptions = (category: DisputeCategory) => {
  const reasons = DISPUTE_REASON_CATEGORIES[category] ?? [];
  return reasons.map((r) => ({ label: formatEnumLabel(r), value: r }));
};

const categoryDropdownOptions = [
  { label: 'Non Payment', value: DisputeCategory.NON_PAYMENT },
  { label: 'Post Quality', value: DisputeCategory.POST_QUALITY },
  { label: 'Post Non Compliance', value: DisputeCategory.POST_NON_COMPLIANCE },
];

export default function NewBusinessDisputePage() {
  const router = useRouter();
  const toast = useToast();
  const createDispute = useCreateDispute();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionOption | null>(null);
  const [category, setCategory] = useState<DisputeCategory | null>(null);
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');

  // Step 1: fetch the org's bounties so the user can pick which bounty to dispute
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const { data: bountiesData, isLoading: bountiesLoading } = useBounties({ limit: 100 });
  const bountyOptions = (bountiesData?.data ?? []).map((b) => ({ label: b.title, value: b.id }));

  // Step 2: fetch approved/paid submissions for the chosen bounty
  const { data: submissionsRaw, isLoading: submissionsLoading } = useSubmissionsForBounty(
    selectedBountyId ?? '',
    { status: SubmissionStatus.APPROVED, limit: 100 },
  );

  // Map API shape to the local SubmissionOption shape expected by the table
  const submissions: SubmissionOption[] = (submissionsRaw?.data ?? []).map((s) => ({
    id: s.id,
    bountyTitle: bountiesData?.data.find((b) => b.id === selectedBountyId)?.title ?? '',
    participantName: `${s.user.firstName} ${s.user.lastName}`,
    status: s.status,
    payoutStatus: s.payoutStatus,
    createdAt: s.createdAt,
  }));

  const suggestedCategory = selectedSubmission ? suggestCategory(selectedSubmission.payoutStatus) : null;

  const breadcrumbs = [
    { label: 'Disputes', url: '/business/disputes' },
    { label: 'File Dispute' },
  ];

  const handleSelectSubmission = (sub: SubmissionOption) => {
    setSelectedSubmission(sub);
    setCategory(suggestCategory(sub.payoutStatus));
    setReason(null);
  };

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (!selectedSubmission || !category || !reason) return;
    const payload: CreateDisputeRequest = {
      submissionId: selectedSubmission.id,
      category,
      reason,
      description,
      desiredOutcome,
    };
    createDispute.mutate(payload, {
      onSuccess: (res) => {
        toast.showSuccess('Dispute raised. We\'re looking into it.');
        router.push(`/business/disputes/${res.id}`);
      },
      onError: () => toast.showError('Couldn\'t file dispute. Try again.'),
    });
  };

  const canProceedStep0 = !!selectedSubmission;
  const canProceedStep1 = !!category && !!reason;
  const canProceedStep2 = description.trim().length >= 20 && desiredOutcome.trim().length >= 10;

  return (
    <div className="animate-fade-up">
      <PageHeader title="File a Dispute" breadcrumbs={breadcrumbs} />

      <div className="glass-card p-6 mb-6">
        <Steps model={steps} activeIndex={activeStep} className="mb-6" readOnly />
      </div>

      {/* Step 0 – Select Submission */}
      {activeStep === 0 && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-text-primary">Select a Submission</h2>
          <p className="text-sm text-text-secondary">
            Choose the approved or paid submission you want to raise a dispute for.
          </p>

          {/* Bounty picker — must select a bounty before submissions load */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Select Bounty</label>
            {bountiesLoading ? (
              <LoadingState type="inline" />
            ) : (
              <Dropdown
                value={selectedBountyId}
                options={bountyOptions}
                onChange={(e) => { setSelectedBountyId(e.value); setSelectedSubmission(null); }}
                placeholder="Choose a bounty..."
                className="w-full sm:w-96"
                filter
              />
            )}
          </div>

          {selectedBountyId && (submissionsLoading ? (
            <LoadingState type="table" />
          ) : submissions.length > 0 ? (
            <DataTable
              value={submissions}
              selectionMode="single"
              selection={selectedSubmission}
              onSelectionChange={(e) => handleSelectSubmission(e.value as SubmissionOption)}
              dataKey="id"
              stripedRows
              className="cursor-pointer"
            >
              <Column field="bountyTitle" header="Bounty" />
              <Column field="participantName" header="Participant" />
              <Column
                header="Status"
                body={(row: SubmissionOption) => <StatusBadge type="submission" value={row.status} />}
              />
              <Column
                header="Payout"
                body={(row: SubmissionOption) => <StatusBadge type="payout" value={row.payoutStatus} />}
              />
              <Column
                header="Date"
                body={(row: SubmissionOption) => (
                  <span className="text-sm text-text-muted">{formatDate(row.createdAt)}</span>
                )}
              />
            </DataTable>
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">
              No eligible submissions found. Only approved or paid submissions can be disputed.
            </p>
          ))}

          {selectedSubmission && (
            <div className="mt-4 p-3 rounded-lg bg-accent-cyan/5 border border-accent-cyan/20">
              <p className="text-sm text-text-secondary">
                <i className="pi pi-check-circle text-accent-cyan mr-2" />
                Selected: <span className="font-medium text-text-primary">{selectedSubmission.bountyTitle}</span>
                {' — '}{selectedSubmission.participantName}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              label="Next"
              icon="pi pi-chevron-right"
              iconPos="right"
              onClick={handleNext}
              disabled={!canProceedStep0}
            />
          </div>
        </div>
      )}

      {/* Step 1 – Category & Reason */}
      {activeStep === 1 && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-heading font-semibold text-text-primary">Category &amp; Reason</h2>

          {suggestedCategory && (
            <div className="p-3 rounded-lg bg-accent-amber/5 border border-accent-amber/20 flex gap-2">
              <i className="pi pi-info-circle text-accent-amber mt-0.5 flex-shrink-0" />
              <p className="text-sm text-text-secondary">
                Based on the payout status of this submission, we suggest:{' '}
                <span className="font-medium text-text-primary">{formatEnumLabel(suggestedCategory)}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Dispute Category</label>
            <Dropdown
              value={category}
              options={categoryDropdownOptions}
              onChange={(e) => { setCategory(e.value); setReason(null); }}
              placeholder="Select category"
              className="w-full sm:w-72"
            />
          </div>

          {category && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Reason</label>
              <Dropdown
                value={reason}
                options={reasonOptions(category)}
                onChange={(e) => setReason(e.value)}
                placeholder="Select reason"
                className="w-full sm:w-96"
              />
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button label="Back" icon="pi pi-chevron-left" outlined severity="secondary" onClick={handleBack} />
            <Button
              label="Next"
              icon="pi pi-chevron-right"
              iconPos="right"
              onClick={handleNext}
              disabled={!canProceedStep1}
            />
          </div>
        </div>
      )}

      {/* Step 2 – Description */}
      {activeStep === 2 && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-heading font-semibold text-text-primary">Describe the Issue</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Description <span className="text-accent-rose">*</span>
            </label>
            <p className="text-xs text-text-muted">Provide as much detail as possible about the issue.</p>
            <InputTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the issue in detail..."
              className="w-full"
              maxLength={10000}
            />
            <p className="text-xs text-text-muted text-right">{description.length} / 10,000</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Desired Outcome <span className="text-accent-rose">*</span>
            </label>
            <p className="text-xs text-text-muted">What resolution are you seeking?</p>
            <InputTextarea
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              rows={4}
              placeholder="e.g. Full payment to be released, post to be corrected..."
              className="w-full"
              maxLength={5000}
            />
            <p className="text-xs text-text-muted text-right">{desiredOutcome.length} / 5,000</p>
          </div>

          <div className="flex justify-between pt-2">
            <Button label="Back" icon="pi pi-chevron-left" outlined severity="secondary" onClick={handleBack} />
            <Button
              label="Next"
              icon="pi pi-chevron-right"
              iconPos="right"
              onClick={handleNext}
              disabled={!canProceedStep2}
            />
          </div>
        </div>
      )}

      {/* Step 3 – Review & Submit */}
      {activeStep === 3 && selectedSubmission && category && reason && (
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-text-primary">Review &amp; Submit</h2>
            <p className="text-sm text-text-secondary">
              Please review the details below before filing the dispute. Once submitted, this cannot be undone.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Submission</p>
                <p className="text-sm text-text-primary">{selectedSubmission.bountyTitle}</p>
                <p className="text-xs text-text-muted">{selectedSubmission.participantName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Category</p>
                <p className="text-sm text-text-primary">{formatEnumLabel(category)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Reason</p>
                <p className="text-sm text-text-primary">{formatEnumLabel(reason)}</p>
              </div>
            </div>

            <div className="pt-2 space-y-1">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Description</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{description}</p>
            </div>

            <div className="pt-2 space-y-1">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Desired Outcome</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{desiredOutcome}</p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button label="Back" icon="pi pi-chevron-left" outlined severity="secondary" onClick={handleBack} />
            <Button
              label="File Dispute"
              icon="pi pi-flag"
              severity="danger"
              onClick={handleSubmit}
              loading={createDispute.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
