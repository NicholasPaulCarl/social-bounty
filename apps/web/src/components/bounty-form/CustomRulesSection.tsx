'use client';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { BOUNTY_REWARD_LIMITS } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

interface CustomRulesSectionProps {
  customRules: string[];
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function CustomRulesSection({ customRules, dispatch, errors, submitAttempted }: CustomRulesSectionProps) {
  return (
    <div className="mt-4 pt-4 border-t border-glass-border">
      <h4 className="text-sm font-semibold text-text-primary mb-1">Custom Rules</h4>
      <p className="text-xs text-text-muted mb-3">Add any additional rules specific to this bounty.</p>
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
          <small className="text-xs text-text-muted">Maximum {BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES} custom rules</small>
        )}
      </div>
    </div>
  );
}
