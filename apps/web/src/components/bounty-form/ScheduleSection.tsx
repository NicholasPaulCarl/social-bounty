'use client';

import { Calendar } from 'primereact/calendar';
import type { BountyFormAction } from './types';

interface ScheduleSectionProps {
  startDate: Date | null;
  endDate: Date | null;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
  onBlur: (field: string) => void;
}

export function ScheduleSection({ startDate, endDate, dispatch, errors, submitAttempted, onBlur }: ScheduleSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="startDate" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
          Start Date
        </label>
        <Calendar
          id="startDate"
          value={startDate}
          onChange={(e) => dispatch({ type: 'SET_START_DATE', payload: e.value ?? null })}
          showTime
          className="w-full"
          placeholder="Optional"
          minDate={new Date()}
        />
        <small className="text-xs text-on-surface-variant mt-1 block">When the bounty becomes available</small>
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
          End Date
        </label>
        <Calendar
          id="endDate"
          value={endDate}
          onChange={(e) => dispatch({ type: 'SET_END_DATE', payload: e.value ?? null })}
          onBlur={() => onBlur('endDate')}
          showTime
          className={`w-full ${(submitAttempted || errors.endDate) ? errors.endDate ? 'p-invalid' : '' : ''}`}
          placeholder="Optional"
          minDate={startDate || new Date()}
        />
        <small className="text-xs text-on-surface-variant mt-1 block">When the bounty closes for submissions</small>
        {errors.endDate && (
          <small className="text-xs text-error mt-1 flex items-center gap-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {errors.endDate}
          </small>
        )}
      </div>
    </div>
  );
}
