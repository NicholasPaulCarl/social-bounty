'use client';

import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import type { EngagementRequirementsInput } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

interface ContentRulesSectionProps {
  aiContentPermitted: boolean;
  engagementRequirements: EngagementRequirementsInput;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  onBlur: (field: string) => void;
}

export function ContentRulesSection({
  aiContentPermitted,
  engagementRequirements,
  dispatch,
  errors,
  onBlur,
}: ContentRulesSectionProps) {
  return (
    <>
      <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
        <div>
          <span className="text-sm font-semibold text-on-surface">AI-Generated Content</span>
          <p className="text-xs text-on-surface-variant mt-0.5">Allow participants to use AI-generated content</p>
        </div>
        <InputSwitch
          checked={aiContentPermitted}
          onChange={(e) => dispatch({ type: 'SET_AI_CONTENT_PERMITTED', payload: e.value })}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant">
        <h4 className="text-sm font-semibold text-on-surface mb-3">Engagement Requirements</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="tagAccount" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Tag Account
            </label>
            <InputText
              id="tagAccount"
              value={engagementRequirements.tagAccount || ''}
              onChange={(e) => dispatch({ type: 'SET_TAG_ACCOUNT', payload: e.target.value })}
              onBlur={() => onBlur('tagAccount')}
              className={`w-full ${errors.tagAccount ? 'p-invalid' : ''}`}
              placeholder="@brandhandle"
            />
            {errors.tagAccount && (
              <small className="text-xs text-error mt-1 flex items-center gap-1">
                <i className="pi pi-exclamation-circle text-xs" />
                {errors.tagAccount}
              </small>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={engagementRequirements.mention || false}
                onChange={(e) => dispatch({ type: 'SET_MENTION', payload: e.checked ?? false })}
              />
              <label className="text-sm text-on-surface">Participant must mention brand</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={engagementRequirements.comment || false}
                onChange={(e) => dispatch({ type: 'SET_COMMENT', payload: e.checked ?? false })}
              />
              <label className="text-sm text-on-surface">Participant must leave a comment</label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
