'use client';

import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Banknote, Box, Wrench, Gift, Trash2, Plus, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Currency, RewardType, BOUNTY_REWARD_LIMITS } from '@social-bounty/shared';
import type { RewardLineInput } from '@social-bounty/shared';
import type { BountyFormAction } from './types';
import { RewardCalculator } from './RewardCalculator';

const REWARD_TYPE_OPTIONS: { label: string; value: RewardType; Icon: LucideIcon; iconColor: string }[] = [
  { label: 'Cash', value: RewardType.CASH, Icon: Banknote, iconColor: 'text-success-600' },
  { label: 'Product', value: RewardType.PRODUCT, Icon: Box, iconColor: 'text-pink-600' },
  { label: 'Service', value: RewardType.SERVICE, Icon: Wrench, iconColor: 'text-warning-600' },
  { label: 'Other', value: RewardType.OTHER, Icon: Gift, iconColor: 'text-text-secondary' },
];

const CURRENCY_OPTIONS = [
  { label: 'ZAR (R)', value: Currency.ZAR },
  { label: 'USD ($)', value: Currency.USD },
  { label: 'GBP (\u00a3)', value: Currency.GBP },
  { label: 'EUR (\u20ac)', value: Currency.EUR },
];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.ZAR]: 'R',
  [Currency.USD]: '$',
  [Currency.GBP]: '\u00a3',
  [Currency.EUR]: '\u20ac',
};

interface RewardLinesSectionProps {
  rewards: RewardLineInput[];
  currency: Currency;
  /** Sum of reward line monetary values — what one approved hunter earns. */
  perClaimRewardValue: number;
  /** Per ADR 0013 §1: `perClaimRewardValue × maxSubmissions`. */
  totalRewardValue: number;
  /** Drives the "× N claims" multiplier label. Falls back to ×1 when null. */
  maxSubmissions: number | null;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function RewardLinesSection({
  rewards,
  currency,
  perClaimRewardValue,
  totalRewardValue,
  maxSubmissions,
  dispatch,
  errors,
  submitAttempted,
}: RewardLinesSectionProps) {
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const rewardTypeTemplate = (option: typeof REWARD_TYPE_OPTIONS[number]) => (
    <div className="flex items-center gap-2">
      <option.Icon size={16} strokeWidth={2} className={option.iconColor} />
      <span>{option.label}</span>
    </div>
  );

  const firstRewardType = rewards[0]?.rewardType ?? RewardType.CASH;

  return (
    /*
     * 2-column layout on lg+ (form left, sticky KPI sidebar right).
     * Collapses to 1 column below lg — KPI panel stacks on top of the form
     * inputs so mobile/tablet users see totals first then scroll to edit.
     */
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      {/* ── Left col: form inputs ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-text-primary">Currency</label>
          <Dropdown
            value={currency}
            options={CURRENCY_OPTIONS}
            onChange={(e) => dispatch({ type: 'SET_CURRENCY', payload: e.value })}
            className="w-40"
          />
        </div>

        <div className="mb-2">
          <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1">
            Rewards <span className="text-danger-600">*</span>
          </label>
          <p className="text-xs text-text-muted">
            At least one reward with a value greater than zero is required.
          </p>
        </div>

        {/* Desktop table layout */}
        <div className="hidden md:block border border-glass-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[10rem_1fr_9rem_3rem] gap-3 p-3 bg-elevated border-b border-glass-border">
            <span className="text-xs font-semibold text-text-secondary uppercase">Type</span>
            <span className="text-xs font-semibold text-text-secondary uppercase">Name</span>
            <span className="text-xs font-semibold text-text-secondary uppercase">Value ({currencySymbol})</span>
            <span />
          </div>
          {rewards.map((reward, index) => {
            const isCash = reward.rewardType === RewardType.CASH;
            return (
            <div
              key={index}
              className="grid grid-cols-[10rem_1fr_9rem_3rem] gap-3 p-3 border-b border-glass-border last:border-b-0 items-center"
            >
              <Dropdown
                value={reward.rewardType}
                options={REWARD_TYPE_OPTIONS}
                onChange={(e) => dispatch({ type: 'UPDATE_REWARD', payload: { index, field: 'rewardType', value: e.value } })}
                itemTemplate={rewardTypeTemplate}
                className="w-full"
              />
              {isCash ? (
                <span className="text-xs text-text-muted italic">No description needed for cash</span>
              ) : (
                <div>
                  <InputText
                    value={reward.name}
                    onChange={(e) => dispatch({ type: 'UPDATE_REWARD', payload: { index, field: 'name', value: e.target.value } })}
                    className={`w-full ${submitAttempted && errors[`reward_${index}_name`] ? 'p-invalid' : ''}`}
                    placeholder="e.g. 3-month gym membership"
                  />
                  {submitAttempted && errors[`reward_${index}_name`] && (
                    <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} strokeWidth={2} />
                      {errors[`reward_${index}_name`]}
                    </small>
                  )}
                </div>
              )}
              <div>
                <InputNumber
                  value={reward.monetaryValue || null}
                  onValueChange={(e) =>
                    dispatch({ type: 'UPDATE_REWARD', payload: { index, field: 'monetaryValue', value: e.value ?? 0 } })
                  }
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  min={0}
                  className={`w-full ${submitAttempted && errors[`reward_${index}_value`] ? 'p-invalid' : ''}`}
                  placeholder="0.00"
                />
                {submitAttempted && errors[`reward_${index}_value`] && (
                  <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} strokeWidth={2} />
                    {errors[`reward_${index}_value`]}
                  </small>
                )}
              </div>
              {rewards.length > 1 && (
                <Button
                  icon={<Trash2 size={14} strokeWidth={2} />}
                  text
                  severity="danger"
                  size="small"
                  onClick={() => dispatch({ type: 'REMOVE_REWARD', payload: index })}
                />
              )}
            </div>
            );
          })}
        </div>

        {/* Mobile card layout */}
        <div className="md:hidden space-y-3">
          {rewards.map((reward, index) => {
            const isCash = reward.rewardType === RewardType.CASH;
            return (
            <div key={index} className="space-y-3 p-4 border border-glass-border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-primary">Reward {index + 1}</span>
                {rewards.length > 1 && (
                  <Button
                    icon={<Trash2 size={14} strokeWidth={2} />}
                    text
                    severity="danger"
                    size="small"
                    onClick={() => dispatch({ type: 'REMOVE_REWARD', payload: index })}
                  />
                )}
              </div>
              <Dropdown
                value={reward.rewardType}
                options={REWARD_TYPE_OPTIONS}
                onChange={(e) => dispatch({ type: 'UPDATE_REWARD', payload: { index, field: 'rewardType', value: e.value } })}
                itemTemplate={rewardTypeTemplate}
                className="w-full"
              />
              {!isCash && (
                <InputText
                  value={reward.name}
                  onChange={(e) => dispatch({ type: 'UPDATE_REWARD', payload: { index, field: 'name', value: e.target.value } })}
                  className={`w-full ${submitAttempted && errors[`reward_${index}_name`] ? 'p-invalid' : ''}`}
                  placeholder="e.g. 3-month gym membership"
                />
              )}
              <InputNumber
                value={reward.monetaryValue || null}
                onValueChange={(e) =>
                  dispatch({ type: 'UPDATE_REWARD', payload: { index, field: 'monetaryValue', value: e.value ?? 0 } })
                }
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                min={0}
                className={`w-full ${submitAttempted && errors[`reward_${index}_value`] ? 'p-invalid' : ''}`}
                placeholder="0.00"
              />
            </div>
            );
          })}
        </div>

        {submitAttempted && errors.rewards && (
          <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
            <AlertCircle size={12} strokeWidth={2} />
            {errors.rewards}
          </small>
        )}

        <div className="flex items-center justify-between mt-3">
          <Button
            label="Add reward"
            icon={<Plus size={14} strokeWidth={2} />}
            outlined
            size="small"
            disabled={rewards.length >= BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES}
            onClick={() => dispatch({ type: 'ADD_REWARD' })}
          />
          {rewards.length >= BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES && (
            <small className="text-xs text-text-muted">Maximum {BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES} reward lines</small>
          )}
        </div>
      </div>

      {/* ── Right col: sticky KPI sidebar ─────────────────────── */}
      {/*
        Per ADR 0013 §1, the brand sees TWO numbers: per-claim (what one
        approved hunter earns) and total (what's escrowed on TradeSafe =
        per-claim × claim count). RewardCalculator surfaces both prominently
        and updates live as the brand changes per-claim value or claim count.
        On mobile/tablet (<lg) this column collapses to the top of the grid
        so the totals are visible without scrolling past the form.
      */}
      <div className="lg:sticky lg:top-24 order-first lg:order-last">
        <RewardCalculator
          currency={currency}
          perClaimRewardValue={perClaimRewardValue}
          totalRewardValue={totalRewardValue}
          maxSubmissions={maxSubmissions}
          rewardType={firstRewardType}
        />
      </div>
    </div>
  );
}
