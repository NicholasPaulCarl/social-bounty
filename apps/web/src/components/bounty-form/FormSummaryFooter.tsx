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

  return (
    <>
      {/* Desktop footer */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Reward</span>
              <p className="text-lg font-bold text-on-surface font-headline">
                <span className="text-on-surface-variant text-sm font-normal mr-1">{currencySymbol}</span>
                {totalRewardValue.toFixed(2)}
              </p>
            </div>
            <div className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">{completedSections}</span>/{totalSections} sections complete
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Reward</span>
            <p className="text-sm font-bold text-on-surface">
              {currencySymbol} {totalRewardValue.toFixed(2)}
            </p>
          </div>
          <span className="text-xs text-on-surface-variant">
            {completedSections}/{totalSections} complete
          </span>
        </div>
        <div className="flex gap-2">
          <Button label="Cancel" text severity="secondary" className="flex-1" onClick={onCancel} disabled={isSaving || isCreating} />
          <Button label="Draft" outlined className="flex-1" onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
          <Button label="Create" icon="pi pi-check" className="flex-1" onClick={onCreate} loading={isCreating} disabled={isSaving} />
        </div>
      </div>
    </>
  );
}
