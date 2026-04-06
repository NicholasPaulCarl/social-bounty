'use client';

import { RadioButton } from 'primereact/radiobutton';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { PostVisibilityRule, DurationUnit } from '@social-bounty/shared';
import type { PostVisibilityInput } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

const DURATION_UNIT_OPTIONS = [
  { label: 'Hours', value: DurationUnit.HOURS },
  { label: 'Days', value: DurationUnit.DAYS },
  { label: 'Weeks', value: DurationUnit.WEEKS },
];

interface PostVisibilitySectionProps {
  postVisibility: PostVisibilityInput | null;
  visibilityAcknowledged: boolean;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function PostVisibilitySection({
  postVisibility,
  visibilityAcknowledged,
  dispatch,
  errors,
  submitAttempted,
}: PostVisibilitySectionProps) {
  const currentRule = postVisibility?.rule ?? null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <RadioButton
            inputId="vis_must_not_remove"
            value={PostVisibilityRule.MUST_NOT_REMOVE}
            checked={currentRule === PostVisibilityRule.MUST_NOT_REMOVE}
            onChange={() => dispatch({ type: 'SET_VISIBILITY_RULE', payload: PostVisibilityRule.MUST_NOT_REMOVE })}
          />
          <label htmlFor="vis_must_not_remove" className="cursor-pointer">
            <span className="text-sm font-semibold text-on-surface">Must not remove</span>
            <span className="block text-xs text-on-surface-variant">Post must never be deleted</span>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <RadioButton
            inputId="vis_min_duration"
            value={PostVisibilityRule.MINIMUM_DURATION}
            checked={currentRule === PostVisibilityRule.MINIMUM_DURATION}
            onChange={() => dispatch({ type: 'SET_VISIBILITY_RULE', payload: PostVisibilityRule.MINIMUM_DURATION })}
          />
          <label htmlFor="vis_min_duration" className="cursor-pointer">
            <span className="text-sm font-semibold text-on-surface">Minimum duration</span>
            <span className="block text-xs text-on-surface-variant">Post must stay up for a set time</span>
          </label>
        </div>
      </div>

      {currentRule === PostVisibilityRule.MINIMUM_DURATION && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 ml-6">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Duration Value <span className="text-error">*</span>
            </label>
            <InputNumber
              value={postVisibility?.minDurationValue ?? null}
              onValueChange={(e) => dispatch({ type: 'SET_DURATION_VALUE', payload: e.value ?? null })}
              min={1}
              className={`w-full ${submitAttempted && errors.durationValue ? 'p-invalid' : ''}`}
              placeholder="e.g. 7"
            />
            {submitAttempted && errors.durationValue && (
              <small className="text-xs text-error mt-1 flex items-center gap-1">
                <i className="pi pi-exclamation-circle text-xs" />
                {errors.durationValue}
              </small>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Duration Unit <span className="text-error">*</span>
            </label>
            <Dropdown
              value={postVisibility?.minDurationUnit ?? null}
              options={DURATION_UNIT_OPTIONS}
              onChange={(e) => dispatch({ type: 'SET_DURATION_UNIT', payload: e.value })}
              className={`w-full ${submitAttempted && errors.durationUnit ? 'p-invalid' : ''}`}
              placeholder="Select unit"
            />
            {submitAttempted && errors.durationUnit && (
              <small className="text-xs text-error mt-1 flex items-center gap-1">
                <i className="pi pi-exclamation-circle text-xs" />
                {errors.durationUnit}
              </small>
            )}
          </div>
        </div>
      )}

      {postVisibility && (
        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={visibilityAcknowledged}
              onChange={(e) => dispatch({ type: 'SET_VISIBILITY_ACKNOWLEDGED', payload: e.checked ?? false })}
            />
            <label className="text-sm text-on-surface cursor-pointer">
              I understand and confirm the post visibility requirements above.
              <span className="block text-xs text-on-surface-variant mt-1">
                This must be acknowledged before the bounty can be published.
              </span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
