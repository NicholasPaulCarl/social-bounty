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
  disableStartDate?: boolean;
}

export function ScheduleSection({ startDate, endDate, dispatch, errors, submitAttempted, onBlur, disableStartDate }: ScheduleSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={disableStartDate ? 'opacity-60 pointer-events-none' : ''}>
        <label htmlFor="startDate" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
          Start Date {disableStartDate && <span className="text-text-muted text-[10px] normal-case">(locked)</span>}
        </label>
        <Calendar
          id="startDate"
          value={startDate}
          onChange={(e) => dispatch({ type: 'SET_START_DATE', payload: e.value ?? null })}
          showTime
          className="w-full"
          placeholder="Optional"
          minDate={new Date()}
          disabled={disableStartDate}
        />
        <small className="text-xs text-text-muted mt-1 block">When the bounty becomes available</small>
      </div>
      <div>
        <label htmlFor="endDate" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
        <small className="text-xs text-text-muted mt-1 block">When the bounty closes for submissions</small>
        {errors.endDate && (
          <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {errors.endDate}
          </small>
        )}
      </div>
    </div>
  );
}
