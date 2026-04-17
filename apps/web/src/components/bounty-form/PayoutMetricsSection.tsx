'use client';

import { InputNumber } from 'primereact/inputnumber';
import { PAYOUT_METRICS_LIMITS } from '@social-bounty/shared';
import type { PayoutMetricsInput } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

interface PayoutMetricsSectionProps {
  payoutMetrics: PayoutMetricsInput;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function PayoutMetricsSection({ payoutMetrics, dispatch, errors, submitAttempted }: PayoutMetricsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-1">Payout Metrics</h4>
        <p className="text-xs text-text-muted mb-3">Set minimum engagement thresholds that submissions must reach.</p>
      </div>

      <div>
        <label htmlFor="minViews" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
          Minimum Views
        </label>
        <div className="stepper-horizontal">
          <InputNumber
            id="minViews"
            value={payoutMetrics.minViews ?? null}
            onValueChange={(e) => dispatch({ type: 'SET_MIN_VIEWS', payload: e.value ?? null })}
            min={0}
            max={PAYOUT_METRICS_LIMITS.MAX_VIEWS}
            showButtons
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            inputClassName="w-28 text-center"
            className={submitAttempted && errors.minViews ? 'p-invalid' : ''}
            placeholder="No minimum"
          />
        </div>
        <small className="text-xs text-text-muted mt-1.5 block">Leave empty if no view threshold is required</small>
        {submitAttempted && errors.minViews && (
          <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {errors.minViews}
          </small>
        )}
      </div>

      <div>
        <label htmlFor="minLikes" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
          Minimum Likes
        </label>
        <div className="stepper-horizontal">
          <InputNumber
            id="minLikes"
            value={payoutMetrics.minLikes ?? null}
            onValueChange={(e) => dispatch({ type: 'SET_MIN_LIKES', payload: e.value ?? null })}
            min={0}
            max={PAYOUT_METRICS_LIMITS.MAX_LIKES}
            showButtons
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            inputClassName="w-28 text-center"
            className={submitAttempted && errors.minLikes ? 'p-invalid' : ''}
            placeholder="No minimum"
          />
        </div>
        <small className="text-xs text-text-muted mt-1.5 block">Leave empty if no like threshold is required</small>
        {submitAttempted && errors.minLikes && (
          <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {errors.minLikes}
          </small>
        )}
      </div>

      <div>
        <label htmlFor="minComments" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
          Minimum Comments
        </label>
        <div className="stepper-horizontal">
          <InputNumber
            id="minComments"
            value={payoutMetrics.minComments ?? null}
            onValueChange={(e) => dispatch({ type: 'SET_MIN_COMMENTS', payload: e.value ?? null })}
            min={0}
            max={PAYOUT_METRICS_LIMITS.MAX_COMMENTS}
            showButtons
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            inputClassName="w-28 text-center"
            className={submitAttempted && errors.minComments ? 'p-invalid' : ''}
            placeholder="No minimum"
          />
        </div>
        <small className="text-xs text-text-muted mt-1.5 block">Leave empty if no comment threshold is required</small>
        {submitAttempted && errors.minComments && (
          <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {errors.minComments}
          </small>
        )}
      </div>
    </div>
  );
}
