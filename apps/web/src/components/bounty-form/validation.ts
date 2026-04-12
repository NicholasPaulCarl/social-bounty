import {
  FIELD_LIMITS,
  BOUNTY_REWARD_LIMITS,
  PAYOUT_METRICS_LIMITS,
  CHANNEL_POST_FORMATS,
  PostVisibilityRule,
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
  if (state.rewards.length === 0) {
    errors.rewards = 'At least one reward is required';
  } else {
    state.rewards.forEach((reward, i) => {
      if (!reward.name.trim()) {
        errors[`reward_${i}_name`] = 'Reward name is required';
      } else if (reward.name.length > BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX) {
        errors[`reward_${i}_name`] = `Reward name must be at most ${BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX} characters`;
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

  // --- Section 8: Max Submissions ---
  if (state.maxSubmissions !== null && state.maxSubmissions < 1) {
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
      return errorKeys.filter((k) =>
        ['title', 'shortDescription', 'fullInstructions', 'channels'].includes(k) ||
        k.startsWith('channel_'),
      );
    case 'bountyContent':
      return errorKeys.filter((k) =>
        ['tagAccount', 'durationValue', 'durationUnit', 'rewards'].includes(k) ||
        k.startsWith('reward_'),
      );
    case 'bountyRules':
      return errorKeys.filter((k) =>
        ['minFollowers', 'minAccountAgeDays', 'locationRestriction', 'customRules',
         'proofRequirements', 'maxSubmissions', 'startDate', 'endDate',
         'minViews', 'minLikes', 'minComments'].includes(k) ||
        k.startsWith('customRule_'),
      );
    case 'brandAssets':
      return [];
    default:
      return [];
  }
}

export function isSectionComplete(sectionKey: string, state: BountyFormState): boolean {
  switch (sectionKey) {
    case 'bountyBasicInfo': {
      const hasInstructions = state.instructionSteps.some((s) => s.trim()) || !!state.fullInstructions.trim();
      return !!state.title.trim() && !!state.shortDescription.trim() && hasInstructions && hasChannelSelection(state);
    }
    case 'bountyContent':
      return state.rewards.length > 0 && state.rewards.every((r) => r.name.trim() && r.monetaryValue > 0);
    case 'bountyRules':
      return true; // Optional rules
    case 'brandAssets':
      return true; // Optional
    default:
      return false;
  }
}
