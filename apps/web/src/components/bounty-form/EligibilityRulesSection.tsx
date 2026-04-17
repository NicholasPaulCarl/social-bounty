'use client';

import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
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
  const minFollowersEnabled = eligibility.minFollowers !== null && eligibility.minFollowers !== undefined;
  const minAccountAgeEnabled = eligibility.minAccountAgeDays !== null && eligibility.minAccountAgeDays !== undefined;
  const locationEnabled = eligibility.locationRestriction !== null && eligibility.locationRestriction !== undefined;
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

        {/* Location Restriction */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:min-w-[14rem]">
            <InputSwitch
              checked={locationEnabled}
              onChange={(e) => dispatch({ type: 'SET_LOCATION_RESTRICTION', payload: e.value ? '' : null })}
            />
            <span className="text-sm text-text-primary">Location Restriction</span>
          </div>
          {locationEnabled && (
            <InputText
              value={eligibility.locationRestriction || ''}
              onChange={(e) => dispatch({ type: 'SET_LOCATION_RESTRICTION', payload: e.target.value })}
              className={`w-full sm:flex-1 ${submitAttempted && errors.locationRestriction ? 'p-invalid' : ''}`}
              placeholder="e.g. South Africa, United States"
              maxLength={200}
            />
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
