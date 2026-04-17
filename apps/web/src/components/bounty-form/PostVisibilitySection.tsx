'use client';

import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
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
  const mustNotRemove = currentRule === PostVisibilityRule.MUST_NOT_REMOVE;
  const minDuration = currentRule === PostVisibilityRule.MINIMUM_DURATION;

  return (
    <div className="space-y-4">
      {/* Must not remove toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:min-w-[14rem]">
          <InputSwitch
            checked={mustNotRemove}
            onChange={(e) => dispatch({
              type: 'SET_VISIBILITY_RULE',
              payload: e.value ? PostVisibilityRule.MUST_NOT_REMOVE : null,
            })}
          />
          <span className="text-sm text-text-primary">Post must not be removed</span>
        </div>
      </div>

      {/* Minimum duration toggle */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:min-w-[14rem]">
          <InputSwitch
            checked={minDuration}
            onChange={(e) => dispatch({
              type: 'SET_VISIBILITY_RULE',
              payload: e.value ? PostVisibilityRule.MINIMUM_DURATION : null,
            })}
          />
          <span className="text-sm text-text-primary">Minimum posting duration</span>
        </div>
        {minDuration && (
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-end sm:gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-text-muted text-xs uppercase tracking-wider font-medium">
                Duration <span className="text-accent-rose">*</span>
              </label>
              <InputNumber
                value={postVisibility?.minDurationValue ?? null}
                onValueChange={(e) => dispatch({ type: 'SET_DURATION_VALUE', payload: e.value ?? null })}
                min={1}
                className={`w-full sm:w-28 ${submitAttempted && errors.durationValue ? 'p-invalid' : ''}`}
                placeholder="e.g. 7"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-text-muted text-xs uppercase tracking-wider font-medium">
                Unit <span className="text-accent-rose">*</span>
              </label>
              <Dropdown
                value={postVisibility?.minDurationUnit ?? null}
                options={DURATION_UNIT_OPTIONS}
                onChange={(e) => dispatch({ type: 'SET_DURATION_UNIT', payload: e.value })}
                className={`w-full sm:w-32 ${submitAttempted && errors.durationUnit ? 'p-invalid' : ''}`}
                placeholder="Unit"
              />
            </div>
          </div>
        )}
      </div>

      {/* Acknowledgment toggle */}
      {postVisibility && (
        <div className="flex items-center gap-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <InputSwitch
            checked={visibilityAcknowledged}
            onChange={(e) => dispatch({ type: 'SET_VISIBILITY_ACKNOWLEDGED', payload: e.value })}
          />
          <div>
            <span className="text-sm text-text-primary">I understand and confirm the post visibility requirements above</span>
            <p className="text-xs text-text-muted mt-0.5">
              This must be acknowledged before the bounty can be published.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
