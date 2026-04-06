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
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <i className={`pi ${icon} text-primary text-sm`} />
        </div>
        <span className="text-primary font-bold">{number}.</span>
        <span className="text-base font-bold text-on-surface font-headline">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {hasError && (
          <span className="material-symbols-outlined text-error" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
            error
          </span>
        )}
        {isComplete && !hasError && (
          <span className="material-symbols-outlined text-success" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Panel header={header}>
      {helperText && <p className="text-sm text-on-surface-variant mb-5">{helperText}</p>}
      <div className="space-y-5">{children}</div>
    </Panel>
  );
}
