'use client';

/**
 * Phase 3C — collapsible "Preview auto-verification rules" accordion that
 * lives inside the bounty create/edit form.
 *
 * Renders the same <VerificationReportPanel previewMode> the saved-bounty
 * detail pages render, but driven from in-flight form state via
 * derivePreviewChecks(BountyPreviewInput). The smaller input shape (added
 * in the same Phase 3C refactor) is what makes this possible — both the
 * saved BountyDetailResponse and BountyFormState structurally satisfy it.
 *
 * The accordion is closed by default so it doesn't crowd the form on first
 * paint. Brands open it to confirm what Apify will check on every submission
 * before they save. The preview updates live with form state — every keystroke
 * that changes a rule re-derives the checks (cheap pure function).
 *
 * Mobile: section heading uses sm: scale-up tokens to match the rest of the
 * form (DESIGN-SYSTEM.md §10 mobile-tightening checklist).
 */
import { useState } from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import { VerificationReportPanel } from '@/components/features/submission/VerificationReportPanel';
import {
  derivePreviewChecks,
  type BountyPreviewInput,
} from '@/lib/utils/bounty-preview-checks';

interface AutoVerifyPreviewAccordionProps {
  input: BountyPreviewInput;
}

export function AutoVerifyPreviewAccordion({ input }: AutoVerifyPreviewAccordionProps) {
  const [open, setOpen] = useState(false);
  const previewChecks = derivePreviewChecks(input);

  return (
    <div
      data-section="autoVerifyPreview"
      className="border border-glass-border rounded-lg bg-surface/50 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="auto-verify-preview-body"
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left hover:bg-elevated transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Shield size={16} strokeWidth={2} className="text-pink-600 shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base font-heading font-semibold text-text-primary truncate">
            Preview auto-verification rules
          </span>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id="auto-verify-preview-body"
          className="border-t border-glass-border p-3 sm:p-4 bg-bg-abyss"
        >
          <VerificationReportPanel
            previewMode
            audience="brand-form"
            previewChecks={previewChecks}
          />
        </div>
      )}
    </div>
  );
}
