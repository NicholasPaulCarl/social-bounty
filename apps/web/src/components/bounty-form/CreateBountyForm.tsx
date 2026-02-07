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
}

const SECTION_HELPER_TEXT: Record<string, string> = {
  basicInfo: 'Give your bounty a clear title and detailed instructions so participants know exactly what to do.',
  channels: 'Select which social media platforms participants should post on.',
  contentRules: 'Set rules for the type of content participants can create.',
  postVisibility: 'Choose how long participant posts must remain visible.',
  rewards: 'Define what participants earn for completing this bounty. You can offer multiple rewards.',
  eligibility: 'Set requirements that participants must meet to qualify. Leave empty if the bounty is open to everyone.',
  proofRequirements: 'Describe what evidence participants must submit to prove they completed the bounty.',
  submissionLimits: 'Limit the number of submissions this bounty will accept. Leave empty for unlimited.',
  schedule: 'Set when this bounty becomes available. Leave empty to publish manually.',
  payoutMetrics: 'Set performance thresholds participants must meet before payout is processed. Leave empty for no thresholds.',
};

export function CreateBountyForm({
  initialBounty,
  onSubmit,
  onSaveDraft,
  isSubmitting,
  isSavingDraft,
  formError,
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
    onSubmit(toRequest());
  }, [validate, state.errors, toRequest, onSubmit]);

  const handleDraft = useCallback(() => {
    if (!validate('draft')) return;
    onSaveDraft(toRequest());
  }, [validate, toRequest, onSaveDraft]);

  const handleCancel = useCallback(() => {
    router.push('/business/bounties');
  }, [router]);

  return (
    <>
      {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

      <form ref={formRef} className="flex flex-col gap-6 pb-24 md:pb-24 max-w-4xl mx-auto" onSubmit={(e) => e.preventDefault()}>
        {/* Section 1: Basic Information */}
        <div data-section="basicInfo">
          <SectionPanel
            number={1}
            title="Basic Information"
            icon="pi-file-edit"
            isComplete={isSectionComplete('basicInfo', state)}
            hasError={state.submitAttempted && getSectionErrors('basicInfo', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.basicInfo}
          >
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Title <span className="text-danger-500">*</span>
              </label>
              <InputText
                id="title"
                value={state.title}
                onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
                onBlur={() => handleBlur('title')}
                className={`w-full ${state.errors.title ? 'p-invalid' : ''}`}
                placeholder="Enter bounty title"
                maxLength={FIELD_LIMITS.BOUNTY_TITLE_MAX}
              />
              <small className="text-xs text-neutral-400 mt-1 block text-right">
                {state.title.length}/{FIELD_LIMITS.BOUNTY_TITLE_MAX}
              </small>
              {state.errors.title && (
                <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.title}
                </small>
              )}
            </div>

            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Short Description <span className="text-danger-500">*</span>
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
              />
              <small className="text-xs text-neutral-400 mt-1 block text-right">
                {state.shortDescription.length}/{FIELD_LIMITS.SHORT_DESCRIPTION_MAX}
              </small>
              {state.submitAttempted && state.errors.shortDescription && (
                <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.shortDescription}
                </small>
              )}
            </div>

            <div>
              <label htmlFor="fullInstructions" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Full Instructions <span className="text-danger-500">*</span>
              </label>
              <InputTextarea
                id="fullInstructions"
                value={state.fullInstructions}
                onChange={(e) => dispatch({ type: 'SET_FULL_INSTRUCTIONS', payload: e.target.value })}
                rows={5}
                className={`w-full ${state.submitAttempted && state.errors.fullInstructions ? 'p-invalid' : ''}`}
                placeholder="Detailed step-by-step instructions for participants"
              />
              {state.submitAttempted && state.errors.fullInstructions && (
                <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.fullInstructions}
                </small>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Category <span className="text-danger-500">*</span>
              </label>
              <InputText
                id="category"
                value={state.category}
                onChange={(e) => dispatch({ type: 'SET_CATEGORY', payload: e.target.value })}
                className={`w-full ${state.submitAttempted && state.errors.category ? 'p-invalid' : ''}`}
                placeholder="e.g. Social Media, Content Creation"
                maxLength={FIELD_LIMITS.CATEGORY_MAX}
              />
              {state.submitAttempted && state.errors.category && (
                <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                  <i className="pi pi-exclamation-circle text-xs" />
                  {state.errors.category}
                </small>
              )}
            </div>
          </SectionPanel>
        </div>

        {/* Section 2: Channels */}
        <div data-section="channels">
          <SectionPanel
            number={2}
            title="Channels"
            icon="pi-share-alt"
            isComplete={isSectionComplete('channels', state)}
            hasError={state.submitAttempted && getSectionErrors('channels', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.channels}
          >
            <ChannelSelectionSection
              channels={state.channels}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 3: Content Rules */}
        <div data-section="contentRules">
          <SectionPanel
            number={3}
            title="Content Rules"
            icon="pi-sliders-h"
            isComplete={isSectionComplete('contentRules', state)}
            hasError={state.submitAttempted && getSectionErrors('contentRules', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.contentRules}
          >
            <ContentRulesSection
              aiContentPermitted={state.aiContentPermitted}
              engagementRequirements={state.engagementRequirements}
              dispatch={dispatch}
              errors={state.errors}
              onBlur={handleBlur}
            />
          </SectionPanel>
        </div>

        {/* Section 4: Post Visibility */}
        <div data-section="postVisibility">
          <SectionPanel
            number={4}
            title="Post Visibility"
            icon="pi-eye"
            isComplete={isSectionComplete('postVisibility', state)}
            hasError={state.submitAttempted && getSectionErrors('postVisibility', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.postVisibility}
          >
            <PostVisibilitySection
              postVisibility={state.postVisibility}
              visibilityAcknowledged={state.visibilityAcknowledged}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 5: Rewards */}
        <div data-section="rewards">
          <SectionPanel
            number={5}
            title="Rewards"
            icon="pi-money-bill"
            isComplete={isSectionComplete('rewards', state)}
            hasError={state.submitAttempted && getSectionErrors('rewards', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.rewards}
          >
            <RewardLinesSection
              rewards={state.rewards}
              currency={state.currency}
              totalRewardValue={totalRewardValue}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 6: Eligibility */}
        <div data-section="eligibility">
          <SectionPanel
            number={6}
            title="Eligibility"
            icon="pi-users"
            isComplete={isSectionComplete('eligibility', state)}
            hasError={state.submitAttempted && getSectionErrors('eligibility', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.eligibility}
          >
            <EligibilityRulesSection
              eligibility={state.structuredEligibility}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 7: Proof Requirements */}
        <div data-section="proofRequirements">
          <SectionPanel
            number={7}
            title="Proof Requirements"
            icon="pi-camera"
            isComplete={isSectionComplete('proofRequirements', state)}
            hasError={state.submitAttempted && getSectionErrors('proofRequirements', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.proofRequirements}
          >
            <ProofRequirementsSection
              proofRequirements={state.proofRequirements}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 8: Submission Limits */}
        <div data-section="submissionLimits">
          <SectionPanel
            number={8}
            title="Submission Limits"
            icon="pi-hashtag"
            isComplete={isSectionComplete('submissionLimits', state)}
            hasError={state.submitAttempted && getSectionErrors('submissionLimits', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.submissionLimits}
          >
            <MaxSubmissionsSection
              maxSubmissions={state.maxSubmissions}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />
          </SectionPanel>
        </div>

        {/* Section 9: Schedule */}
        <div data-section="schedule">
          <SectionPanel
            number={9}
            title="Schedule"
            icon="pi-calendar"
            isComplete={isSectionComplete('schedule', state)}
            hasError={state.submitAttempted && getSectionErrors('schedule', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.schedule}
          >
            <ScheduleSection
              startDate={state.startDate}
              endDate={state.endDate}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
              onBlur={handleBlur}
            />
          </SectionPanel>
        </div>

        {/* Section 10: Payout Metrics */}
        <div data-section="payoutMetrics">
          <SectionPanel
            number={10}
            title="Payout Metrics"
            icon="pi-chart-bar"
            isComplete={isSectionComplete('payoutMetrics', state)}
            hasError={state.submitAttempted && getSectionErrors('payoutMetrics', state.errors).length > 0}
            helperText={SECTION_HELPER_TEXT.payoutMetrics}
          >
            <PayoutMetricsSection
              payoutMetrics={state.payoutMetrics}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
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
