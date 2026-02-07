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
  const customRules = eligibility.customRules || [];
  const minFollowersEnabled = eligibility.minFollowers !== null && eligibility.minFollowers !== undefined;
  const minAccountAgeEnabled = eligibility.minAccountAgeDays !== null && eligibility.minAccountAgeDays !== undefined;
  const locationEnabled = eligibility.locationRestriction !== null && eligibility.locationRestriction !== undefined;
  const noCompetingEnabled = eligibility.noCompetingBrandDays !== null && eligibility.noCompetingBrandDays !== undefined;

  return (
    <>
      <div className="space-y-4">
        {/* Min Followers */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[14rem]">
            <InputSwitch
              checked={minFollowersEnabled}
              onChange={(e) => dispatch({ type: 'SET_MIN_FOLLOWERS', payload: e.value ? 500 : null })}
            />
            <span className="text-sm text-neutral-700">Minimum Followers</span>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[14rem]">
            <InputSwitch
              checked={eligibility.publicProfile || false}
              onChange={(e) => dispatch({ type: 'SET_PUBLIC_PROFILE', payload: e.value })}
            />
            <span className="text-sm text-neutral-700">Public Profile Required</span>
          </div>
        </div>

        {/* Min Account Age */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[14rem]">
            <InputSwitch
              checked={minAccountAgeEnabled}
              onChange={(e) => dispatch({ type: 'SET_MIN_ACCOUNT_AGE', payload: e.value ? 90 : null })}
            />
            <span className="text-sm text-neutral-700">Minimum Account Age (days)</span>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[14rem]">
            <InputSwitch
              checked={locationEnabled}
              onChange={(e) => dispatch({ type: 'SET_LOCATION_RESTRICTION', payload: e.value ? '' : null })}
            />
            <span className="text-sm text-neutral-700">Location Restriction</span>
          </div>
          {locationEnabled && (
            <InputText
              value={eligibility.locationRestriction || ''}
              onChange={(e) => dispatch({ type: 'SET_LOCATION_RESTRICTION', payload: e.target.value })}
              className={`flex-1 ${submitAttempted && errors.locationRestriction ? 'p-invalid' : ''}`}
              placeholder="e.g. South Africa, United States"
              maxLength={200}
            />
          )}
        </div>

        {/* No Competing Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[14rem]">
            <InputSwitch
              checked={noCompetingEnabled}
              onChange={(e) => dispatch({ type: 'SET_NO_COMPETING_BRAND_DAYS', payload: e.value ? 30 : null })}
            />
            <span className="text-sm text-neutral-700">No Competing Brand (days)</span>
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

      {/* Custom Rules */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Custom Rules</h4>
        <div className="space-y-3">
          {customRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <InputText
                value={rule}
                onChange={(e) => dispatch({ type: 'UPDATE_CUSTOM_RULE', payload: { index, value: e.target.value } })}
                className={`flex-1 ${submitAttempted && errors[`customRule_${index}`] ? 'p-invalid' : ''}`}
                placeholder="Enter eligibility rule"
                maxLength={BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH}
              />
              <Button
                icon="pi pi-times"
                text
                severity="danger"
                size="small"
                onClick={() => dispatch({ type: 'REMOVE_CUSTOM_RULE', payload: index })}
              />
            </div>
          ))}
          <Button
            label="Add Rule"
            icon="pi pi-plus"
            outlined
            size="small"
            disabled={customRules.length >= BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES}
            onClick={() => dispatch({ type: 'ADD_CUSTOM_RULE' })}
          />
          {customRules.length >= BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES && (
            <small className="text-xs text-neutral-500">Maximum {BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES} custom rules</small>
          )}
        </div>
      </div>
    </>
  );
}
