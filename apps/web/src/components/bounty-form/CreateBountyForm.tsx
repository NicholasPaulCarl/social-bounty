'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { FIELD_LIMITS } from '@social-bounty/shared';
import type { BountyDetailResponse, CreateBountyRequest, UpdateBountyRequest } from '@social-bounty/shared';
import { useCreateBountyForm } from './useCreateBountyForm';
import { SectionPanel } from './SectionPanel';
import { ChannelSelectionSection } from './ChannelSelectionSection';
import { ContentRulesSection } from './ContentRulesSection';
import { PostVisibilitySection } from './PostVisibilitySection';
import { RewardLinesSection } from './RewardLinesSection';
import { EligibilityRulesSection } from './EligibilityRulesSection';
import { ProofRequirementsSection } from './ProofRequirementsSection';
import { MaxSubmissionsSection } from './MaxSubmissionsSection';
import { ScheduleSection } from './ScheduleSection';
import { PayoutMetricsSection } from './PayoutMetricsSection';
import { BrandAssetsSection } from './BrandAssetsSection';
import { AccessTypeSection } from './AccessTypeSection';
import { FormSummaryFooter } from './FormSummaryFooter';
import { getSectionErrors, isSectionComplete } from './validation';
import { SECTIONS } from './types';

interface CreateBountyFormProps {
  initialBounty?: BountyDetailResponse;
  onSubmit: (data: CreateBountyRequest | UpdateBountyRequest) => void;
  onSaveDraft: (data: CreateBountyRequest | UpdateBountyRequest) => void;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  formError?: string;
  onStagedFilesReady?: (files: File[]) => void;
  readOnlyMode?: 'live' | 'paused';
}

export function CreateBountyForm({
  initialBounty,
  onSubmit,
  onSaveDraft,
  isSubmitting,
  isSavingDraft,
  formError,
  onStagedFilesReady,
  readOnlyMode,
}: CreateBountyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const { state, dispatch, totalRewardValue, validate, handleBlur, toRequest } = useCreateBountyForm(initialBounty);

  const completedSections = useMemo(
    () => SECTIONS.filter((s) => isSectionComplete(s.key, state)).length,
    [state],
  );

  const handleCreate = useCallback(() => {
    if (!validate('full')) {
      // Scroll to first section with errors
      const firstErrorSection = SECTIONS.find((s) => getSectionErrors(s.key, state.errors).length > 0);
      if (firstErrorSection && formRef.current) {
        const el = formRef.current.querySelector(`[data-section="${firstErrorSection.key}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    if (state.stagedBrandAssetFiles.length > 0) {
      onStagedFilesReady?.(state.stagedBrandAssetFiles);
    }
    onSubmit(toRequest('full'));
  }, [validate, state.errors, state.stagedBrandAssetFiles, toRequest, onSubmit, onStagedFilesReady]);

  const handleDraft = useCallback(() => {
    if (!validate('draft')) return;
    if (state.stagedBrandAssetFiles.length > 0) {
      onStagedFilesReady?.(state.stagedBrandAssetFiles);
    }
    onSaveDraft(toRequest('draft'));
  }, [validate, state.stagedBrandAssetFiles, toRequest, onSaveDraft, onStagedFilesReady]);

  const handleCancel = useCallback(() => {
    router.push('/business/bounties');
  }, [router]);

  const isLocked = readOnlyMode === 'live';
  const lockedClass = isLocked ? 'opacity-60 pointer-events-none' : '';

  return (
    <>
      {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

      <form ref={formRef} className="flex flex-col gap-6 pb-24 md:pb-24 max-w-4xl mx-auto" onSubmit={(e) => e.preventDefault()}>
        {/* Section 1: Bounty Basic Information */}
        <div data-section="bountyBasicInfo" className={lockedClass}>
          <SectionPanel
            number={1}
            title={`Bounty Basic Information${isLocked ? ' (Locked)' : ''}`}
            icon="pi-file-edit"
            isComplete={isSectionComplete('bountyBasicInfo', state)}
            hasError={state.submitAttempted && getSectionErrors('bountyBasicInfo', state.errors).length > 0}
          >
            <div>
              <label htmlFor="title" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                Title <span className="text-accent-rose">*</span>
              </label>
              <InputText
                id="title"
                value={state.title}
                onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                onBlur={() => handleBlur('title')}
                className={`w-full ${state.errors.title ? 'p-invalid' : ''}`}
                placeholder="Enter bounty title"
                maxLength={FIELD_LIMITS.BOUNTY_TITLE_MAX}
                disabled={isLocked}
              />
              <small className="text-xs text-text-muted mt-1 block text-right">
                {state.title.length}/{FIELD_LIMITS.BOUNTY_TITLE_MAX}
              </small>
              {state.errors.title && (
                <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.title}
                </small>
              )}
            </div>

            <div>
              <label htmlFor="shortDescription" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                Campaign or Brand Description <span className="text-accent-rose">*</span>
              </label>
              <InputTextarea
                id="shortDescription"
                value={state.shortDescription}
                onChange={(e) => dispatch({ type: 'SET_SHORT_DESCRIPTION', payload: e.target.value })}
                onBlur={() => handleBlur('shortDescription')}
                rows={2}
                className={`w-full ${state.submitAttempted && state.errors.shortDescription ? 'p-invalid' : ''}`}
                placeholder="Brief summary visible in bounty listings"
                maxLength={FIELD_LIMITS.SHORT_DESCRIPTION_MAX}
                disabled={isLocked}
              />
              <small className="text-xs text-text-muted mt-1 block text-right">
                {state.shortDescription.length}/{FIELD_LIMITS.SHORT_DESCRIPTION_MAX}
              </small>
              {state.submitAttempted && state.errors.shortDescription && (
                <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.shortDescription}
                </small>
              )}
            </div>

            <div>
              <label htmlFor="fullInstructions" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                Instructions <span className="text-accent-rose">*</span>
              </label>
              <InputTextarea
                id="fullInstructions"
                value={state.fullInstructions}
                onChange={(e) => dispatch({ type: 'SET_FULL_INSTRUCTIONS', payload: e.target.value })}
                rows={5}
                className={`w-full ${state.submitAttempted && state.errors.fullInstructions ? 'p-invalid' : ''}`}
                placeholder="Detailed step-by-step instructions for Hunters"
                disabled={isLocked}
              />
              {state.submitAttempted && state.errors.fullInstructions && (
                <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.fullInstructions}
                </small>
              )}
            </div>

            <ChannelSelectionSection
              channels={state.channels}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 2: Bounty Content */}
        <div data-section="bountyContent" className={lockedClass}>
          <SectionPanel
            number={2}
            title={`Bounty Content${isLocked ? ' (Locked)' : ''}`}
            icon="pi-sliders-h"
            isComplete={isSectionComplete('bountyContent', state)}
            hasError={state.submitAttempted && getSectionErrors('bountyContent', state.errors).length > 0}
          >
            <ContentRulesSection
              aiContentPermitted={state.aiContentPermitted}
              engagementRequirements={state.engagementRequirements}
              dispatch={dispatch}
              errors={state.errors}
              onBlur={handleBlur}
            />
            <PostVisibilitySection
              postVisibility={state.postVisibility}
              visibilityAcknowledged={state.visibilityAcknowledged}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
            <RewardLinesSection
              rewards={state.rewards}
              currency={state.currency}
              totalRewardValue={totalRewardValue}
              payoutMethod={state.payoutMethod}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 3: Bounty Rules */}
        <div data-section="bountyRules">
          <SectionPanel
            number={3}
            title="Bounty Rules"
            icon="pi-shield"
            isComplete={isSectionComplete('bountyRules', state)}
            hasError={state.submitAttempted && getSectionErrors('bountyRules', state.errors).length > 0}
          >
            <EligibilityRulesSection
              eligibility={state.structuredEligibility}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
            <ProofRequirementsSection
              proofRequirements={state.proofRequirements}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
            <MaxSubmissionsSection
              maxSubmissions={state.maxSubmissions}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
            <ScheduleSection
              startDate={state.startDate}
              endDate={state.endDate}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
              onBlur={handleBlur}
              disableStartDate={isLocked}
            />
            <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
              <PayoutMetricsSection
                payoutMetrics={state.payoutMetrics}
                dispatch={dispatch}
                errors={state.errors}
                submitAttempted={state.submitAttempted}
              />
            </div>
          </SectionPanel>
        </div>

        {/* Section 4 (new): Access Type */}
        <div data-section="accessType">
          <SectionPanel
            number={4}
            title="Access Type"
            icon="pi-lock"
            isComplete={true}
            hasError={false}
          >
            <AccessTypeSection
              accessType={state.accessType}
              invitations={state.invitations}
              dispatch={dispatch}
            />
          </SectionPanel>
        </div>

        {/* Section 5: Brand Assets */}
        <div data-section="brandAssets" className={lockedClass}>
          <SectionPanel
            number={5}
            title={`Brand Assets${isLocked ? ' (Locked)' : ''}`}
            icon="pi-images"
            isComplete={isSectionComplete('brandAssets', state)}
            hasError={false}
          >
            <BrandAssetsSection
              bountyId={initialBounty?.id ?? null}
              brandAssets={initialBounty?.brandAssets ?? []}
              stagedFiles={state.stagedBrandAssetFiles}
              dispatch={dispatch}
            />
          </SectionPanel>
        </div>
      </form>

      <FormSummaryFooter
        currency={state.currency}
        totalRewardValue={totalRewardValue}
        completedSections={completedSections}
        totalSections={SECTIONS.length}
        onCancel={handleCancel}
        onSaveDraft={handleDraft}
        onCreate={handleCreate}
        isSaving={isSavingDraft}
        isCreating={isSubmitting}
      />
    </>
  );
}
