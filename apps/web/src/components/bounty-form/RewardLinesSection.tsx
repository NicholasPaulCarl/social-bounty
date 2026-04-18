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
  totalRewardValue: number;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function RewardLinesSection({
  rewards,
  currency,
  totalRewardValue,
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

  return (
    <>
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

      <div className="flex justify-end mt-4">
        <div className="text-right">
          <span className="eyebrow">Total reward value</span>
          <p className="font-mono tabular-nums text-lg font-bold text-text-primary mt-0.5">
            <span className="text-text-muted text-base font-normal mr-1">{currencySymbol}</span>
            {totalRewardValue.toFixed(2)}
          </p>
        </div>
      </div>
    </>
  );
}
