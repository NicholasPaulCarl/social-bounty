'use client';

import { Checkbox } from 'primereact/checkbox';
import type { BountyFormAction } from './types';

interface ProofRequirementsSectionProps {
  proofRequirements: string[];
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function ProofRequirementsSection({ proofRequirements, dispatch, errors, submitAttempted }: ProofRequirementsSectionProps) {
  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
        Proof Requirements <span className="text-danger-600">*</span>
      </label>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            inputId="proof-url"
            checked={proofRequirements.includes('url')}
            onChange={() => dispatch({ type: 'TOGGLE_PROOF_REQUIREMENT', payload: 'url' })}
          />
          <label htmlFor="proof-url" className="text-sm text-text-primary cursor-pointer">
            URL link
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            inputId="proof-screenshot"
            checked={proofRequirements.includes('screenshot')}
            onChange={() => dispatch({ type: 'TOGGLE_PROOF_REQUIREMENT', payload: 'screenshot' })}
          />
          <label htmlFor="proof-screenshot" className="text-sm text-text-primary cursor-pointer">
            Screenshot
          </label>
        </div>
      </div>
      {submitAttempted && errors.proofRequirements && (
        <small className="text-xs text-danger-600 mt-2 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-xs" />
          {errors.proofRequirements}
        </small>
      )}
    </div>
  );
}
