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
      {/* Desktop footer — Total Reward + Buttons right-aligned */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-0 py-3 flex items-center justify-end gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-text-muted uppercase tracking-wider">Total Reward</span>
            <p className="text-base font-heading font-semibold text-accent-emerald leading-tight">
              <span className="text-text-muted text-sm font-normal mr-1">{currencySymbol}</span>
              {totalRewardValue.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button label="Save as Draft" outlined onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
            <Button label="Create Bounty" icon="pi pi-check" onClick={onCreate} loading={isCreating} disabled={isSaving} />
          </div>
        </div>
      </div>

      {/*
        Mobile footer.
        pb uses max(12px, env(safe-area-inset-bottom)) so the Create button
        sits above the iOS home-indicator area on notched devices while still
        having a standard 12px bottom margin on everything else.
        Consumers must pad above this footer to prevent overlap — see
        CreateBountyForm for the matching pb-[calc()] class.
      */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
        <div className="flex justify-end mb-2">
          <div className="flex flex-col items-end">
            <span className="text-xs text-text-muted uppercase tracking-wider">Total Reward</span>
            <p className="text-sm font-heading font-semibold text-accent-emerald leading-tight">
              {currencySymbol} {totalRewardValue.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button label="Save as Draft" outlined className="text-sm" onClick={onSaveDraft} loading={isSaving} disabled={isCreating} />
          <Button label="Create" icon="pi pi-check" className="text-sm" onClick={onCreate} loading={isCreating} disabled={isSaving} />
        </div>
      </div>
    </>
  );
}
