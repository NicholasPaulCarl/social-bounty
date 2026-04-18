'use client';

import { useRef, useCallback, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
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
import { FormSummaryFooter } from './FormSummaryFooter';
import { AutoVerifyPreviewAccordion } from './AutoVerifyPreviewAccordion';
import { getSectionErrors, isSectionComplete, bountyRulesHasContent } from './validation';
import { SECTIONS } from './types';

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
            icon={isEditing ? 'pi pi-check' : 'pi pi-pencil'}
            text
            size="small"
            onClick={() => setIsEditing(!isEditing)}
          />
        )}
      </div>
      <p className="text-xs text-text-muted mb-3">Add step-by-step instructions for your hunters.</p>

      {submitAttempted && errors.fullInstructions && (
        <small className="text-xs text-danger-600 mb-2 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-xs" />
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
                    icon="pi pi-times"
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
              label={`Add Step ${steps.length + 1}`}
              icon="pi pi-plus"
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
  const formRef = useRef<HTMLFormElement>(null);

  const { state, dispatch, totalRewardValue, validate, handleBlur, toRequest } = useCreateBountyForm(initialBounty);

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

  const isLocked = readOnlyMode === 'live';
  const lockedClass = isLocked ? 'opacity-60 pointer-events-none' : '';

  return (
    <>
      {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

      {/*
        pb clears the fixed FormSummaryFooter height + iOS safe-area inset.
        Mobile footer ≈ 52px (single row, amount + buttons); desktop ≈ 56px.
        calc() adds env(safe-area-inset-bottom) so iOS notched devices clear
        the home-indicator area. See DESIGN-SYSTEM.md §10 (fixed-footer rule).
      */}
      <form ref={formRef} className="flex flex-col gap-4 sm:gap-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))] max-w-4xl mx-auto" onSubmit={(e) => e.preventDefault()}>
        {/* Section 1: Bounty Information */}
        <div data-section="bountyBasicInfo" className={lockedClass}>
          <SectionPanel
            number={1}
            title={`Bounty Information${isLocked ? ' (Locked)' : ''}`}
            icon="pi-file-edit"
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
                  <i className="pi pi-exclamation-circle text-xs" />
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
                  <i className="pi pi-exclamation-circle text-xs" />
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
                      { value: ContentFormat.VIDEO_ONLY, label: 'Video Only', icon: 'pi-video', desc: 'Only video content accepted' },
                      { value: ContentFormat.PHOTO_ONLY, label: 'Photo Only', icon: 'pi-image', desc: 'Only photo content accepted' },
                      { value: ContentFormat.BOTH, label: 'Both', icon: 'pi-images', desc: 'Video and photo accepted' },
                    ] as const).map(({ value, label, icon, desc }) => {
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
                          <i className={`pi ${icon} text-2xl ${selected ? 'text-pink-600' : 'text-text-muted'} mb-2`} />
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

            {/* Payout Metrics */}
            <PayoutMetricsSection
              payoutMetrics={state.payoutMetrics}
              dispatch={dispatch}
              errors={state.errors}
              submitAttempted={state.submitAttempted}
            />

            {/* Post link requirement notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-pink-600/30 bg-pink-600/5">
              <i className="pi pi-info-circle text-pink-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">Post links are required for all submissions</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Hunters must provide a public URL to their published post as proof of completion.
                </p>
              </div>
            </div>
          </SectionPanel>
        </div>

        {/* Section 2: Bounty Reward */}
        <div data-section="bountyContent" className={lockedClass}>
          <SectionPanel
            number={2}
            title={`Bounty Reward${isLocked ? ' (Locked)' : ''}`}
            icon="pi-dollar"
            isComplete={isSectionComplete('bountyContent', state)}
            hasError={state.submitAttempted && getSectionErrors('bountyContent', state.errors).length > 0}
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

        {/* Section 3: Bounty Rules — all inputs are optional (proofRequirements
            is auto-seeded to ['url'] to match the inline notice). Pill reads
            "Optional" until the brand adds at least one rule. */}
        <div data-section="bountyRules">
          <SectionPanel
            number={3}
            title="Bounty Rules"
            icon="pi-shield"
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

            <MaxSubmissionsSection
              maxSubmissions={state.maxSubmissions}
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

        {/*
          Phase 3C — live auto-verification preview. Sits directly under the
          rules section (Section 3) so the cause/effect link is visible:
          configure rules → see what Apify will check on every submission.
          Closed by default; brands open it to confirm coverage before saving.
          Re-renders on every form-state change (cheap pure derivation).
        */}
        <AutoVerifyPreviewAccordion
          input={{
            channels: Object.keys(state.channels).length > 0 ? state.channels : null,
            contentFormat: state.contentFormat,
            engagementRequirements: state.engagementRequirements,
            payoutMetrics: state.payoutMetrics,
            structuredEligibility: state.structuredEligibility,
          }}
        />

        {/* Section 4 (new): Access Type */}
        <div data-section="accessType">
          <SectionPanel
            number={4}
            title="Access Type"
            icon="pi-lock"
            isComplete={true}
            hasError={false}
            optional
            // hasContent → brand has moved off the default public access
            // (picked CLOSED or invited specific hunters). Keeping PUBLIC
            // is the zero-friction default, so it reads as "Optional".
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

        {/* Section 5: Brand Assets */}
        <div data-section="brandAssets" className={lockedClass}>
          <SectionPanel
            number={5}
            title={`Brand Assets${isLocked ? ' (Locked)' : ''}`}
            icon="pi-images"
            isComplete={isSectionComplete('brandAssets', state)}
            hasError={false}
            optional
            // hasContent → user has uploaded or staged at least one asset.
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
      </form>

      <FormSummaryFooter
        currency={state.currency}
        totalRewardValue={totalRewardValue}
        onSaveDraft={handleDraft}
        onCreate={handleCreate}
        isSaving={isSavingDraft}
        isCreating={isSubmitting}
      />
    </>
  );
}
