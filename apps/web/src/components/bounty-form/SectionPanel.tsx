'use client';

import { Panel } from 'primereact/panel';
import type { ReactNode } from 'react';

interface SectionPanelProps {
  number: number;
  title: string;
  icon: string;
  isComplete: boolean;
  hasError: boolean;
  helperText: string;
  children: ReactNode;
}

export function SectionPanel({ number, title, icon, isComplete, hasError, helperText, children }: SectionPanelProps) {
  const header = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <i className={`pi ${icon} text-primary-600 text-sm`} />
        <span className="text-primary-600 font-bold">{number}.</span>
        <span className="text-base font-semibold text-neutral-800">{title}</span>
      </div>
      {hasError && <i className="pi pi-exclamation-circle text-danger-500" />}
      {isComplete && !hasError && <i className="pi pi-check-circle text-success-600" />}
    </div>
  );

  return (
    <Panel header={header} className="shadow-sm">
      <p className="text-sm text-neutral-500 mb-5">{helperText}</p>
      <div className="space-y-5">{children}</div>
    </Panel>
  );
}
