'use client';

import { InputNumber } from 'primereact/inputnumber';
import type { BountyFormAction } from './types';

interface MaxSubmissionsSectionProps {
  maxSubmissions: number | null;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function MaxSubmissionsSection({ maxSubmissions, dispatch, errors, submitAttempted }: MaxSubmissionsSectionProps) {
  return (
    <div>
      <label htmlFor="maxSubmissions" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
        Maximum Submissions
      </label>
      <InputNumber
        id="maxSubmissions"
        value={maxSubmissions}
        onValueChange={(e) => dispatch({ type: 'SET_MAX_SUBMISSIONS', payload: e.value ?? null })}
        min={1}
        showButtons
        buttonLayout="horizontal"
        incrementButtonIcon="pi pi-plus"
        decrementButtonIcon="pi pi-minus"
        className={`w-48 ${submitAttempted && errors.maxSubmissions ? 'p-invalid' : ''}`}
        placeholder="Unlimited"
      />
      <small className="text-xs text-on-surface-variant mt-1 block">Leave empty for unlimited submissions</small>
      {submitAttempted && errors.maxSubmissions && (
        <small className="text-xs text-error mt-1 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-xs" />
          {errors.maxSubmissions}
        </small>
      )}
    </div>
  );
}
