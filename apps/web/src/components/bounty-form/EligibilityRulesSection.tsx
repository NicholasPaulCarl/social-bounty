'use client';

import { useState } from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Lock } from 'lucide-react';
import { BOUNTY_REWARD_LIMITS } from '@social-bounty/shared';
import type { StructuredEligibilityInput } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

interface EligibilityRulesSectionProps {
  eligibility: StructuredEligibilityInput;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function EligibilityRulesSection({ eligibility, dispatch, errors, submitAttempted }: EligibilityRulesSectionProps) {
  const [showLocationHint, setShowLocationHint] = useState(false);

  const minFollowersEnabled = eligibility.minFollowers !== null && eligibility.minFollowers !== undefined;
  const minAccountAgeEnabled = eligibility.minAccountAgeDays !== null && eligibility.minAccountAgeDays !== undefined;
  const noCompetingEnabled = eligibility.noCompetingBrandDays !== null && eligibility.noCompetingBrandDays !== undefined;

  return (
    <>
      <div className="space-y-4">
        {/* Min Followers */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:min-w-[14rem]">
            <InputSwitch
              checked={minFollowersEnabled}
              onChange={(e) => dispatch({ type: 'SET_MIN_FOLLOWERS', payload: e.value ? 500 : null })}
            />
            <span className="text-sm text-text-primary">Minimum Followers</span>
          </div>
          {minFollowersEnabled && (
            <InputNumber
              value={eligibility.minFollowers}
              onValueChange={(e) => dispatch({ type: 'SET_MIN_FOLLOWERS', payload: e.value ?? null })}
              min={1}
              className={`w-32 ${submitAttempted && errors.minFollowers ? 'p-invalid' : ''}`}
              placeholder="e.g. 500"
            />
          )}
        </div>

        {/* Public Profile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:min-w-[14rem]">
            <InputSwitch
              checked={eligibility.publicProfile || false}
              onChange={(e) => dispatch({ type: 'SET_PUBLIC_PROFILE', payload: e.value })}
            />
            <span className="text-sm text-text-primary">Public Profile Required</span>
          </div>
        </div>

        {/* Min Account Age */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:min-w-[14rem]">
            <InputSwitch
              checked={minAccountAgeEnabled}
              onChange={(e) => dispatch({ type: 'SET_MIN_ACCOUNT_AGE', payload: e.value ? 90 : null })}
            />
            <span className="text-sm text-text-primary">Minimum Account Age (days)</span>
          </div>
          {minAccountAgeEnabled && (
            <InputNumber
              value={eligibility.minAccountAgeDays}
              onValueChange={(e) => dispatch({ type: 'SET_MIN_ACCOUNT_AGE', payload: e.value ?? null })}
              min={1}
              className={`w-32 ${submitAttempted && errors.minAccountAgeDays ? 'p-invalid' : ''}`}
              placeholder="e.g. 90"
            />
          )}
        </div>

        {/* Location Restriction — hard-locked to South Africa (platform is SA-only) */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-sm text-text-primary sm:min-w-[14rem]">Location</span>
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-pink-300"
              onClick={() => setShowLocationHint((v) => !v)}
              onBlur={() => setShowLocationHint(false)}
              aria-label="Location locked to South Africa"
            >
              <Lock size={14} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 font-medium">South Africa</span>
              <Tag value="Locked" severity="secondary" className="text-xs ml-1" />
            </div>
          </div>
          {showLocationHint && (
            <p className="text-xs text-pink-700 mt-1 pl-0 sm:pl-[calc(14rem+1rem)]">
              More locations coming soon — sit tight, we&apos;re cooking.
            </p>
          )}
        </div>

        {/* No Competing Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:min-w-[14rem]">
            <InputSwitch
              checked={noCompetingEnabled}
              onChange={(e) => dispatch({ type: 'SET_NO_COMPETING_BRAND_DAYS', payload: e.value ? 30 : null })}
            />
            <span className="text-sm text-text-primary">No Competing Brand (days)</span>
          </div>
          {noCompetingEnabled && (
            <InputNumber
              value={eligibility.noCompetingBrandDays}
              onValueChange={(e) => dispatch({ type: 'SET_NO_COMPETING_BRAND_DAYS', payload: e.value ?? null })}
              min={1}
              className="w-32"
              placeholder="e.g. 30"
            />
          )}
        </div>
      </div>

    </>
  );
}
