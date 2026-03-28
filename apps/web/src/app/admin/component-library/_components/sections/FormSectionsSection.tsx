'use client';

import { ComponentDemo } from '../ComponentDemo';

const FORM_SECTIONS = [
  {
    name: 'ChannelSelectionSection',
    description: 'Multi-channel picker (Instagram, TikTok, Facebook) with post-format checkboxes per channel.',
    importPath: "import { ChannelSelectionSection } from '@/components/bounty-form/ChannelSelectionSection'",
    code: `<ChannelSelectionSection\n  channels={state.channels}\n  onChange={(channels) => dispatch({ type: 'SET_CHANNELS', channels })}\n/>`,
  },
  {
    name: 'ContentRulesSection',
    description: 'Textarea fields for content dos/don\'ts, required hashtags, mentions, and caption guidelines.',
    importPath: "import { ContentRulesSection } from '@/components/bounty-form/ContentRulesSection'",
    code: `<ContentRulesSection\n  rules={state.contentRules}\n  onChange={(rules) => dispatch({ type: 'SET_CONTENT_RULES', rules })}\n/>`,
  },
  {
    name: 'PostVisibilitySection',
    description: 'Visibility rules: must-not-remove toggle and minimum display duration picker.',
    importPath: "import { PostVisibilitySection } from '@/components/bounty-form/PostVisibilitySection'",
    code: `<PostVisibilitySection\n  visibility={state.postVisibility}\n  onChange={(v) => dispatch({ type: 'SET_POST_VISIBILITY', visibility: v })}\n/>`,
  },
  {
    name: 'RewardLinesSection',
    description: 'Dynamic reward line items with type, name, monetary value, and currency. Add/remove rows.',
    importPath: "import { RewardLinesSection } from '@/components/bounty-form/RewardLinesSection'",
    code: `<RewardLinesSection\n  rewards={state.rewards}\n  currency={state.currency}\n  onChange={(rewards) => dispatch({ type: 'SET_REWARDS', rewards })}\n/>`,
  },
  {
    name: 'EligibilityRulesSection',
    description: 'Participant eligibility: minimum followers, account age, geography, and verification requirements.',
    importPath: "import { EligibilityRulesSection } from '@/components/bounty-form/EligibilityRulesSection'",
    code: `<EligibilityRulesSection\n  eligibility={state.eligibility}\n  onChange={(e) => dispatch({ type: 'SET_ELIGIBILITY', eligibility: e })}\n/>`,
  },
  {
    name: 'ProofRequirementsSection',
    description: 'Define what proof participants must submit: screenshot, link, analytics, etc.',
    importPath: "import { ProofRequirementsSection } from '@/components/bounty-form/ProofRequirementsSection'",
    code: `<ProofRequirementsSection\n  proof={state.proofRequirements}\n  onChange={(p) => dispatch({ type: 'SET_PROOF', proof: p })}\n/>`,
  },
  {
    name: 'MaxSubmissionsSection',
    description: 'Set maximum number of submissions allowed for the bounty. Optional cap.',
    importPath: "import { MaxSubmissionsSection } from '@/components/bounty-form/MaxSubmissionsSection'",
    code: `<MaxSubmissionsSection\n  maxSubmissions={state.maxSubmissions}\n  onChange={(n) => dispatch({ type: 'SET_MAX_SUBMISSIONS', max: n })}\n/>`,
  },
  {
    name: 'ScheduleSection',
    description: 'Start and end date pickers for bounty lifecycle. Supports immediate start.',
    importPath: "import { ScheduleSection } from '@/components/bounty-form/ScheduleSection'",
    code: `<ScheduleSection\n  startDate={state.startDate}\n  endDate={state.endDate}\n  onChange={(dates) => dispatch({ type: 'SET_SCHEDULE', ...dates })}\n/>`,
  },
  {
    name: 'PayoutMetricsSection',
    description: 'Configure payout triggers: per-view thresholds, engagement minimums, flat-rate toggles.',
    importPath: "import { PayoutMetricsSection } from '@/components/bounty-form/PayoutMetricsSection'",
    code: `<PayoutMetricsSection\n  metrics={state.payoutMetrics}\n  onChange={(m) => dispatch({ type: 'SET_PAYOUT_METRICS', metrics: m })}\n/>`,
  },
  {
    name: 'BrandAssetsSection',
    description: 'File uploads for logos, mood boards, brand guidelines, and reference images.',
    importPath: "import { BrandAssetsSection } from '@/components/bounty-form/BrandAssetsSection'",
    code: `<BrandAssetsSection\n  assets={state.brandAssets}\n  onChange={(a) => dispatch({ type: 'SET_BRAND_ASSETS', assets: a })}\n/>`,
  },
];

export default function FormSectionsSection() {
  return (
    <div className="space-y-12">
      <div className="glass-card p-4 mb-4">
        <p className="text-sm text-text-secondary">
          <i className="pi pi-info-circle text-accent-cyan mr-2" />
          All 10 form sections live inside <code className="text-accent-violet text-xs font-mono">CreateBountyForm</code> and
          share state via <code className="text-accent-violet text-xs font-mono">useReducer</code>. They cannot be rendered
          standalone without the form context, so only code snippets are shown below.
        </p>
      </div>

      {FORM_SECTIONS.map((section) => (
        <ComponentDemo
          key={section.name}
          name={section.name}
          description={section.description}
          importPath={section.importPath}
          code={section.code}
        >
          <p className="text-text-muted text-sm italic">
            Requires CreateBountyForm context (useReducer state)
          </p>
        </ComponentDemo>
      ))}
    </div>
  );
}
