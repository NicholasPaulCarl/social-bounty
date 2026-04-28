'use client';

import { useState, type ReactNode } from 'react';
import { Button } from 'primereact/button';
import { ChevronLeft, ChevronRight, Check, Trash2 } from 'lucide-react';
import { Currency } from '@social-bounty/shared';
import { ConfirmAction } from '@/components/common/ConfirmAction';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.ZAR]: 'R',
  [Currency.USD]: '$',
  [Currency.GBP]: '£',
  [Currency.EUR]: '€',
};

export interface WizardStepDescriptor {
  /** Short label shown in the step indicator (e.g. "Basics"). */
  label: string;
  /** Long-form heading rendered above the step body. Optional. */
  title?: string;
  /** Helper paragraph rendered above the step body. Optional. */
  description?: string;
}

interface WizardShellProps {
  steps: ReadonlyArray<WizardStepDescriptor>;
  currentStep: number;
  /** Render-prop for the active step's body. Receives the step index. */
  children: ReactNode;

  // Wizard navigation
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  /**
   * Discard handler — invoked AFTER the user confirms the discard
   * dialog. The shell wraps the trigger in a confirmation flow; the
   * page-level component is responsible for the routing decision
   * (back to /business/bounties for new, back to detail for edit).
   */
  onDiscard: () => void;

  // Final-step Create handler. Shown only when currentStep is the last step.
  onCreate: () => void;

  // Loading / disabled state
  isSubmitting: boolean;
  isSavingDraft: boolean;

  // Final-step summary readout. `totalRewardValue` is the multiplied
  // amount (= perClaim × maxSubmissions per ADR 0013); the breakdown
  // subline is only rendered when `maxSubmissions > 1` so single-claim
  // bounties stay tight.
  currency: Currency;
  totalRewardValue: number;
  perClaimRewardValue: number;
  maxSubmissions: number | null;

  /**
   * If true, the Discard confirmation copy adopts edit-mode wording
   * ("Discard changes" rather than "Discard new bounty"). The handler
   * itself is the same — the routing target lives at the page level.
   */
  isEditMode?: boolean;
}

/**
 * WizardShell — pure-presentational scaffold around the bounty creation
 * flow. Renders:
 *
 *   1. A horizontally-scrolling step indicator (mobile-first; desktop
 *      pads the row). Each pill carries its 1-based number, label, and
 *      a "current"/"done" state. Numbers and labels are non-interactive
 *      — we don't expose direct step jumps because that would let the
 *      user skip per-step validation gates. Back/Next is the only path.
 *
 *   2. The active step's body via children.
 *
 *   3. A wizard footer with Back · Save Draft · Next (or Create on last
 *      step) · Discard. Save Draft is available at every step. Discard
 *      is gated by a PrimeReact ConfirmAction dialog.
 *
 * On the final step, the footer additionally renders the running
 * total-reward readout (mirrors the legacy FormSummaryFooter so brands
 * see the amount they're committing to before the Create click).
 */
export function WizardShell({
  steps,
  currentStep,
  children,
  onBack,
  onNext,
  onSaveDraft,
  onDiscard,
  onCreate,
  isSubmitting,
  isSavingDraft,
  currency,
  totalRewardValue,
  perClaimRewardValue,
  maxSubmissions,
  isEditMode,
}: WizardShellProps) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const active = steps[currentStep];
  const handleDiscardClick = () => setDiscardOpen(true);
  const handleDiscardConfirm = () => {
    setDiscardOpen(false);
    onDiscard();
  };

  return (
    <>
      {/* Step indicator — horizontally scrollable on mobile so labels never
          truncate, padded centred on desktop. Pills are visual-only; we
          intentionally don't expose direct jumps so per-step validation
          gates remain enforced. */}
      <nav aria-label="Bounty creation steps" className="mb-6">
        <ol className="flex items-center gap-2 overflow-x-auto px-1 -mx-1 pb-2 sm:gap-3 sm:flex-wrap sm:overflow-visible">
          {steps.map((s, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <li
                key={s.label}
                className="flex items-center gap-2 shrink-0"
                aria-current={isActive ? 'step' : undefined}
              >
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm border transition-colors ${
                    isActive
                      ? 'border-pink-600 bg-pink-600/10 text-pink-600'
                      : isDone
                        ? 'border-success-600/40 bg-success-600/10 text-success-600'
                        : 'border-glass-border bg-surface text-text-muted'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isActive
                        ? 'bg-pink-600 text-white'
                        : isDone
                          ? 'bg-success-600 text-white'
                          : 'bg-bg-abyss text-text-muted'
                    }`}
                  >
                    {isDone ? <Check size={12} strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className="font-medium whitespace-nowrap">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <span aria-hidden className="hidden sm:inline-block w-4 h-px bg-glass-border" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Active-step heading + helper copy. Reuses the design-system's
          eyebrow + title pair so the wizard reads like the rest of the
          app's page-level scaffolds. */}
      {(active?.title || active?.description) && (
        <div className="mb-5 sm:mb-6">
          {active?.title && (
            <h2 className="font-heading text-lg sm:text-xl font-semibold text-text-primary">
              {active.title}
            </h2>
          )}
          {active?.description && (
            <p className="text-sm text-text-secondary mt-1">{active.description}</p>
          )}
        </div>
      )}

      {/* Step body. The page-level form state is owned by CreateBountyForm —
          we just provide the slot. */}
      <div data-testid="wizard-step-body">{children}</div>

      {/* Wizard footer — fixed at the viewport bottom on mobile and desktop
          so the action row is always reachable. On the final step we
          surface the total-reward readout to mirror the legacy
          FormSummaryFooter (Wave D may revise the total semantics).
          Order is Discard · Back · Draft · Next/Create — destructive on
          the far left so accidental thumb-taps on the right (the more
          common gesture) hit Save/Next instead. */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-glass-border">
        <div className="max-w-4xl mx-auto px-3 sm:px-0 py-2 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              icon={<Trash2 size={14} strokeWidth={2} />}
              text
              severity="danger"
              size="small"
              onClick={handleDiscardClick}
              aria-label="Discard"
              tooltip="Discard"
              tooltipOptions={{ position: 'top' }}
              disabled={isSubmitting || isSavingDraft}
            />
            <Button
              label="Back"
              icon={<ChevronLeft size={14} strokeWidth={2} />}
              outlined
              size="small"
              onClick={onBack}
              disabled={isFirstStep || isSubmitting || isSavingDraft}
            />
          </div>

          {/* Final-step total readout — visible only on the last step so
              non-final steps stay light. The breakdown subline appears
              when maxSubmissions > 1 so brands see how the multiplied
              total decomposes (per ADR 0013 §"Risks" #1: brand-facing
              total inflation must be visibly explained). */}
          {isLastStep && (
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <p className="font-mono tabular-nums text-sm font-semibold text-success-600 whitespace-nowrap">
                <span className="text-text-muted text-xs font-normal mr-1">Total {currencySymbol}</span>
                {totalRewardValue.toFixed(2)}
              </p>
              {(maxSubmissions ?? 0) > 1 && (
                <p className="font-mono tabular-nums text-[11px] text-text-muted whitespace-nowrap mt-0.5">
                  {maxSubmissions} × {currencySymbol}{perClaimRewardValue.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Button
              label="Save draft"
              outlined
              size="small"
              onClick={onSaveDraft}
              loading={isSavingDraft}
              disabled={isSubmitting}
            />
            {isLastStep ? (
              <Button
                label="Create bounty"
                icon={<Check size={14} strokeWidth={2} />}
                size="small"
                onClick={onCreate}
                loading={isSubmitting}
                disabled={isSavingDraft}
              />
            ) : (
              <Button
                label="Next"
                iconPos="right"
                icon={<ChevronRight size={14} strokeWidth={2} />}
                size="small"
                onClick={onNext}
                disabled={isSubmitting || isSavingDraft}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmAction
        visible={discardOpen}
        onHide={() => setDiscardOpen(false)}
        title={isEditMode ? 'Discard changes?' : 'Discard this bounty?'}
        message={
          isEditMode
            ? 'Unsaved edits will be lost. The saved draft will remain unchanged.'
            : 'You have not saved this bounty yet. All entered details will be lost.'
        }
        confirmLabel="Discard"
        confirmSeverity="danger"
        onConfirm={handleDiscardConfirm}
      />
    </>
  );
}
