'use client';

import { Panel } from 'primereact/panel';
import { Tag } from 'primereact/tag';
import type { ReactNode } from 'react';

interface SectionPanelProps {
  number: number;
  title: string;
  icon: string;
  isComplete: boolean;
  hasError: boolean;
  /**
   * When true the section has no required inputs — pill shows "Optional"
   * instead of "Required" / "Complete". If the user has added content
   * to an optional section, pass `hasContent` to flip the pill to
   * "Complete" as positive feedback.
   */
  optional?: boolean;
  hasContent?: boolean;
  helperText?: string;
  children: ReactNode;
}

export function SectionPanel({
  number,
  title,
  icon,
  isComplete,
  hasError,
  optional,
  hasContent,
  helperText,
  children,
}: SectionPanelProps) {
  // Status pill replaces the prior check-circle / exclamation icons.
  // Shown from page-load (not gated on submit-attempted) so brands
  // see which sections still need input before they try to publish.
  //   - Required section:  "Required" (muted) → "Complete" (green)
  //   - Optional section:  "Optional" (info)  → "Complete" (green) if
  //                        the consumer passes hasContent=true
  const done = optional ? hasContent : isComplete && !hasError;
  const label = done ? 'Complete' : optional ? 'Optional' : 'Required';
  const severity: 'success' | 'info' | 'secondary' = done
    ? 'success'
    : optional
      ? 'info'
      : 'secondary';
  const statusTag = (
    <Tag value={label} severity={severity} className="text-xs px-2 py-0.5" />
  );

  const header = (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <i className={`pi ${icon} text-accent-cyan text-sm`} />
        <span className="text-accent-cyan font-heading font-bold">{number}.</span>
        <span className="text-sm sm:text-base font-heading font-semibold text-text-primary truncate">
          {title}
        </span>
      </div>
      {statusTag}
    </div>
  );

  return (
    <Panel header={header} className="bounty-section-panel">
      {helperText && (
        <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-5">{helperText}</p>
      )}
      <div className="space-y-4 sm:space-y-5">{children}</div>
    </Panel>
  );
}
