'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { FilePen, DollarSign, Shield, Lock, Images, Check, Pencil, X, Plus, AlertCircle, Video, Image as ImageIcon, Info } from 'lucide-react';
import { FIELD_LIMITS, ContentFormat, BountyAccessType, SocialChannel } from '@social-bounty/shared';
import type { BountyDetailResponse, CreateBountyRequest, UpdateBountyRequest } from '@social-bounty/shared';
import { useCreateBountyForm } from './useCreateBountyForm';
import { SectionPanel } from './SectionPanel';
import { ChannelSelectionSection } from './ChannelSelectionSection';
import { PostVisibilitySection } from './PostVisibilitySection';
import { RewardLinesSection } from './RewardLinesSection';
import { EligibilityRulesSection } from './EligibilityRulesSection';
import { CustomRulesSection } from './CustomRulesSection';
import { MaxSubmissionsSection } from './MaxSubmissionsSection';
import { ScheduleSection } from './ScheduleSection';
import { PayoutMetricsSection } from './PayoutMetricsSection';
import { BrandAssetsSection } from './BrandAssetsSection';
import { AccessTypeSection } from './AccessTypeSection';
import { AutoVerifyPreviewAccordion } from './AutoVerifyPreviewAccordion';
import { getSectionErrors, isSectionComplete, bountyRulesHasContent, validateStep } from './validation';
import { SECTIONS } from './types';
import type { BountyFormState } from './types';
import { WizardShell, type WizardStepDescriptor } from './WizardShell';

// ---------------------------------------------------------------------------
// Wizard step descriptors. Five steps mapping to the regrouped section
// layout — see validation.ts → WIZARD_STEP_SECTIONS for the per-step
// owned-error subset that gates Next-click forward navigation.
// ---------------------------------------------------------------------------

const WIZARD_STEPS: ReadonlyArray<WizardStepDescriptor> = [
  {
    label: 'Basics',
    title: 'Basics',
    description: 'Name your bounty, pick the platforms, and write the instructions hunters will follow.',
  },
  {
    label: 'Instructions & Metrics',
    title: 'Instructions & Metrics',
    description: 'Add the engagement metrics submissions must hit and any custom verification rules.',
  },
  {
    label: 'Access & Requirements',
    title: 'Access & Requirements',
    description: 'Decide who can claim the bounty and what each post must include or maintain.',
  },
  {
    label: 'Claim & Rewards',
    title: 'Claim & Rewards',
    description: 'Set the reward, the number of claims, and how hunters get paid.',
  },
  {
    label: 'Document Share',
    title: 'Document Share',
    description: 'Upload guides, briefs, logos, or any other collateral hunters need.',
  },
];

// ---------------------------------------------------------------------------
// Instruction Steps Builder
// ---------------------------------------------------------------------------

function InstructionStepsBuilder({
  steps,
  dispatch,
  errors,
  submitAttempted,
  isLocked,
}: {
  steps: string[];
  dispatch: React.Dispatch<import('./types').BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
  isLocked: boolean;
}) {
  const [isEditing, setIsEditing] = useState(true);
  const hasContent = steps.some((s) => s.trim());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-text-muted text-xs uppercase tracking-wider font-medium">
          Instructions <span className="text-danger-600">*</span>
        </label>
        {hasContent && !isLocked && (
          <Button
            label={isEditing ? 'Done' : 'Edit'}
            icon={isEditing ? <Check size={14} strokeWidth={2} /> : <Pencil size={14} strokeWidth={2} />}
            text
            size="small"
            onClick={() => setIsEditing(!isEditing)}
          />
        )}
      </div>
      <p className="text-xs text-text-muted mb-3">Add step-by-step instructions for your hunters.</p>

      {submitAttempted && errors.fullInstructions && (
        <small className="text-xs text-danger-600 mb-2 flex items-center gap-1">
          <AlertCircle size={12} strokeWidth={2} />
          {errors.fullInstructions}
        </small>
      )}

      {isEditing ? (
        <>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-7 h-9 flex items-center justify-center shrink-0">
                  <span className="w-6 h-6 rounded-full bg-pink-600/10 text-pink-600 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <InputTextarea
                  value={step}
                  onChange={(e) => dispatch({ type: 'UPDATE_INSTRUCTION_STEP', payload: { index, value: e.target.value } })}
                  className="flex-1"
                  rows={2}
                  autoResize
                  placeholder={`Describe step ${index + 1}...`}
                  disabled={isLocked}
                  maxLength={500}
                />
                {steps.length > 1 && (
                  <Button
                    icon={<X size={14} strokeWidth={2} />}
                    text
                    severity="danger"
                    size="small"
                    className="mt-1"
                    onClick={() => dispatch({ type: 'REMOVE_INSTRUCTION_STEP', payload: index })}
                    disabled={isLocked}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button
              label={`Add step ${steps.length + 1}`}
              icon={<Plus size={14} strokeWidth={2} />}
              outlined
              size="small"
              disabled={isLocked || steps.length >= 20}
              onClick={() => dispatch({ type: 'ADD_INSTRUCTION_STEP' })}
            />
            {steps.length >= 20 && (
              <small className="text-xs text-text-muted">Maximum 20 steps</small>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-2 rounded-lg border border-glass-border p-4 bg-bg-abyss">
          {steps.filter((s) => s.trim()).map((step, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-600/10 text-pink-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm text-text-primary">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CreateBountyFormProps {
  initialBounty?: BountyDetailResponse;
  /**
   * One-shot preset hydration — spread over INITIAL_FORM_STATE in the
   * reducer initializer. Edit mode (`initialBounty`) trumps the preset.
   * Reads from `?preset=...` are resolved at the page level via
   * `getPresetFormState()` from `bounty-presets.ts`.
   */
  initialFormOverride?: Partial<BountyFormState>;
  onSubmit: (data: CreateBountyRequest | UpdateBountyRequest) => void;
  onSaveDraft: (data: CreateBountyRequest | UpdateBountyRequest) => void;
  /**
   * Discard handler — invoked after the wizard's confirmation dialog.
   * Page-level component is responsible for the routing target
   * (back to /business/bounties for new, back to detail for edit).
   */
  onDiscard: () => void;
  isSubmitting: boolean;
  isSavingDraft: boolean;
  formError?: string;
  onStagedFilesReady?: (files: File[]) => void;
  readOnlyMode?: 'live' | 'paused';
}

export function CreateBountyForm({
  initialBounty,
  initialFormOverride,
  onSubmit,
  onSaveDraft,
  onDiscard,
  isSubmitting,
  isSavingDraft,
  formError,
  onStagedFilesReady,
  readOnlyMode,
}: CreateBountyFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const { state, dispatch, totalRewardValue, validate, handleBlur, toRequest } = useCreateBountyForm(
    initialBounty,
    initialFormOverride,
  );

  const lastStepIdx = WIZARD_STEPS.length - 1;
  const isLastStep = currentStep === lastStepIdx;

  // Per-step error scoping. We re-derive on every render — the cost is a
  // single validateFull pass, dwarfed by the form's own re-render cost.
  // Step errors gate Next click; full errors are shown on the per-section
  // panels via state.errors (the shared error map).
  const currentStepHasErrors = useMemo(() => {
    if (!state.submitAttempted) return false;
    return Object.keys(validateStep(currentStep, state)).length > 0;
  }, [state, currentStep]);

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStep, state);
    // Mark the current-step errors visible (use the shared SET_ERRORS so
    // the per-field UI lights up). We don't flip submitAttempted on Next
    // — that's reserved for full submit, which gates the per-field error
    // copy on every panel.
    dispatch({ type: 'SET_ERRORS', payload: { ...state.errors, ...stepErrors } });
    if (Object.keys(stepErrors).length > 0) {
      // Mark submit-attempted so per-section error copy renders even
      // before the brand reaches the final step.
      dispatch({ type: 'SET_SUBMIT_ATTEMPTED' });
      // Scroll to the first errored section visible in this step.
      if (formRef.current) {
        const firstErrSection = SECTIONS.find((s) =>
          getSectionErrors(s.key, stepErrors).length > 0,
        );
        if (firstErrSection) {
          const el = formRef.current.querySelector(`[data-section="${firstErrSection.key}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, lastStepIdx));
    // Scroll to top of step so the brand sees the new step heading.
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, state, dispatch, lastStepIdx]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCreate = useCallback(() => {
    if (!validate('full')) {
      // Scroll to first section with errors. Note: SECTIONS is the
      // single source of truth for the scroll-target list; the
      // accessType entry was missing pre-Wave-B (fixed in this wave).
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

  const isLocked = readOnlyMode === 'live';
  const lockedClass = isLocked ? 'opacity-60 pointer-events-none' : '';

  return (
    <>
      {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

      <WizardShell
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        onSaveDraft={handleDraft}
        onDiscard={onDiscard}
        onCreate={handleCreate}
        isSubmitting={isSubmitting}
        isSavingDraft={isSavingDraft}
        currency={state.currency}
        totalRewardValue={totalRewardValue}
        isEditMode={!!initialBounty}
      >
        {/*
          pb clears the fixed wizard footer + iOS safe-area inset.
          Mobile footer ≈ 52px (single row); desktop ≈ 56px.
          calc() adds env(safe-area-inset-bottom) so iOS notched devices clear
          the home-indicator area. See DESIGN-SYSTEM.md §10 (fixed-footer rule).
        */}
        <form
          ref={formRef}
          className="flex flex-col gap-4 sm:gap-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))] max-w-4xl mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          {currentStep === 0 && (
            <div data-section="bountyBasicInfo" className={lockedClass}>
              <SectionPanel
                number={1}
                title={`Bounty information${isLocked ? ' (Locked)' : ''}`}
                Icon={FilePen}
                isComplete={isSectionComplete('bountyBasicInfo', state)}
                hasError={state.submitAttempted && getSectionErrors('bountyBasicInfo', state.errors).length > 0}
              >
                <ChannelSelectionSection
                  channels={state.channels}
                  dispatch={dispatch}
                  errors={state.errors}
                  submitAttempted={state.submitAttempted}
                />

                <div>
                  <label htmlFor="title" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                    Title <span className="text-danger-600">*</span>
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
                    <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} strokeWidth={2} />
                      {state.errors.title}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="shortDescription" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                    Campaign or Brand Description <span className="text-danger-600">*</span>
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
                    <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} strokeWidth={2} />
                      {state.errors.shortDescription}
                    </small>
                  )}
                </div>

                {/* Content Format Selector */}
                <div>
                  <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-2">
                    Accepted Formats <span className="text-danger-600">*</span>
                  </label>
                  {(() => {
                    const tiktokSelected = SocialChannel.TIKTOK in state.channels;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {([
                          { value: ContentFormat.VIDEO_ONLY, label: 'Video only', Icon: Video, desc: 'Only video content accepted' },
                          { value: ContentFormat.PHOTO_ONLY, label: 'Photo only', Icon: ImageIcon, desc: 'Only photo content accepted' },
                          { value: ContentFormat.BOTH, label: 'Both', Icon: Images, desc: 'Video and photo accepted' },
                        ] as const).map(({ value, label, Icon, desc }) => {
                          const selected = state.contentFormat === value;
                          // TikTok is a video-only platform: when it's one of the
                          // selected channels, Photo Only becomes an invalid choice.
                          const disabled = tiktokSelected && value === ContentFormat.PHOTO_ONLY;
                          const showTiktokBadge = tiktokSelected && value === ContentFormat.VIDEO_ONLY;
                          return (
                            <div
                              key={value}
                              role="button"
                              tabIndex={disabled ? -1 : 0}
                              aria-disabled={disabled}
                              className={`relative border rounded-lg p-4 transition-colors text-center ${
                                disabled
                                  ? 'border-glass-border bg-surface/40 opacity-50 cursor-not-allowed'
                                  : selected
                                    ? 'border-2 border-pink-600 bg-pink-600/10 cursor-pointer'
                                    : 'border-glass-border bg-surface hover:border-pink-600 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (disabled) return;
                                dispatch({ type: 'SET_CONTENT_FORMAT', payload: value });
                              }}
                              onKeyDown={(e) => {
                                if (disabled) return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  dispatch({ type: 'SET_CONTENT_FORMAT', payload: value });
                                }
                              }}
                            >
                              {showTiktokBadge && (
                                <Tag
                                  value="Required for TikTok"
                                  severity="info"
                                  className="absolute top-1.5 right-1.5 text-[10px] py-0 px-1.5"
                                />
                              )}
                              <Icon size={24} strokeWidth={2} className={`mx-auto mb-2 ${selected ? 'text-pink-600' : 'text-text-muted'}`} />
                              <p className={`text-sm font-medium ${selected ? 'text-pink-600' : 'text-text-primary'}`}>{label}</p>
                              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {SocialChannel.TIKTOK in state.channels && (
                    <p className="text-xs text-text-muted mt-2">
                      TikTok only accepts video — switch to <span className="font-medium">Both</span> if you also want photos from Instagram/Facebook.
                    </p>
                  )}
                </div>

                {/* Instruction Steps Builder */}
                <InstructionStepsBuilder
                  steps={state.instructionSteps}
                  dispatch={dispatch}
                  errors={state.errors}
                  submitAttempted={state.submitAttempted}
                  isLocked={isLocked}
                />

                {/* AI-Generated Content toggle */}
                <div className="flex items-center justify-between p-3 bg-elevated rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-text-primary">AI-Generated Content</span>
                    <p className="text-xs text-text-muted mt-0.5">Allow Hunters to use AI-generated content</p>
                  </div>
                  <InputSwitch
                    checked={state.aiContentPermitted}
                    onChange={(e) => dispatch({ type: 'SET_AI_CONTENT_PERMITTED', payload: e.value })}
                  />
                </div>

                {/* Schedule (Start / End Date) */}
                <ScheduleSection
                  startDate={state.startDate}
                  endDate={state.endDate}
                  dispatch={dispatch}
                  errors={state.errors}
                  submitAttempted={state.submitAttempted}
                  onBlur={handleBlur}
                  disableStartDate={isLocked}
                />

                {/* Post link requirement notice — surfaced here because Step 1
                    is where the brand picks platforms and instructions; the
                    proof-link contract belongs alongside that decision. */}
                <div className="flex items-start gap-3 p-4 rounded-lg border border-pink-600/30 bg-pink-600/5">
                  <Info size={16} strokeWidth={2} className="text-pink-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Post links are required for all submissions</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Hunters must provide a public URL to their published post as proof of completion.
                    </p>
                  </div>
                </div>
              </SectionPanel>
            </div>
          )}

          {currentStep === 1 && (
            <div data-section="bountyRules">
              <SectionPanel
                number={2}
                title="Instructions & metrics"
                Icon={Shield}
                // Step 2 is metrics + custom rules — intentionally optional.
                isComplete={isSectionComplete('bountyRules', state)}
                hasError={state.submitAttempted && getSectionErrors('bountyRules', state.errors).length > 0}
                optional
                hasContent={
                  state.payoutMetrics.minViews !== null ||
                  state.payoutMetrics.minLikes !== null ||
                  state.payoutMetrics.minComments !== null ||
                  ((state.structuredEligibility.customRules || []).filter((r) => r.trim()).length > 0)
                }
              >
                <PayoutMetricsSection
                  payoutMetrics={state.payoutMetrics}
                  dispatch={dispatch}
                  errors={state.errors}
                  submitAttempted={state.submitAttempted}
                />

                <CustomRulesSection
                  customRules={state.structuredEligibility.customRules || []}
                  dispatch={dispatch}
                  errors={state.errors}
                  submitAttempted={state.submitAttempted}
                />
              </SectionPanel>
            </div>
          )}

          {currentStep === 2 && (
            <>
              <div data-section="bountyRules">
                <SectionPanel
                  number={3}
                  title="Access & requirements"
                  Icon={Shield}
                  isComplete={isSectionComplete('bountyRules', state)}
                  hasError={state.submitAttempted && getSectionErrors('bountyRules', state.errors).length > 0}
                  optional
                  hasContent={bountyRulesHasContent(state)}
                >
                  <EligibilityRulesSection
                    eligibility={state.structuredEligibility}
                    dispatch={dispatch}
                    errors={state.errors}
                    submitAttempted={state.submitAttempted}
                  />

                  {/* Engagement & Visibility toggles */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Engagement &amp; Visibility</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 sm:min-w-[14rem]">
                          <InputSwitch
                            checked={state.engagementRequirements.mention || false}
                            onChange={(e) => dispatch({ type: 'SET_MENTION', payload: e.value })}
                          />
                          <span className="text-sm text-text-primary">Hunter must mention brand</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 sm:min-w-[14rem]">
                          <InputSwitch
                            checked={state.engagementRequirements.comment || false}
                            onChange={(e) => dispatch({ type: 'SET_COMMENT', payload: e.value })}
                          />
                          <span className="text-sm text-text-primary">Hunter must leave a comment</span>
                        </div>
                      </div>
                      <PostVisibilitySection
                        postVisibility={state.postVisibility}
                        dispatch={dispatch}
                        errors={state.errors}
                        submitAttempted={state.submitAttempted}
                      />
                    </div>
                  </div>
                </SectionPanel>
              </div>

              <AutoVerifyPreviewAccordion
                input={{
                  channels: Object.keys(state.channels).length > 0 ? state.channels : null,
                  contentFormat: state.contentFormat,
                  engagementRequirements: state.engagementRequirements,
                  payoutMetrics: state.payoutMetrics,
                  structuredEligibility: state.structuredEligibility,
                }}
              />

              {/* Access Type panel — kept on Step 3 because it's about WHO
                  can claim the bounty (eligibility/engagement neighbours). */}
              <div data-section="accessType">
                <SectionPanel
                  number={4}
                  title="Access type"
                  Icon={Lock}
                  isComplete={true}
                  hasError={false}
                  optional
                  hasContent={
                    state.accessType === BountyAccessType.CLOSED ||
                    state.selectedHunters.length > 0
                  }
                >
                  <AccessTypeSection
                    accessType={state.accessType}
                    selectedHunters={state.selectedHunters}
                    dispatch={dispatch}
                  />
                </SectionPanel>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div data-section="bountyContent" className={lockedClass}>
              <SectionPanel
                number={5}
                title={`Claim & rewards${isLocked ? ' (Locked)' : ''}`}
                Icon={DollarSign}
                isComplete={isSectionComplete('bountyContent', state)}
                hasError={state.submitAttempted && getSectionErrors('bountyContent', state.errors).length > 0}
              >
                <MaxSubmissionsSection
                  maxSubmissions={state.maxSubmissions}
                  dispatch={dispatch}
                  errors={state.errors}
                  submitAttempted={state.submitAttempted}
                />

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
          )}

          {currentStep === 4 && (
            <div data-section="brandAssets" className={lockedClass}>
              <SectionPanel
                number={6}
                title={`Document share${isLocked ? ' (Locked)' : ''}`}
                Icon={Images}
                isComplete={isSectionComplete('brandAssets', state)}
                hasError={false}
                optional
                hasContent={
                  state.stagedBrandAssetFiles.length > 0 ||
                  (initialBounty?.brandAssets?.length ?? 0) > 0
                }
              >
                <BrandAssetsSection
                  bountyId={initialBounty?.id ?? null}
                  brandAssets={initialBounty?.brandAssets ?? []}
                  stagedFiles={state.stagedBrandAssetFiles}
                  dispatch={dispatch}
                />
              </SectionPanel>
            </div>
          )}

          {/* Live error nudge under the body when Next is blocked. The same
              error map is rendered inline next to each input via
              state.errors; this is just the "you can't move on" cue. */}
          {currentStepHasErrors && !isLastStep && (
            <Message
              severity="warn"
              text="There are still errors on this step — fix them above before continuing."
              className="w-full"
            />
          )}
        </form>
      </WizardShell>
    </>
  );
}
