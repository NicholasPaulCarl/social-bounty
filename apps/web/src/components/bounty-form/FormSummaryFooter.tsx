'use client';

import { Button } from 'primereact/button';
import { Currency } from '@social-bounty/shared';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.ZAR]: 'R',
  [Currency.USD]: '$',
  [Currency.GBP]: '\u00a3',
  [Currency.EUR]: '\u20ac',
};

interface FormSummaryFooterProps {
  currency: Currency;
  totalRewardValue: number;
  completedSections: number;
  totalSections: number;
  onCancel: () => void;
  onSaveDraft: () => void;
  onCreate: () => void;
  isSaving: boolean;
  isCreating: boolean;
}

export function FormSummaryFooter({
  currency,
  totalRewardValue,
  completedSections,
  totalSections,
  onCancel,
  onSaveDraft,
  onCreate,
  isSaving,
  isCreating,
}: FormSummaryFooterProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const progressPct = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  return (
    <>
      {/* Desktop footer */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-glass-border">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-text-muted uppercase tracking-wider">Total Reward</span>
              <p className="text-base font-heading font-semibold text-accent-emerald">
                <span className="text-text-muted text-sm font-normal mr-1">{currencySymbol}</span>
                {totalRewardValue.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-cyan rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-sm text-text-muted">
                <span className="font-medium text-text-secondary">{completedSections}</span>/{totalSections}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button label="Cancel" text severity="secondary" onClick={onCancel} disabled={isSaving || isCreating} />
            <Button label="Save as Draft" outlined onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
            <Button label="Create Bounty" icon="pi pi-check" onClick={onCreate} loading={isCreating} disabled={isSaving} />
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-glass-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-text-muted">Total Reward</span>
            <p className="text-sm font-heading font-semibold text-accent-emerald">
              {currencySymbol} {totalRewardValue.toFixed(2)}
            </p>
          </div>
          <span className="text-xs text-text-muted">
            {completedSections}/{totalSections} complete
          </span>
        </div>
        <div className="flex gap-2">
          <Button label="Cancel" text severity="secondary" className="flex-1 text-sm" onClick={onCancel} disabled={isSaving || isCreating} />
          <Button label="Draft" outlined className="flex-1 text-sm" onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
          <Button label="Create" icon="pi pi-check" className="flex-1 text-sm" onClick={onCreate} loading={isCreating} disabled={isSaving} />
        </div>
      </div>
    </>
  );
}
