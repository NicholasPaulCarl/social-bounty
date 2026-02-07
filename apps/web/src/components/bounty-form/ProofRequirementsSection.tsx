'use client';

import { InputTextarea } from 'primereact/inputtextarea';
import type { BountyFormAction } from './types';

interface ProofRequirementsSectionProps {
  proofRequirements: string;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function ProofRequirementsSection({ proofRequirements, dispatch, errors, submitAttempted }: ProofRequirementsSectionProps) {
  return (
    <div>
      <label htmlFor="proofRequirements" className="block text-sm font-medium text-neutral-700 mb-1.5">
        Proof Requirements <span className="text-danger-500">*</span>
      </label>
      <InputTextarea
        id="proofRequirements"
        value={proofRequirements}
        onChange={(e) => dispatch({ type: 'SET_PROOF_REQUIREMENTS', payload: e.target.value })}
        rows={4}
        className={`w-full ${submitAttempted && errors.proofRequirements ? 'p-invalid' : ''}`}
        placeholder="Describe what proof participants must submit (e.g. screenshot, URL, photo)"
      />
      {submitAttempted && errors.proofRequirements && (
        <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-xs" />
          {errors.proofRequirements}
        </small>
      )}
    </div>
  );
}
