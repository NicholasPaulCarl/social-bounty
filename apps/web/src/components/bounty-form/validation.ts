import {
  FIELD_LIMITS,
  BOUNTY_REWARD_LIMITS,
  PAYOUT_METRICS_LIMITS,
  CHANNEL_POST_FORMATS,
  PostVisibilityRule,
  RewardType,
  SocialChannel,
  PostFormat,
} from '@social-bounty/shared';
import type { BountyFormState } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasChannelSelection(state: BountyFormState): boolean {
  const keys = Object.keys(state.channels) as SocialChannel[];
  return keys.some((ch) => {
    const formats = state.channels[ch];
    return formats && formats.length > 0;
  });
}

function channelFormatErrors(state: BountyFormState): Record<string, string> {
  const errs: Record<string, string> = {};
  const keys = Object.keys(state.channels) as SocialChannel[];
  for (const ch of keys) {
    const formats = state.channels[ch];
    if (!formats || formats.length === 0) {
      errs[`channel_${ch}`] = `Select at least one post format for ${ch}`;
    } else {
      const allowed = CHANNEL_POST_FORMATS[ch];
      for (const f of formats) {
        if (!allowed.includes(f as PostFormat)) {
          errs[`channel_${ch}_${f}`] = `${f} is not a valid format for ${ch}`;
        }
      }
    }
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Draft validation - only title required
// ---------------------------------------------------------------------------

export function validateDraft(state: BountyFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.title.trim()) {
    errors.title = 'Title is required';
  } else if (state.title.length > FIELD_LIMITS.BOUNTY_TITLE_MAX) {
    errors.title = `Title must be at most ${FIELD_LIMITS.BOUNTY_TITLE_MAX} characters`;
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Full validation - all required fields for "Create Bounty"
// ---------------------------------------------------------------------------

export function validateFull(state: BountyFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  // --- Section 1: Basic Info ---
  if (!state.title.trim()) {
    errors.title = 'Title is required';
  } else if (state.title.length > FIELD_LIMITS.BOUNTY_TITLE_MAX) {
    errors.title = `Title must be at most ${FIELD_LIMITS.BOUNTY_TITLE_MAX} characters`;
  }

  if (!state.shortDescription.trim()) {
    errors.shortDescription = 'Short description is required';
  } else if (state.shortDescription.length > FIELD_LIMITS.SHORT_DESCRIPTION_MAX) {
    errors.shortDescription = `Short description must be at most ${FIELD_LIMITS.SHORT_DESCRIPTION_MAX} characters`;
  }

  const hasSteps = state.instructionSteps.some((s) => s.trim());
  if (!hasSteps && !state.fullInstructions.trim()) {
    errors.fullInstructions = 'At least one instruction step is required';
  }

  // --- Section 1 cont: Channels ---
  if (!hasChannelSelection(state)) {
    errors.channels = 'At least one channel with a post format is required';
  } else {
    const chErrors = channelFormatErrors(state);
    Object.assign(errors, chErrors);
  }

  // --- Section 3: Engagement requirements ---
  if (state.engagementRequirements.tagAccount) {
    const tag = state.engagementRequirements.tagAccount;
    if (!tag.startsWith('@')) {
      errors.tagAccount = 'Tag account must start with @';
    } else if (!/^@[a-zA-Z0-9_.]{1,99}$/.test(tag)) {
      errors.tagAccount = 'Tag account format is invalid';
    }
  }

  // --- Section 4: Post Visibility ---
  if (state.postVisibility) {
    if (state.postVisibility.rule === PostVisibilityRule.MINIMUM_DURATION) {
      if (!state.postVisibility.minDurationValue || state.postVisibility.minDurationValue < 1) {
        errors.durationValue = 'Duration value is required and must be at least 1';
      }
      if (!state.postVisibility.minDurationUnit) {
        errors.durationUnit = 'Duration unit is required';
      }
    }
  }

  // --- Section 5: Rewards ---
  // CASH rewards skip the name check — the reducer auto-fills name='Cash'
  // and the UI hides the input (the value + currency is self-describing).
  if (state.rewards.length === 0) {
    errors.rewards = 'At least one reward is required';
  } else {
    state.rewards.forEach((reward, i) => {
      if (reward.rewardType !== RewardType.CASH) {
        if (!reward.name.trim()) {
          errors[`reward_${i}_name`] = 'Reward name is required';
        } else if (reward.name.length > BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX) {
          errors[`reward_${i}_name`] = `Reward name must be at most ${BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX} characters`;
        }
      }
      if (!reward.monetaryValue || reward.monetaryValue <= 0) {
        errors[`reward_${i}_value`] = 'Reward value must be greater than 0';
      }
    });
  }

  // --- Section 6: Eligibility ---
  if (state.structuredEligibility.minFollowers !== null && state.structuredEligibility.minFollowers !== undefined) {
    if (state.structuredEligibility.minFollowers < 1) {
      errors.minFollowers = 'Minimum followers must be at least 1';
    }
  }
  if (state.structuredEligibility.minAccountAgeDays !== null && state.structuredEligibility.minAccountAgeDays !== undefined) {
    if (state.structuredEligibility.minAccountAgeDays < 1) {
      errors.minAccountAgeDays = 'Minimum account age must be at least 1 day';
    }
  }
  if (state.structuredEligibility.locationRestriction) {
    if (state.structuredEligibility.locationRestriction.length > 200) {
      errors.locationRestriction = 'Location restriction must be at most 200 characters';
    }
  }
  if (state.structuredEligibility.customRules) {
    if (state.structuredEligibility.customRules.length > BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES) {
      errors.customRules = `Maximum ${BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES} custom rules allowed`;
    }
    state.structuredEligibility.customRules.forEach((rule, i) => {
      if (!rule.trim()) {
        errors[`customRule_${i}`] = 'Custom rule cannot be empty';
      } else if (rule.length > BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH) {
        errors[`customRule_${i}`] = `Custom rule must be at most ${BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH} characters`;
      }
    });
  }

  // --- Section 7: Proof Requirements ---
  if (state.proofRequirements.length === 0) {
    errors.proofRequirements = 'At least one proof requirement is required';
  }

  // --- Section 8: Max Submissions ---
  // Required at full validation time per ADR 0013 §2 — the funding service
  // (`tradesafe-payments.service.ts:147-151`) rejects null at the API
  // boundary, and the wizard's "Create Bounty" flow goes straight into
  // funding. Without this gate the brand sees a generic "couldn't start
  // funding" toast instead of an inline form error. Draft mode does NOT
  // enforce this — drafts can be saved with maxSubmissions still pending.
  if (state.maxSubmissions == null) {
    errors.maxSubmissions = 'Number of claims is required';
  } else if (state.maxSubmissions < 1) {
    errors.maxSubmissions = 'Max submissions must be at least 1';
  }

  // --- Section 9: Schedule ---
  if (state.startDate && state.endDate && state.endDate <= state.startDate) {
    errors.endDate = 'End date must be after start date';
  }

  // --- Section 10: Payout Metrics ---
  if (state.payoutMetrics.minViews !== null && state.payoutMetrics.minViews !== undefined) {
    if (state.payoutMetrics.minViews < 0) {
      errors.minViews = 'Minimum views cannot be negative';
    } else if (state.payoutMetrics.minViews > PAYOUT_METRICS_LIMITS.MAX_VIEWS) {
      errors.minViews = `Minimum views cannot exceed ${PAYOUT_METRICS_LIMITS.MAX_VIEWS.toLocaleString()}`;
    }
  }
  if (state.payoutMetrics.minLikes !== null && state.payoutMetrics.minLikes !== undefined) {
    if (state.payoutMetrics.minLikes < 0) {
      errors.minLikes = 'Minimum likes cannot be negative';
    } else if (state.payoutMetrics.minLikes > PAYOUT_METRICS_LIMITS.MAX_LIKES) {
      errors.minLikes = `Minimum likes cannot exceed ${PAYOUT_METRICS_LIMITS.MAX_LIKES.toLocaleString()}`;
    }
  }
  if (state.payoutMetrics.minComments !== null && state.payoutMetrics.minComments !== undefined) {
    if (state.payoutMetrics.minComments < 0) {
      errors.minComments = 'Minimum comments cannot be negative';
    } else if (state.payoutMetrics.minComments > PAYOUT_METRICS_LIMITS.MAX_COMMENTS) {
      errors.minComments = `Minimum comments cannot exceed ${PAYOUT_METRICS_LIMITS.MAX_COMMENTS.toLocaleString()}`;
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Single-field validation (for on-blur)
// ---------------------------------------------------------------------------

export function validateField(field: string, state: BountyFormState): string | null {
  switch (field) {
    case 'title':
      if (!state.title.trim()) return 'Title is required';
      if (state.title.length > FIELD_LIMITS.BOUNTY_TITLE_MAX) return `Title must be at most ${FIELD_LIMITS.BOUNTY_TITLE_MAX} characters`;
      return null;
    case 'shortDescription':
      if (state.shortDescription.length > FIELD_LIMITS.SHORT_DESCRIPTION_MAX)
        return `Short description must be at most ${FIELD_LIMITS.SHORT_DESCRIPTION_MAX} characters`;
      return null;
    case 'tagAccount': {
      const tag = state.engagementRequirements.tagAccount;
      if (tag && !tag.startsWith('@')) return 'Tag account must start with @';
      if (tag && !/^@[a-zA-Z0-9_.]{1,99}$/.test(tag)) return 'Tag account format is invalid';
      return null;
    }
    case 'endDate':
      if (state.startDate && state.endDate && state.endDate <= state.startDate)
        return 'End date must be after start date';
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Section completion check
// ---------------------------------------------------------------------------

export function getSectionErrors(sectionKey: string, errors: Record<string, string>): string[] {
  const errorKeys = Object.keys(errors);
  switch (sectionKey) {
    case 'bountyBasicInfo':
      // Note: 'fullInstructions' (instruction-step errors) moved to step 1
      // (bountyRules) in bounty-wizard-design-align — InstructionStepsBuilder
      // now renders on Step 2 (Instructions & Metrics), not Step 0 (Basics).
      return errorKeys.filter((k) =>
        ['title', 'shortDescription', 'channels',
         'startDate', 'endDate'].includes(k) ||
        k.startsWith('channel_'),
      );
    case 'bountyContent':
      // `maxSubmissions` lives here because `MaxSubmissionsSection` renders
      // on the wizard's step 3 (Claim & Rewards, owned by `bountyContent`).
      // Bucketing it under `bountyRules` would have surfaced the error on
      // step 1 or 2, which don't render the input — the brand would have
      // seen "Number of claims is required" with no fixable field on the
      // current step.
      return errorKeys.filter((k) =>
        ['tagAccount', 'durationValue', 'durationUnit', 'rewards', 'maxSubmissions'].includes(k) ||
        k.startsWith('reward_'),
      );
    case 'bountyRules':
      // 'fullInstructions' added here because InstructionStepsBuilder moved
      // to Step 2 (Instructions & Metrics) which owns bountyRules errors.
      return errorKeys.filter((k) =>
        ['fullInstructions', 'minFollowers', 'minAccountAgeDays', 'locationRestriction',
         'customRules', 'proofRequirements',
         'minViews', 'minLikes', 'minComments'].includes(k) ||
        k.startsWith('customRule_'),
      );
    case 'accessType':
      return [];
    case 'brandAssets':
      return [];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Wizard step validation
// ---------------------------------------------------------------------------

/**
 * Wizard step → section-key mapping. A step "owns" the section keys it
 * gates on Next-click. The mapping mirrors the per-step field layout
 * documented in the brief (§5 Bounty Creation Flow Scope) and the
 * `wizard-step-fields.md` decision log.
 *
 * Step 0 = Basics, 1 = Instructions & Metrics, 2 = Access & Requirements,
 * 3 = Claim & Rewards, 4 = Document Share.
 *
 * `bountyBasicInfo` covers title/shortDescription/channels/schedule
 * (everything on Step 0). `bountyRules` covers fullInstructions
 * (instruction steps) + payoutMetrics + customRules + eligibility on
 * steps 1 + 2. Instructions moved from Step 0 to Step 1 in the
 * bounty-wizard-design-align pass — `fullInstructions` error key now
 * buckets under `bountyRules` (see getSectionErrors). The current
 * `getSectionErrors` returns ALL bountyRules errors for either step
 * that owns part of the section, which is acceptable for forward-block:
 * a later step can't "lap" an earlier one.
 */
export const WIZARD_STEP_SECTIONS: ReadonlyArray<ReadonlyArray<string>> = [
  ['bountyBasicInfo'],
  ['bountyRules'], // payoutMetrics + customRules sub-fields
  ['bountyRules', 'accessType'], // eligibility + engagement + visibility
  ['bountyContent'], // rewards + max submissions
  ['brandAssets'],
] as const;

export const WIZARD_STEP_COUNT = WIZARD_STEP_SECTIONS.length;

/**
 * Run a step-scoped validation pass. Returns the subset of `validateFull`
 * errors that belong to the given step's owned section keys. Forward
 * navigation is blocked when this returns a non-empty object.
 *
 * Step indices are 0-based: 0 = Basics, ..., 4 = Document Share.
 *
 * Note: this re-runs `validateFull` and filters — that keeps the rule
 * set as a single source of truth (no parallel validator to drift). The
 * cost is one full state pass per Next click, which is negligible.
 */
export function validateStep(stepIdx: number, state: BountyFormState): Record<string, string> {
  const fullErrors = validateFull(state);
  const ownedSections = WIZARD_STEP_SECTIONS[stepIdx] || [];
  const ownedErrorKeys = new Set<string>();
  for (const sectionKey of ownedSections) {
    for (const key of getSectionErrors(sectionKey, fullErrors)) {
      ownedErrorKeys.add(key);
    }
  }
  const stepErrors: Record<string, string> = {};
  for (const key of ownedErrorKeys) {
    stepErrors[key] = fullErrors[key];
  }
  return stepErrors;
}

export function isSectionComplete(sectionKey: string, state: BountyFormState): boolean {
  switch (sectionKey) {
    case 'bountyBasicInfo': {
      // Instructions moved to step 1 (bountyRules section) in
      // bounty-wizard-design-align — isSectionComplete for Basics only
      // checks title, description, and channel selection.
      return !!state.title.trim() && !!state.shortDescription.trim() && hasChannelSelection(state);
    }
    case 'bountyContent':
      // CASH rewards skip the name check — see validateFull for rationale.
      return state.rewards.length > 0 && state.rewards.every(
        (r) => (r.rewardType === RewardType.CASH || r.name.trim()) && r.monetaryValue > 0,
      );
    case 'bountyRules':
      return state.proofRequirements.length > 0;
    case 'brandAssets':
      return true; // Optional
    default:
      return false;
  }
}

/**
 * Bounty Rules section has no required inputs — proofRequirements is auto-
 * seeded to ['url'] on form init (matches the inline "post links required"
 * notice). The section is treated as `optional` in the SectionPanel pill,
 * and this helper detects whether the brand has actively added any rule
 * (eligibility / engagement / visibility / max submissions) so the pill
 * can flip from "Optional" → "Complete" as positive feedback.
 */
export function bountyRulesHasContent(state: BountyFormState): boolean {
  const elig = state.structuredEligibility;
  const eng = state.engagementRequirements;
  return (
    elig.minFollowers !== null && elig.minFollowers !== undefined ||
    elig.publicProfile === true ||
    (elig.minAccountAgeDays !== null && elig.minAccountAgeDays !== undefined) ||
    // 'South Africa' is the hard-locked default — only count it as user-content if they somehow deviate
    (!!elig.locationRestriction && elig.locationRestriction !== 'South Africa') ||
    (elig.noCompetingBrandDays !== null && elig.noCompetingBrandDays !== undefined) ||
    (elig.customRules ? elig.customRules.length > 0 : false) ||
    !!eng.tagAccount ||
    eng.mention === true ||
    eng.comment === true ||
    state.postVisibility !== null ||
    state.maxSubmissions !== null
  );
}
