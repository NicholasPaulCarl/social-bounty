'use client';

import { Panel } from 'primereact/panel';
import type { ReactNode } from 'react';

interface SectionPanelProps {
  number: number;
  title: string;
  icon: string;
  isComplete: boolean;
  hasError: boolean;
  helperText?: string;
  children: ReactNode;
}

export function SectionPanel({ number, title, icon, isComplete, hasError, helperText, children }: SectionPanelProps) {
  const header = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <i className={`pi ${icon} text-accent-cyan text-sm`} />
        <span className="text-accent-cyan font-heading font-bold">{number}.</span>
        <span className="text-sm sm:text-base font-heading font-semibold text-text-primary">
          {title}
        </span>
      </div>
      {hasError && <i className="pi pi-exclamation-circle text-accent-rose" />}
      {isComplete && !hasError && <i className="pi pi-check-circle text-accent-emerald" />}
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
