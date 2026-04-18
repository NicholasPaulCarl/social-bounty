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
  onSaveDraft: () => void;
  onCreate: () => void;
  isSaving: boolean;
  isCreating: boolean;
}

export function FormSummaryFooter({
  currency,
  totalRewardValue,
  onSaveDraft,
  onCreate,
  isSaving,
  isCreating,
}: FormSummaryFooterProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  return (
    <>
      {/* Desktop footer — label left, amount + buttons right */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-0 py-2 flex items-center justify-between gap-6">
          <span className="text-xs text-text-muted uppercase tracking-wider">Total Reward</span>
          <div className="flex items-center gap-6">
            <p className="text-base font-heading font-semibold text-success-600 leading-tight whitespace-nowrap">
              <span className="text-text-muted text-sm font-normal mr-1">{currencySymbol}</span>
              {totalRewardValue.toFixed(2)}
            </p>
            <div className="flex items-center gap-3">
              <Button label="Save as Draft" outlined onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
              <Button label="Create Bounty" icon="pi pi-check" onClick={onCreate} loading={isCreating} disabled={isSaving} />
            </div>
          </div>
        </div>
      </div>

      {/*
        Mobile footer — single row.
        Amount on the left, Draft + Create buttons on the right. The
        previous two-row design (status row + button row) was the source
        of the chunky height; collapsing to one row drops the bg from
        ~74px to ~52px on non-notch devices while preserving the 44px
        button tap targets.

        pb uses max(8px, env(safe-area-inset-bottom)) so the Create button
        stays clear of the iOS home-indicator area on notched devices while
        rendering at a tight 8px on everything else.
      */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl px-3 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-heading font-semibold text-success-600 leading-none whitespace-nowrap shrink-0">
            {currencySymbol} {totalRewardValue.toFixed(2)}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button label="Draft" outlined className="text-sm" onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
            <Button label="Create" icon="pi pi-check" className="text-sm" onClick={onCreate} loading={isCreating} disabled={isSaving} />
          </div>
        </div>
      </div>
    </>
  );
}
