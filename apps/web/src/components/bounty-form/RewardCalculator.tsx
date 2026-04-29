'use client';

import { Currency, RewardType } from '@social-bounty/shared';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.ZAR]: 'R',
  [Currency.USD]: '$',
  [Currency.GBP]: '£',
  [Currency.EUR]: '€',
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  [RewardType.CASH]: 'Cash',
  [RewardType.PRODUCT]: 'Product',
  [RewardType.SERVICE]: 'Service',
  [RewardType.OTHER]: 'Other',
};

export interface RewardCalculatorProps {
  currency: Currency;
  perClaimRewardValue: number;
  totalRewardValue: number;
  maxSubmissions: number | null;
  /** First reward's type for the breakdown row. */
  rewardType: RewardType | string;
}

/**
 * Sticky KPI sidebar for Step 4 (Claim & Rewards).
 *
 * Per ADR 0013 §1, the brand must see both the per-claim value (what one
 * approved hunter earns) and the total (what's escrowed on TradeSafe =
 * per-claim × claim count). This panel surfaces both prominently.
 *
 * Pure presentational — receives all values as props; no internal state.
 */
export function RewardCalculator({
  currency,
  perClaimRewardValue,
  totalRewardValue,
  maxSubmissions,
  rewardType,
}: RewardCalculatorProps) {
  const sym = CURRENCY_SYMBOLS[currency];
  const claims = maxSubmissions ?? 1;
  const rewardTypeLabel = REWARD_TYPE_LABELS[rewardType] ?? rewardType;

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-pink-200">
      {/* Header — pink-600→pink-700 gradient matching the brand gradient rule */}
      <div className="bg-gradient-to-br from-pink-600 to-pink-700 px-5 py-5 text-white">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-200 block mb-1">
          Total bounty value
        </span>
        <p className="font-mono tabular-nums text-4xl font-bold leading-none">
          <span className="text-2xl font-semibold mr-0.5 opacity-80">{sym}</span>
          {totalRewardValue.toFixed(2)}
        </p>
        <p className="text-sm text-pink-200 mt-2 font-medium">
          {claims}&nbsp;{claims === 1 ? 'claim' : 'claims'}&nbsp;&times;&nbsp;
          <span className="font-mono tabular-nums">
            {sym}{perClaimRewardValue.toFixed(2)}
          </span>
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-white px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Reward type</span>
          <span className="font-medium text-text-primary">{rewardTypeLabel}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Claims</span>
          <span className="font-mono tabular-nums font-medium text-text-primary">{claims}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Per claim</span>
          <span className="font-mono tabular-nums font-medium text-text-primary">
            {sym}{perClaimRewardValue.toFixed(2)}
          </span>
        </div>
        <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-sm">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-mono tabular-nums font-bold text-pink-600">
            {sym}{totalRewardValue.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
