import { buildCreateBountyRequest } from '../useCreateBountyForm';
import { INITIAL_FORM_STATE, type BountyFormState } from '../types';
import {
  Currency,
  RewardType,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
} from '@social-bounty/shared';

// ---------------------------------------------------------------------------
// Helper: build a BountyFormState with overrides on top of INITIAL_FORM_STATE
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<BountyFormState> = {}): BountyFormState {
  return { ...INITIAL_FORM_STATE, ...overrides };
}

// A "filled" state that represents a complete bounty form ready for full submit
function makeFilledState(overrides: Partial<BountyFormState> = {}): BountyFormState {
  return makeState({
    title: '  Test Bounty  ',
    shortDescription: '  A short description  ',
    fullInstructions: '  Full instructions here  ',
    channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.STORY] },
    aiContentPermitted: true,
    engagementRequirements: { tagAccount: '@brandname', mention: true, comment: false },
    postVisibility: {
      rule: PostVisibilityRule.MINIMUM_DURATION,
      minDurationValue: 7,
      minDurationUnit: DurationUnit.DAYS,
    },
    currency: Currency.USD,
    rewards: [
      { rewardType: RewardType.CASH, name: 'Cash Prize', monetaryValue: 100 },
      { rewardType: RewardType.PRODUCT, name: 'Free Product', monetaryValue: 50 },
    ],
    structuredEligibility: {
      minFollowers: 1000,
      publicProfile: true,
      minAccountAgeDays: 90,
      locationRestriction: 'South Africa',
      noCompetingBrandDays: 30,
      customRules: ['Must have profile picture', 'No bots'],
    },
    proofRequirements: ['url', 'screenshot'],
    maxSubmissions: 100,
    startDate: new Date('2026-03-01T00:00:00.000Z'),
    endDate: new Date('2026-06-01T00:00:00.000Z'),
    payoutMetrics: { minViews: 500, minLikes: 50, minComments: 10 },
    ...overrides,
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('buildCreateBountyRequest', () => {
  // --------------------------------------------------------------------------
  // Draft mode
  // --------------------------------------------------------------------------
  describe('draft mode', () => {
    it('should only include title + seeded proofRequirements when form is at initial state', () => {
      const result = buildCreateBountyRequest(INITIAL_FORM_STATE, 'draft');
      // Title is always included (even if empty string after trim)
      expect(result.title).toBe('');
      // currency and aiContentPermitted are always included
      expect(result.currency).toBe(Currency.ZAR);
      expect(result.aiContentPermitted).toBe(false);
      // URL proof is seeded into INITIAL_FORM_STATE to match the
      // "Post links are required" inline notice on Section 1.
      expect(result.proofRequirements).toBe('url');
      // Optional fields should NOT be present
      expect(result).not.toHaveProperty('shortDescription');
      expect(result).not.toHaveProperty('fullInstructions');
      expect(result).not.toHaveProperty('category');
      expect(result).not.toHaveProperty('maxSubmissions');
      expect(result).not.toHaveProperty('startDate');
      expect(result).not.toHaveProperty('endDate');
      expect(result).not.toHaveProperty('channels');
      expect(result).not.toHaveProperty('rewards');
      expect(result).not.toHaveProperty('postVisibility');
      expect(result).not.toHaveProperty('structuredEligibility');
      expect(result).not.toHaveProperty('engagementRequirements');
      expect(result).not.toHaveProperty('payoutMetrics');
    });

    it('should include text fields only when they have meaningful (non-whitespace) data', () => {
      const state = makeState({
        title: 'My Bounty',
        shortDescription: '   ',
        fullInstructions: 'Do something',
        proofRequirements: ['url'],
      });
      const result = buildCreateBountyRequest(state, 'draft');
      expect(result.title).toBe('My Bounty');
      expect(result).not.toHaveProperty('shortDescription');
      expect(result.fullInstructions).toBe('Do something');
      expect(result).not.toHaveProperty('category');
      expect(result.proofRequirements).toBe('url');
    });

    it('should serialize proofRequirements as comma-separated string', () => {
      const state = makeState({
        proofRequirements: ['url', 'screenshot'],
      });
      const result = buildCreateBountyRequest(state, 'draft');
      expect(result.proofRequirements).toBe('url,screenshot');
    });

    it('should not include proofRequirements when empty array', () => {
      const result = buildCreateBountyRequest(makeState({ proofRequirements: [] }), 'draft');
      expect(result).not.toHaveProperty('proofRequirements');
    });

    it('should include maxSubmissions when not null', () => {
      const result = buildCreateBountyRequest(makeState({ maxSubmissions: 50 }), 'draft');
      expect(result.maxSubmissions).toBe(50);
    });

    it('should not include maxSubmissions when null', () => {
      const result = buildCreateBountyRequest(makeState({ maxSubmissions: null }), 'draft');
      expect(result).not.toHaveProperty('maxSubmissions');
    });

    it('should include startDate as ISO string when set', () => {
      const date = new Date('2026-04-01T00:00:00.000Z');
      const result = buildCreateBountyRequest(makeState({ startDate: date }), 'draft');
      expect(result.startDate).toBe('2026-04-01T00:00:00.000Z');
    });

    it('should not include startDate when null', () => {
      const result = buildCreateBountyRequest(makeState({ startDate: null }), 'draft');
      expect(result).not.toHaveProperty('startDate');
    });

    it('should not include endDate when null', () => {
      const result = buildCreateBountyRequest(makeState({ endDate: null }), 'draft');
      expect(result).not.toHaveProperty('endDate');
    });

    it('should include channels when at least one channel is set', () => {
      const channels = { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] };
      const result = buildCreateBountyRequest(makeState({ channels }), 'draft');
      expect(result.channels).toEqual(channels);
    });

    it('should not include channels when empty object', () => {
      const result = buildCreateBountyRequest(makeState({ channels: {} }), 'draft');
      expect(result).not.toHaveProperty('channels');
    });

    it('should filter out incomplete rewards (non-CASH missing name, any zero value); keep CASH regardless of name', () => {
      const state = makeState({
        rewards: [
          { rewardType: RewardType.CASH, name: 'Good', monetaryValue: 100 },
          { rewardType: RewardType.PRODUCT, name: '', monetaryValue: 50 },    // filtered — non-CASH needs name
          { rewardType: RewardType.CASH, name: 'Zero', monetaryValue: 0 },    // filtered — zero value
          { rewardType: RewardType.CASH, name: '  ', monetaryValue: 200 },   // kept — CASH skips name check
        ],
      });
      const result = buildCreateBountyRequest(state, 'draft');
      expect(result.rewards).toEqual([
        { rewardType: RewardType.CASH, name: 'Good', monetaryValue: 100 },
        { rewardType: RewardType.CASH, name: '  ', monetaryValue: 200 },
      ]);
    });

    it('should not include rewards when all are incomplete', () => {
      const state = makeState({
        rewards: [
          { rewardType: RewardType.CASH, name: '', monetaryValue: 0 },
        ],
      });
      const result = buildCreateBountyRequest(state, 'draft');
      expect(result).not.toHaveProperty('rewards');
    });

    it('should include postVisibility when not null', () => {
      const pv = { rule: PostVisibilityRule.MUST_NOT_REMOVE, minDurationValue: null, minDurationUnit: null };
      const result = buildCreateBountyRequest(makeState({ postVisibility: pv }), 'draft');
      expect(result.postVisibility).toEqual(pv);
    });

    it('should not include postVisibility when null', () => {
      const result = buildCreateBountyRequest(makeState({ postVisibility: null }), 'draft');
      expect(result).not.toHaveProperty('postVisibility');
    });

    it('should include structuredEligibility when minFollowers is set', () => {
      const elig = { ...INITIAL_FORM_STATE.structuredEligibility, minFollowers: 500 };
      const result = buildCreateBountyRequest(makeState({ structuredEligibility: elig }), 'draft');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should include structuredEligibility when publicProfile is true', () => {
      const elig = { ...INITIAL_FORM_STATE.structuredEligibility, publicProfile: true };
      const result = buildCreateBountyRequest(makeState({ structuredEligibility: elig }), 'draft');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should include structuredEligibility when customRules has entries', () => {
      const elig = { ...INITIAL_FORM_STATE.structuredEligibility, customRules: ['Must be active'] };
      const result = buildCreateBountyRequest(makeState({ structuredEligibility: elig }), 'draft');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should not include structuredEligibility when all fields are at defaults', () => {
      const result = buildCreateBountyRequest(makeState(), 'draft');
      expect(result).not.toHaveProperty('structuredEligibility');
    });

    it('should include engagementRequirements when tagAccount is set', () => {
      const eng = { tagAccount: '@brand', mention: false, comment: false };
      const result = buildCreateBountyRequest(makeState({ engagementRequirements: eng }), 'draft');
      expect(result.engagementRequirements).toEqual(eng);
    });

    it('should include engagementRequirements when mention is true', () => {
      const eng = { tagAccount: null, mention: true, comment: false };
      const result = buildCreateBountyRequest(makeState({ engagementRequirements: eng }), 'draft');
      expect(result.engagementRequirements).toEqual(eng);
    });

    it('should include engagementRequirements when comment is true', () => {
      const eng = { tagAccount: null, mention: false, comment: true };
      const result = buildCreateBountyRequest(makeState({ engagementRequirements: eng }), 'draft');
      expect(result.engagementRequirements).toEqual(eng);
    });

    it('should not include engagementRequirements when all defaults', () => {
      const result = buildCreateBountyRequest(makeState(), 'draft');
      expect(result).not.toHaveProperty('engagementRequirements');
    });

    it('should include payoutMetrics when minViews is set', () => {
      const pm = { minViews: 100, minLikes: null, minComments: null };
      const result = buildCreateBountyRequest(makeState({ payoutMetrics: pm }), 'draft');
      expect(result.payoutMetrics).toEqual(pm);
    });

    it('should include payoutMetrics when minLikes is set', () => {
      const pm = { minViews: null, minLikes: 25, minComments: null };
      const result = buildCreateBountyRequest(makeState({ payoutMetrics: pm }), 'draft');
      expect(result.payoutMetrics).toEqual(pm);
    });

    it('should include payoutMetrics when minComments is set', () => {
      const pm = { minViews: null, minLikes: null, minComments: 5 };
      const result = buildCreateBountyRequest(makeState({ payoutMetrics: pm }), 'draft');
      expect(result.payoutMetrics).toEqual(pm);
    });

    it('should not include payoutMetrics when all values are null', () => {
      const result = buildCreateBountyRequest(makeState(), 'draft');
      expect(result).not.toHaveProperty('payoutMetrics');
    });

    it('should always include currency and aiContentPermitted', () => {
      const result = buildCreateBountyRequest(makeState(), 'draft');
      expect(result.currency).toBe(Currency.ZAR);
      expect(result.aiContentPermitted).toBe(false);
    });

    it('should include all filled fields in a fully-filled draft', () => {
      const result = buildCreateBountyRequest(makeFilledState(), 'draft');
      expect(result.title).toBe('Test Bounty');
      expect(result.shortDescription).toBe('A short description');
      expect(result.fullInstructions).toBe('Full instructions here');
      expect(result).not.toHaveProperty('category');
      expect(result.proofRequirements).toBe('url,screenshot');
      expect(result.maxSubmissions).toBe(100);
      expect(result.startDate).toBe('2026-03-01T00:00:00.000Z');
      expect(result.endDate).toBe('2026-06-01T00:00:00.000Z');
      expect(result.channels).toEqual({ [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.STORY] });
      expect(result.rewards).toHaveLength(2);
      expect(result.postVisibility).toBeDefined();
      expect(result.structuredEligibility).toBeDefined();
      expect(result.engagementRequirements).toBeDefined();
      expect(result.payoutMetrics).toBeDefined();
      expect(result.currency).toBe(Currency.USD);
      expect(result.aiContentPermitted).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Full mode
  // --------------------------------------------------------------------------
  describe('full mode', () => {
    it('should include all required fields', () => {
      const result = buildCreateBountyRequest(makeFilledState(), 'full');
      expect(result.title).toBe('Test Bounty');
      expect(result.shortDescription).toBe('A short description');
      expect(result.fullInstructions).toBe('Full instructions here');
      expect(result).not.toHaveProperty('category');
      expect(result.proofRequirements).toBe('url,screenshot');
      expect(result.maxSubmissions).toBe(100);
      expect(result.currency).toBe(Currency.USD);
      expect(result.aiContentPermitted).toBe(true);
    });

    it('should trim whitespace from string fields', () => {
      const result = buildCreateBountyRequest(makeFilledState(), 'full');
      expect(result.title).toBe('Test Bounty');
      expect(result.shortDescription).toBe('A short description');
      expect(result.fullInstructions).toBe('Full instructions here');
      expect(result.proofRequirements).toBe('url,screenshot');
    });

    it('should convert dates to ISO strings', () => {
      const result = buildCreateBountyRequest(makeFilledState(), 'full');
      expect(result.startDate).toBe('2026-03-01T00:00:00.000Z');
      expect(result.endDate).toBe('2026-06-01T00:00:00.000Z');
    });

    it('should set dates to null when not provided', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({ startDate: null, endDate: null }),
        'full',
      );
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it('should filter incomplete rewards and return only complete ones', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          rewards: [
            { rewardType: RewardType.CASH, name: 'Cash Prize', monetaryValue: 100 },
            { rewardType: RewardType.PRODUCT, name: '', monetaryValue: 50 },
            { rewardType: RewardType.SERVICE, name: 'Consultation', monetaryValue: 0 },
          ],
        }),
        'full',
      );
      expect(result.rewards).toEqual([
        { rewardType: RewardType.CASH, name: 'Cash Prize', monetaryValue: 100 },
      ]);
    });

    it('should fall back to raw rewards when all rewards are incomplete', () => {
      const rawRewards = [
        { rewardType: RewardType.CASH, name: '', monetaryValue: 0 },
      ];
      const result = buildCreateBountyRequest(
        makeFilledState({ rewards: rawRewards }),
        'full',
      );
      // When no rewards pass the filter, it falls back to the unfiltered array
      expect(result.rewards).toEqual(rawRewards);
    });

    it('should default postVisibility to MUST_NOT_REMOVE when null', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({ postVisibility: null }),
        'full',
      );
      expect(result.postVisibility).toEqual({ rule: PostVisibilityRule.MUST_NOT_REMOVE });
    });

    it('should pass through postVisibility when set', () => {
      const pv = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 14,
        minDurationUnit: DurationUnit.DAYS,
      };
      const result = buildCreateBountyRequest(makeFilledState({ postVisibility: pv }), 'full');
      expect(result.postVisibility).toEqual(pv);
    });

    it('should include channels as-is', () => {
      const channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL],
        [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
      };
      const result = buildCreateBountyRequest(makeFilledState({ channels }), 'full');
      expect(result.channels).toEqual(channels);
    });

    it('should include structuredEligibility as-is', () => {
      const elig = {
        minFollowers: 5000,
        publicProfile: true,
        minAccountAgeDays: 180,
        locationRestriction: 'United States',
        noCompetingBrandDays: 60,
        customRules: ['Rule A', 'Rule B'],
      };
      const result = buildCreateBountyRequest(makeFilledState({ structuredEligibility: elig }), 'full');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should include empty structuredEligibility in full mode (always included)', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          structuredEligibility: INITIAL_FORM_STATE.structuredEligibility,
        }),
        'full',
      );
      expect(result.structuredEligibility).toEqual(INITIAL_FORM_STATE.structuredEligibility);
    });

    it('should include engagementRequirements as-is in full mode', () => {
      const eng = { tagAccount: '@mypage', mention: true, comment: true };
      const result = buildCreateBountyRequest(makeFilledState({ engagementRequirements: eng }), 'full');
      expect(result.engagementRequirements).toEqual(eng);
    });

    it('should include default engagementRequirements in full mode', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          engagementRequirements: INITIAL_FORM_STATE.engagementRequirements,
        }),
        'full',
      );
      expect(result.engagementRequirements).toEqual(INITIAL_FORM_STATE.engagementRequirements);
    });

    it('should include payoutMetrics when at least one metric is set', () => {
      const pm = { minViews: 1000, minLikes: null, minComments: null };
      const result = buildCreateBountyRequest(makeFilledState({ payoutMetrics: pm }), 'full');
      expect(result.payoutMetrics).toEqual(pm);
    });

    it('should set payoutMetrics to undefined when all values are null', () => {
      const pm = { minViews: null, minLikes: null, minComments: null };
      const result = buildCreateBountyRequest(makeFilledState({ payoutMetrics: pm }), 'full');
      expect(result.payoutMetrics).toBeUndefined();
    });

    it('should default mode to full when not specified', () => {
      // When called without a mode argument, it should produce the full output
      const result = buildCreateBountyRequest(makeFilledState());
      // Full mode always includes structuredEligibility and engagementRequirements
      expect(result.structuredEligibility).toBeDefined();
      expect(result.engagementRequirements).toBeDefined();
      expect(result.postVisibility).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Reward filtering edge cases
  // --------------------------------------------------------------------------
  describe('reward filtering', () => {
    it('should filter non-CASH rewards where name is only whitespace', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          rewards: [
            { rewardType: RewardType.PRODUCT, name: '   ', monetaryValue: 100 },
            { rewardType: RewardType.PRODUCT, name: 'Valid', monetaryValue: 200 },
          ],
        }),
        'draft',
      );
      expect(result.rewards).toEqual([
        { rewardType: RewardType.PRODUCT, name: 'Valid', monetaryValue: 200 },
      ]);
    });

    it('should keep CASH rewards regardless of name (the name input is hidden for CASH)', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          rewards: [
            { rewardType: RewardType.CASH, name: '   ', monetaryValue: 100 },
            { rewardType: RewardType.CASH, name: 'Valid', monetaryValue: 200 },
          ],
        }),
        'draft',
      );
      expect(result.rewards).toEqual([
        { rewardType: RewardType.CASH, name: '   ', monetaryValue: 100 },
        { rewardType: RewardType.CASH, name: 'Valid', monetaryValue: 200 },
      ]);
    });

    it('should filter rewards with negative monetary value (only > 0 pass)', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          rewards: [
            { rewardType: RewardType.CASH, name: 'Negative', monetaryValue: -10 },
            { rewardType: RewardType.CASH, name: 'Positive', monetaryValue: 50 },
          ],
        }),
        'draft',
      );
      expect(result.rewards).toEqual([
        { rewardType: RewardType.CASH, name: 'Positive', monetaryValue: 50 },
      ]);
    });

    it('should require BOTH name and value for non-CASH rewards to pass the filter', () => {
      const result = buildCreateBountyRequest(
        makeFilledState({
          rewards: [
            { rewardType: RewardType.PRODUCT, name: 'HasName', monetaryValue: 0 },
            { rewardType: RewardType.PRODUCT, name: '', monetaryValue: 100 },
            { rewardType: RewardType.PRODUCT, name: 'Complete', monetaryValue: 75 },
          ],
        }),
        'full',
      );
      expect(result.rewards).toEqual([
        { rewardType: RewardType.PRODUCT, name: 'Complete', monetaryValue: 75 },
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // Channel format mapping
  // --------------------------------------------------------------------------
  describe('channel format mapping', () => {
    it('should preserve channel-to-formats mapping in draft mode', () => {
      const channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST],
        [SocialChannel.FACEBOOK]: [PostFormat.STORY],
      };
      const result = buildCreateBountyRequest(makeState({ channels }), 'draft');
      expect(result.channels).toEqual(channels);
    });

    it('should preserve channel-to-formats mapping in full mode', () => {
      const channels = {
        [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
      };
      const result = buildCreateBountyRequest(makeFilledState({ channels }), 'full');
      expect(result.channels).toEqual(channels);
    });
  });

  // --------------------------------------------------------------------------
  // Eligibility edge cases
  // --------------------------------------------------------------------------
  describe('structured eligibility detection', () => {
    it('should detect eligibility via minAccountAgeDays', () => {
      const elig = { ...INITIAL_FORM_STATE.structuredEligibility, minAccountAgeDays: 30 };
      const result = buildCreateBountyRequest(makeState({ structuredEligibility: elig }), 'draft');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should detect eligibility via locationRestriction', () => {
      const elig = { ...INITIAL_FORM_STATE.structuredEligibility, locationRestriction: 'SA' };
      const result = buildCreateBountyRequest(makeState({ structuredEligibility: elig }), 'draft');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should detect eligibility via noCompetingBrandDays', () => {
      const elig = { ...INITIAL_FORM_STATE.structuredEligibility, noCompetingBrandDays: 14 };
      const result = buildCreateBountyRequest(makeState({ structuredEligibility: elig }), 'draft');
      expect(result.structuredEligibility).toEqual(elig);
    });

    it('should not detect eligibility when customRules is empty array', () => {
      // The initial state already has customRules: [] which is falsy for .length > 0
      const result = buildCreateBountyRequest(makeState(), 'draft');
      expect(result).not.toHaveProperty('structuredEligibility');
    });
  });

  // --------------------------------------------------------------------------
  // Engagement requirements edge cases
  // --------------------------------------------------------------------------
  describe('engagement requirements detection', () => {
    it('should not detect engagement when tagAccount is null and booleans are false', () => {
      const eng = { tagAccount: null, mention: false, comment: false };
      const result = buildCreateBountyRequest(makeState({ engagementRequirements: eng }), 'draft');
      expect(result).not.toHaveProperty('engagementRequirements');
    });

    it('should detect engagement when only comment is true', () => {
      const eng = { tagAccount: null, mention: false, comment: true };
      const result = buildCreateBountyRequest(makeState({ engagementRequirements: eng }), 'draft');
      expect(result.engagementRequirements).toEqual(eng);
    });
  });

  // --------------------------------------------------------------------------
  // Payout metrics edge cases
  // --------------------------------------------------------------------------
  describe('payout metrics detection', () => {
    it('should include payoutMetrics when all three values are set', () => {
      const pm = { minViews: 100, minLikes: 50, minComments: 10 };
      const result = buildCreateBountyRequest(makeState({ payoutMetrics: pm }), 'draft');
      expect(result.payoutMetrics).toEqual(pm);
    });

    it('should include payoutMetrics when only minComments is set', () => {
      const pm = { minViews: null, minLikes: null, minComments: 5 };
      const result = buildCreateBountyRequest(makeState({ payoutMetrics: pm }), 'draft');
      expect(result.payoutMetrics).toEqual(pm);
    });

    it('should not include payoutMetrics in full mode when all null', () => {
      const pm = { minViews: null, minLikes: null, minComments: null };
      const result = buildCreateBountyRequest(makeFilledState({ payoutMetrics: pm }), 'full');
      expect(result.payoutMetrics).toBeUndefined();
    });
  });
});
