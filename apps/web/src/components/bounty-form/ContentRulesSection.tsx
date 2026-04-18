'use client';

import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { AlertCircle } from 'lucide-react';
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
      <div className="flex items-center justify-between p-3 bg-elevated rounded-lg">
        <div>
          <span className="text-sm font-medium text-text-primary">AI-Generated Content</span>
          <p className="text-xs text-text-muted mt-0.5">Allow Hunters to use AI-generated content</p>
        </div>
        <InputSwitch
          checked={aiContentPermitted}
          onChange={(e) => dispatch({ type: 'SET_AI_CONTENT_PERMITTED', payload: e.value })}
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Engagement Requirements</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="tagAccount" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
              <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} strokeWidth={2} />
                {errors.tagAccount}
              </small>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="engagement-mention"
                checked={engagementRequirements.mention || false}
                onChange={(e) => dispatch({ type: 'SET_MENTION', payload: e.checked ?? false })}
              />
              <label htmlFor="engagement-mention" className="text-sm text-text-primary cursor-pointer">Hunter must mention brand</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                inputId="engagement-comment"
                checked={engagementRequirements.comment || false}
                onChange={(e) => dispatch({ type: 'SET_COMMENT', payload: e.checked ?? false })}
              />
              <label htmlFor="engagement-comment" className="text-sm text-text-primary cursor-pointer">Hunter must leave a comment</label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
