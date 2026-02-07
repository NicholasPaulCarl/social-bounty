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
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider">Total Reward</span>
              <p className="text-base font-semibold text-neutral-900">
                <span className="text-neutral-500 text-sm font-normal mr-1">{currencySymbol}</span>
                {totalRewardValue.toFixed(2)}
              </p>
            </div>
            <div className="text-sm text-neutral-500">
              <span className="font-medium text-neutral-700">{completedSections}</span>/{totalSections} sections complete
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-neutral-500">Total Reward</span>
            <p className="text-sm font-semibold text-neutral-900">
              {currencySymbol} {totalRewardValue.toFixed(2)}
            </p>
          </div>
          <span className="text-xs text-neutral-500">
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
