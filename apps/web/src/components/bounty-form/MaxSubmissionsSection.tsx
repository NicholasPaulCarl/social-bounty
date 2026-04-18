'use client';

import { InputNumber } from 'primereact/inputnumber';
import { Plus, Minus, AlertCircle } from 'lucide-react';
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
      <label htmlFor="maxSubmissions" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
        Maximum Submissions
      </label>
      <div className="stepper-horizontal">
        <InputNumber
          id="maxSubmissions"
          value={maxSubmissions}
          onValueChange={(e) => dispatch({ type: 'SET_MAX_SUBMISSIONS', payload: e.value ?? null })}
          min={1}
          showButtons
          buttonLayout="horizontal"
          incrementButtonIcon={<Plus size={14} strokeWidth={2} />}
          decrementButtonIcon={<Minus size={14} strokeWidth={2} />}
          inputClassName="w-28 text-center"
          className={submitAttempted && errors.maxSubmissions ? 'p-invalid' : ''}
          placeholder="Unlimited"
        />
      </div>
      <small className="text-xs text-text-muted mt-1.5 block">Leave empty for unlimited submissions</small>
      {submitAttempted && errors.maxSubmissions && (
        <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
          <AlertCircle size={12} strokeWidth={2} />
          {errors.maxSubmissions}
        </small>
      )}
    </div>
  );
}
