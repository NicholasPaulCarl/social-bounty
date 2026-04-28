import { validateDraft, validateFull, validateField, isSectionComplete, getSectionErrors } from '../validation';
import { INITIAL_FORM_STATE, type BountyFormState } from '../types';
import {
  FIELD_LIMITS,
  BOUNTY_REWARD_LIMITS,
  PAYOUT_METRICS_LIMITS,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  RewardType,
  Currency,
  CHANNEL_POST_FORMATS,
} from '@social-bounty/shared';

function makeState(overrides: Partial<BountyFormState> = {}): BountyFormState {
  return { ...INITIAL_FORM_STATE, ...overrides };
}

describe('validateDraft', () => {
  it('should pass with just a title', () => {
    const errors = validateDraft(makeState({ title: 'Test Bounty' }));
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should fail with empty title', () => {
    const errors = validateDraft(makeState({ title: '' }));
    expect(errors.title).toBeDefined();
  });

  it('should fail with whitespace-only title', () => {
    const errors = validateDraft(makeState({ title: '   ' }));
    expect(errors.title).toBeDefined();
  });

  it('should fail when title exceeds max length', () => {
    const errors = validateDraft(makeState({ title: 'a'.repeat(FIELD_LIMITS.BOUNTY_TITLE_MAX + 1) }));
    expect(errors.title).toBeDefined();
  });

  it('should pass when title is exactly max length', () => {
    const errors = validateDraft(makeState({ title: 'a'.repeat(FIELD_LIMITS.BOUNTY_TITLE_MAX) }));
    expect(errors.title).toBeUndefined();
  });

  it('should not validate other fields in draft mode', () => {
    const errors = validateDraft(makeState({ title: 'Test', shortDescription: '', fullInstructions: '' }));
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('validateFull', () => {
  // Create a valid state for full validation (no category needed).
  // `maxSubmissions` is required at full-validation time per ADR 0013 §2 —
  // any state used as a "valid" baseline must set it to a positive int.
  const validState: Partial<BountyFormState> = {
    title: 'Test Bounty',
    shortDescription: 'A test bounty description',
    fullInstructions: 'Do the thing and submit proof',
    channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    rewards: [{ rewardType: RewardType.CASH, name: 'Cash reward', monetaryValue: 100 }],
    proofRequirements: ['url'],
    maxSubmissions: 1,
  };

  // Use valid channel formats that pass channelFormatErrors
  const validChannels = { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] };

  const fullyValidState: Partial<BountyFormState> = {
    ...validState,
    channels: validChannels,
  };

  it('should pass with all required fields', () => {
    const errors = validateFull(makeState(fullyValidState));
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should fail with missing title', () => {
    const errors = validateFull(makeState({ ...fullyValidState, title: '' }));
    expect(errors.title).toBeDefined();
  });

  it('should fail with title exceeding max length', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      title: 'a'.repeat(FIELD_LIMITS.BOUNTY_TITLE_MAX + 1),
    }));
    expect(errors.title).toBeDefined();
  });

  it('should fail with missing shortDescription', () => {
    const errors = validateFull(makeState({ ...fullyValidState, shortDescription: '' }));
    expect(errors.shortDescription).toBeDefined();
  });

  it('should fail with shortDescription exceeding max length', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      shortDescription: 'a'.repeat(FIELD_LIMITS.SHORT_DESCRIPTION_MAX + 1),
    }));
    expect(errors.shortDescription).toBeDefined();
  });

  it('should fail with missing fullInstructions', () => {
    const errors = validateFull(makeState({ ...fullyValidState, fullInstructions: '' }));
    expect(errors.fullInstructions).toBeDefined();
  });

  it('should fail with no channels', () => {
    const errors = validateFull(makeState({ ...fullyValidState, channels: {} }));
    expect(errors.channels).toBeDefined();
  });

  it('should fail with channel but no formats selected', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      channels: { [SocialChannel.INSTAGRAM]: [] },
    }));
    // Empty formats array means hasChannelSelection returns false
    expect(errors.channels).toBeDefined();
  });

  it('should fail with invalid format for channel', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      channels: { [SocialChannel.TIKTOK]: [PostFormat.STORY] }, // STORY is not valid for TikTok
    }));
    expect(errors[`channel_${SocialChannel.TIKTOK}_${PostFormat.STORY}`]).toBeDefined();
  });

  it('should fail with empty proofRequirements array', () => {
    const errors = validateFull(makeState({ ...fullyValidState, proofRequirements: [] }));
    expect(errors.proofRequirements).toBeDefined();
  });

  it('should pass with proofRequirements containing at least one item', () => {
    const errors = validateFull(makeState({ ...fullyValidState, proofRequirements: ['screenshot'] }));
    expect(errors.proofRequirements).toBeUndefined();
  });

  it('should fail with no rewards', () => {
    const errors = validateFull(makeState({ ...fullyValidState, rewards: [] }));
    expect(errors.rewards).toBeDefined();
  });

  // Reward validation
  it('should fail with non-CASH reward missing name', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      rewards: [{ rewardType: RewardType.PRODUCT, name: '', monetaryValue: 100 }],
    }));
    expect(errors.reward_0_name).toBeDefined();
  });

  it('should allow CASH reward with empty name (name is auto-filled, input hidden)', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      rewards: [{ rewardType: RewardType.CASH, name: '', monetaryValue: 100 }],
    }));
    expect(errors.reward_0_name).toBeUndefined();
  });

  it('should fail with non-CASH reward name exceeding max length', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      rewards: [{ rewardType: RewardType.PRODUCT, name: 'a'.repeat(BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX + 1), monetaryValue: 100 }],
    }));
    expect(errors.reward_0_name).toBeDefined();
  });

  it('should fail with reward value of 0', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 0 }],
    }));
    expect(errors.reward_0_value).toBeDefined();
  });

  it('should fail with negative reward value', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: -10 }],
    }));
    expect(errors.reward_0_value).toBeDefined();
  });

  it('should validate multiple rewards independently', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      rewards: [
        { rewardType: RewardType.CASH, name: 'Good', monetaryValue: 50 },
        { rewardType: RewardType.PRODUCT, name: '', monetaryValue: 0 },
      ],
    }));
    expect(errors.reward_0_name).toBeUndefined();
    expect(errors.reward_0_value).toBeUndefined();
    expect(errors.reward_1_name).toBeDefined();
    expect(errors.reward_1_value).toBeDefined();
  });

  // Tag account validation
  it('should fail with tag account not starting with @', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      engagementRequirements: { tagAccount: 'invalid', mention: false, comment: false },
    }));
    expect(errors.tagAccount).toBeDefined();
  });

  it('should fail with tag account with invalid characters', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      engagementRequirements: { tagAccount: '@invalid user!', mention: false, comment: false },
    }));
    expect(errors.tagAccount).toBeDefined();
  });

  it('should pass with valid tag account', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      engagementRequirements: { tagAccount: '@validuser', mention: false, comment: false },
    }));
    expect(errors.tagAccount).toBeUndefined();
  });

  it('should pass with tag account containing dots and underscores', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      engagementRequirements: { tagAccount: '@valid.user_name', mention: false, comment: false },
    }));
    expect(errors.tagAccount).toBeUndefined();
  });

  it('should pass with null tag account', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      engagementRequirements: { tagAccount: null, mention: false, comment: false },
    }));
    expect(errors.tagAccount).toBeUndefined();
  });

  // Post visibility validation
  it('should fail when MINIMUM_DURATION but no value', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      postVisibility: { rule: PostVisibilityRule.MINIMUM_DURATION, minDurationValue: null, minDurationUnit: null },
    }));
    expect(errors.durationValue).toBeDefined();
    expect(errors.durationUnit).toBeDefined();
  });

  it('should fail when MINIMUM_DURATION with value 0', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      postVisibility: { rule: PostVisibilityRule.MINIMUM_DURATION, minDurationValue: 0, minDurationUnit: null },
    }));
    expect(errors.durationValue).toBeDefined();
  });

  it('should not validate duration when postVisibility is null', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      postVisibility: null,
    }));
    expect(errors.durationValue).toBeUndefined();
    expect(errors.durationUnit).toBeUndefined();
  });

  it('should not validate duration for MUST_NOT_REMOVE rule', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      postVisibility: { rule: PostVisibilityRule.MUST_NOT_REMOVE, minDurationValue: null, minDurationUnit: null },
    }));
    expect(errors.durationValue).toBeUndefined();
    expect(errors.durationUnit).toBeUndefined();
  });

  // Payout metrics
  it('should fail with negative minViews', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: -1, minLikes: null, minComments: null },
    }));
    expect(errors.minViews).toBeDefined();
  });

  it('should fail when minViews exceeds max', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: PAYOUT_METRICS_LIMITS.MAX_VIEWS + 1, minLikes: null, minComments: null },
    }));
    expect(errors.minViews).toBeDefined();
  });

  it('should fail with negative minLikes', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: null, minLikes: -1, minComments: null },
    }));
    expect(errors.minLikes).toBeDefined();
  });

  it('should fail when minLikes exceeds max', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: null, minLikes: PAYOUT_METRICS_LIMITS.MAX_LIKES + 1, minComments: null },
    }));
    expect(errors.minLikes).toBeDefined();
  });

  it('should fail with negative minComments', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: null, minLikes: null, minComments: -1 },
    }));
    expect(errors.minComments).toBeDefined();
  });

  it('should fail when minComments exceeds max', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: null, minLikes: null, minComments: PAYOUT_METRICS_LIMITS.MAX_COMMENTS + 1 },
    }));
    expect(errors.minComments).toBeDefined();
  });

  it('should pass with valid payout metrics', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: 100, minLikes: 50, minComments: 10 },
    }));
    expect(errors.minViews).toBeUndefined();
    expect(errors.minLikes).toBeUndefined();
    expect(errors.minComments).toBeUndefined();
  });

  it('should pass with null payout metrics', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      payoutMetrics: { minViews: null, minLikes: null, minComments: null },
    }));
    expect(errors.minViews).toBeUndefined();
    expect(errors.minLikes).toBeUndefined();
    expect(errors.minComments).toBeUndefined();
  });

  // Schedule validation
  it('should fail when endDate is before startDate', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      startDate: new Date('2025-12-31'),
      endDate: new Date('2025-12-01'),
    }));
    expect(errors.endDate).toBeDefined();
  });

  it('should fail when endDate equals startDate', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      startDate: new Date('2025-12-31'),
      endDate: new Date('2025-12-31'),
    }));
    expect(errors.endDate).toBeDefined();
  });

  it('should pass with endDate after startDate', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-31'),
    }));
    expect(errors.endDate).toBeUndefined();
  });

  it('should pass with null dates', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      startDate: null,
      endDate: null,
    }));
    expect(errors.endDate).toBeUndefined();
  });

  // Max submissions
  it('should fail when maxSubmissions is 0', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      maxSubmissions: 0,
    }));
    expect(errors.maxSubmissions).toBeDefined();
  });

  it('should fail when maxSubmissions is negative', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      maxSubmissions: -5,
    }));
    expect(errors.maxSubmissions).toBeDefined();
  });

  it('should fail when maxSubmissions is null (required at full validation per ADR 0013 §2)', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      maxSubmissions: null,
    }));
    expect(errors.maxSubmissions).toBe('Number of claims is required');
  });

  it('should pass when maxSubmissions is positive', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      maxSubmissions: 50,
    }));
    expect(errors.maxSubmissions).toBeUndefined();
  });

  // Eligibility validation
  it('should fail with minFollowers of 0', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        minFollowers: 0,
      },
    }));
    expect(errors.minFollowers).toBeDefined();
  });

  it('should pass with null minFollowers', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        minFollowers: null,
      },
    }));
    expect(errors.minFollowers).toBeUndefined();
  });

  it('should fail with minAccountAgeDays of 0', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        minAccountAgeDays: 0,
      },
    }));
    expect(errors.minAccountAgeDays).toBeDefined();
  });

  it('should fail with locationRestriction exceeding 200 chars', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        locationRestriction: 'a'.repeat(201),
      },
    }));
    expect(errors.locationRestriction).toBeDefined();
  });

  it('should fail with too many custom rules', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        customRules: Array.from({ length: BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES + 1 }, (_, i) => `Rule ${i}`),
      },
    }));
    expect(errors.customRules).toBeDefined();
  });

  it('should fail with empty custom rule', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        customRules: ['Valid rule', ''],
      },
    }));
    expect(errors.customRule_1).toBeDefined();
  });

  it('should fail with custom rule exceeding max length', () => {
    const errors = validateFull(makeState({
      ...fullyValidState,
      structuredEligibility: {
        ...INITIAL_FORM_STATE.structuredEligibility,
        customRules: ['a'.repeat(BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH + 1)],
      },
    }));
    expect(errors.customRule_0).toBeDefined();
  });
});

describe('validateField', () => {
  it('should validate title field - empty', () => {
    expect(validateField('title', makeState({ title: '' }))).toBe('Title is required');
  });

  it('should validate title field - valid', () => {
    expect(validateField('title', makeState({ title: 'Valid' }))).toBeNull();
  });

  it('should validate title field - too long', () => {
    const result = validateField('title', makeState({ title: 'a'.repeat(FIELD_LIMITS.BOUNTY_TITLE_MAX + 1) }));
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });

  it('should validate shortDescription - too long', () => {
    const result = validateField('shortDescription', makeState({
      shortDescription: 'a'.repeat(FIELD_LIMITS.SHORT_DESCRIPTION_MAX + 1),
    }));
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });

  it('should validate shortDescription - valid', () => {
    expect(validateField('shortDescription', makeState({ shortDescription: 'valid' }))).toBeNull();
  });

  it('should validate tagAccount - no @', () => {
    expect(validateField('tagAccount', makeState({
      engagementRequirements: { tagAccount: 'noleading', mention: false, comment: false },
    }))).toBeDefined();
  });

  it('should validate tagAccount - valid', () => {
    expect(validateField('tagAccount', makeState({
      engagementRequirements: { tagAccount: '@valid', mention: false, comment: false },
    }))).toBeNull();
  });

  it('should validate tagAccount - null is valid', () => {
    expect(validateField('tagAccount', makeState({
      engagementRequirements: { tagAccount: null, mention: false, comment: false },
    }))).toBeNull();
  });

  it('should validate endDate field', () => {
    expect(validateField('endDate', makeState({
      startDate: new Date('2025-12-31'),
      endDate: new Date('2025-12-01'),
    }))).toBeDefined();
  });

  it('should validate endDate - valid', () => {
    expect(validateField('endDate', makeState({
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-31'),
    }))).toBeNull();
  });

  it('should return null for unknown fields', () => {
    expect(validateField('unknownField', makeState())).toBeNull();
  });
});

describe('getSectionErrors', () => {
  it('should return bountyBasicInfo errors', () => {
    const errors = { title: 'required', shortDescription: 'required' };
    expect(getSectionErrors('bountyBasicInfo', errors)).toHaveLength(2);
  });

  it('should return only bountyBasicInfo keys (includes channels)', () => {
    const errors = { title: 'required', channels: 'required', proofRequirements: 'required' };
    expect(getSectionErrors('bountyBasicInfo', errors)).toHaveLength(2);
  });

  it('should return channel errors in bountyBasicInfo', () => {
    const errors = { channels: 'required', channel_INSTAGRAM: 'invalid' };
    expect(getSectionErrors('bountyBasicInfo', errors)).toHaveLength(2);
  });

  it('should return bountyContent errors (rewards, tagAccount, duration, maxSubmissions)', () => {
    const errors = { rewards: 'required', reward_0_name: 'required', reward_1_value: 'required', tagAccount: 'invalid' };
    expect(getSectionErrors('bountyContent', errors)).toHaveLength(4);
  });

  it('should return bountyContent duration errors', () => {
    const errors = { durationValue: 'required', durationUnit: 'required' };
    expect(getSectionErrors('bountyContent', errors)).toHaveLength(2);
  });

  it('should bucket maxSubmissions under bountyContent (renders on wizard step 3)', () => {
    // Per the ADR 0013 step-ownership move: MaxSubmissionsSection lives
    // in step 3 (Claim & Rewards, owned by bountyContent), so its error
    // must surface on that step's panel — not on bountyRules where the
    // pre-2026-04-28 mapping put it.
    const errors = { maxSubmissions: 'invalid', minFollowers: 'required' };
    expect(getSectionErrors('bountyContent', errors)).toEqual(['maxSubmissions']);
    expect(getSectionErrors('bountyRules', errors)).toEqual(['minFollowers']);
  });

  it('should return bountyRules errors (eligibility, proof, metrics)', () => {
    const errors = { minFollowers: 'required', customRule_0: 'empty', proofRequirements: 'required' };
    expect(getSectionErrors('bountyRules', errors)).toHaveLength(3);
  });

  it('should return bountyBasicInfo schedule errors', () => {
    // Schedule (startDate / endDate) lives in Section 1 of the form
    // (Wave B regrouped — was previously co-located with bountyRules
    // in the section-key map even though the panel sat in Section 1).
    // The wizard's Step 1 (Basics) blocks Next on schedule errors via
    // this mapping.
    const errors = { endDate: 'invalid', startDate: 'invalid' };
    expect(getSectionErrors('bountyBasicInfo', errors)).toHaveLength(2);
    expect(getSectionErrors('bountyRules', errors)).toHaveLength(0);
  });

  it('should return bountyRules payout metrics errors', () => {
    const errors = { minViews: 'invalid', minLikes: 'invalid', minComments: 'invalid' };
    expect(getSectionErrors('bountyRules', errors)).toHaveLength(3);
  });

  it('should return empty for brandAssets', () => {
    expect(getSectionErrors('brandAssets', { title: 'error' })).toHaveLength(0);
  });

  it('should return empty for unknown section', () => {
    expect(getSectionErrors('unknown', { title: 'error' })).toHaveLength(0);
  });
});

describe('isSectionComplete', () => {
  it('should mark bountyBasicInfo as complete when all fields filled and channel selected', () => {
    expect(isSectionComplete('bountyBasicInfo', makeState({
      title: 'Test',
      shortDescription: 'Desc',
      fullInstructions: 'Instructions',
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    }))).toBe(true);
  });

  it('should mark bountyBasicInfo as incomplete with missing title', () => {
    expect(isSectionComplete('bountyBasicInfo', makeState())).toBe(false);
  });

  it('should mark bountyBasicInfo as incomplete with no channels', () => {
    expect(isSectionComplete('bountyBasicInfo', makeState({
      title: 'Test',
      shortDescription: 'Desc',
      fullInstructions: 'Instructions',
      channels: {},
    }))).toBe(false);
  });

  it('should mark bountyBasicInfo as incomplete with whitespace-only fields', () => {
    expect(isSectionComplete('bountyBasicInfo', makeState({
      title: '   ',
      shortDescription: 'Desc',
      fullInstructions: 'Instructions',
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    }))).toBe(false);
  });

  it('should mark bountyContent complete when all rewards have name and value', () => {
    expect(isSectionComplete('bountyContent', makeState({
      rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 50 }],
    }))).toBe(true);
  });

  it('should mark bountyContent incomplete with non-CASH reward missing name', () => {
    expect(isSectionComplete('bountyContent', makeState({
      rewards: [{ rewardType: RewardType.PRODUCT, name: '', monetaryValue: 50 }],
    }))).toBe(false);
  });

  it('should mark bountyContent complete for CASH reward with empty name (name is auto-filled)', () => {
    expect(isSectionComplete('bountyContent', makeState({
      rewards: [{ rewardType: RewardType.CASH, name: '', monetaryValue: 50 }],
    }))).toBe(true);
  });

  it('should mark bountyContent incomplete with zero reward value', () => {
    expect(isSectionComplete('bountyContent', makeState({
      rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 0 }],
    }))).toBe(false);
  });

  it('should mark bountyContent incomplete with empty rewards array', () => {
    expect(isSectionComplete('bountyContent', makeState({
      rewards: [],
    }))).toBe(false);
  });

  it('should mark bountyRules complete when proofRequirements has items', () => {
    expect(isSectionComplete('bountyRules', makeState({
      proofRequirements: ['url'],
    }))).toBe(true);
  });

  it('should mark bountyRules complete with multiple proof requirements', () => {
    expect(isSectionComplete('bountyRules', makeState({
      proofRequirements: ['url', 'screenshot'],
    }))).toBe(true);
  });

  it('should mark bountyRules incomplete when proofRequirements is empty', () => {
    expect(isSectionComplete('bountyRules', makeState({
      proofRequirements: [],
    }))).toBe(false);
  });

  it('should mark brandAssets as always complete (optional)', () => {
    expect(isSectionComplete('brandAssets', makeState())).toBe(true);
  });

  it('should return false for unknown section', () => {
    expect(isSectionComplete('unknownSection', makeState())).toBe(false);
  });
});
