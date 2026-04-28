/**
 * Wave B — wizard shell + step validation + preset hydration tests.
 *
 * The web jest harness is pure (`testEnvironment: 'node'`,
 * `testRegex: '.*\\.test\\.ts$'`, no jsdom, no @testing-library/react).
 * The wizard's full visual contract — Back/Next click handling, focus
 * management, ARIA states — is covered by Playwright E2E. These tests
 * lock in the pure logic the shell relies on:
 *
 *   1. `validateStep(stepIdx, state)` returns the step-scoped subset of
 *      `validateFull` errors that gates Next-click forward navigation.
 *   2. `WIZARD_STEP_SECTIONS` covers all 5 steps with the documented
 *      section-key mapping.
 *   3. `initBountyFormState` (the pure reducer initializer extracted from
 *      `useCreateBountyForm`) spreads the override over `INITIAL_FORM_STATE`
 *      once, with edit mode (`initialBounty`) trumping the preset.
 *   4. `bounty-presets.ts` stub returns sane defaults the integration
 *      pass can replace without breaking imports.
 */
import {
  validateStep,
  WIZARD_STEP_SECTIONS,
  WIZARD_STEP_COUNT,
} from '../validation';
import { INITIAL_FORM_STATE, type BountyFormState } from '../types';
import { initBountyFormState } from '../useCreateBountyForm';
import {
  isBountyPresetId,
  getPresetFormState,
  BOUNTY_PRESET_IDS,
  type BountyPresetId,
} from '../bounty-presets';
import {
  Currency,
  RewardType,
  SocialChannel,
  PostFormat,
  ContentFormat,
} from '@social-bounty/shared';

function makeState(overrides: Partial<BountyFormState> = {}): BountyFormState {
  return { ...INITIAL_FORM_STATE, ...overrides };
}

// ============================================================================
// validateStep — per-step error subsetting
// ============================================================================

describe('validateStep', () => {
  describe('step mapping', () => {
    it('exposes 5 wizard steps', () => {
      expect(WIZARD_STEP_COUNT).toBe(5);
      expect(WIZARD_STEP_SECTIONS).toHaveLength(5);
    });

    it('step 0 (Basics) owns bountyBasicInfo errors', () => {
      expect(WIZARD_STEP_SECTIONS[0]).toEqual(['bountyBasicInfo']);
    });

    it('step 4 (Document Share) owns brandAssets errors only', () => {
      expect(WIZARD_STEP_SECTIONS[4]).toEqual(['brandAssets']);
    });

    it('step 3 (Claim & Rewards) owns bountyContent errors', () => {
      expect(WIZARD_STEP_SECTIONS[3]).toEqual(['bountyContent']);
    });
  });

  describe('step 0 — Basics blocks on missing required fields', () => {
    it('blocks Next when title is empty', () => {
      const state = makeState({
        title: '',
        shortDescription: 'desc',
        instructionSteps: ['Do thing'],
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
      });
      const errs = validateStep(0, state);
      expect(errs.title).toBeDefined();
    });

    it('blocks Next when channels are missing', () => {
      const state = makeState({
        title: 'My bounty',
        shortDescription: 'desc',
        instructionSteps: ['Do thing'],
        channels: {},
      });
      const errs = validateStep(0, state);
      expect(errs.channels).toBeDefined();
    });

    it('passes Next when step 0 fields are complete', () => {
      const state = makeState({
        title: 'My bounty',
        shortDescription: 'desc',
        instructionSteps: ['Do thing'],
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        contentFormat: ContentFormat.VIDEO_ONLY,
      });
      const errs = validateStep(0, state);
      expect(Object.keys(errs)).toHaveLength(0);
    });

    it('does not include reward errors at step 0 even if rewards are invalid', () => {
      const state = makeState({
        title: 'My bounty',
        shortDescription: 'desc',
        instructionSteps: ['Do thing'],
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        rewards: [{ rewardType: RewardType.PRODUCT, name: '', monetaryValue: 0 }],
      });
      const errs = validateStep(0, state);
      // Reward errors belong to bountyContent (step 3), not step 0.
      expect(errs.rewards).toBeUndefined();
      expect(Object.keys(errs).filter((k) => k.startsWith('reward_'))).toHaveLength(0);
    });
  });

  describe('step 3 — Claim & Rewards', () => {
    it('blocks Next when a non-CASH reward is missing a name', () => {
      const state = makeState({
        rewards: [{ rewardType: RewardType.PRODUCT, name: '', monetaryValue: 100 }],
      });
      const errs = validateStep(3, state);
      expect(errs.reward_0_name).toBeDefined();
    });

    it('does not block Next when CASH rewards have empty names (UI hides the input)', () => {
      const state = makeState({
        rewards: [{ rewardType: RewardType.CASH, name: '', monetaryValue: 100 }],
      });
      const errs = validateStep(3, state);
      // CASH rewards skip the name check by design (see validateFull §Section 5).
      expect(errs.reward_0_name).toBeUndefined();
    });

    it('does not include channel errors at step 3', () => {
      const state = makeState({
        channels: {}, // step 0 required, step 3 doesn't gate on it
        rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 50 }],
      });
      const errs = validateStep(3, state);
      expect(errs.channels).toBeUndefined();
    });
  });

  describe('step 4 — Document Share', () => {
    it('never blocks Next (brand assets are optional)', () => {
      // Even with a deeply-broken state, step 4 has no required fields.
      const state = makeState({
        title: '',
        shortDescription: '',
        channels: {},
        rewards: [],
      });
      const errs = validateStep(4, state);
      expect(Object.keys(errs)).toHaveLength(0);
    });
  });

  describe('out-of-range step indices', () => {
    it('returns empty errors for step indices outside the wizard range', () => {
      expect(validateStep(99, makeState())).toEqual({});
      expect(validateStep(-1, makeState())).toEqual({});
    });
  });
});

// ============================================================================
// initBountyFormState — pure reducer initializer
// ============================================================================

describe('initBountyFormState', () => {
  it('hydrates from initialFormOverride when no edit-mode bounty is supplied', () => {
    const override: Partial<BountyFormState> = {
      title: 'Preset Bounty',
      contentFormat: ContentFormat.VIDEO_ONLY,
      channels: { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] },
    };
    const state = initBountyFormState(INITIAL_FORM_STATE, undefined, override);
    expect(state.title).toBe('Preset Bounty');
    expect(state.contentFormat).toBe(ContentFormat.VIDEO_ONLY);
    expect(state.channels).toEqual({
      [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
    });
  });

  it('returns INITIAL_FORM_STATE unchanged when neither override nor bounty is provided', () => {
    const state = initBountyFormState(INITIAL_FORM_STATE);
    expect(state).toEqual(INITIAL_FORM_STATE);
  });

  it('preserves INITIAL_FORM_STATE fields not present in the override', () => {
    const override: Partial<BountyFormState> = {
      title: 'Just a title',
    };
    const state = initBountyFormState(INITIAL_FORM_STATE, undefined, override);
    expect(state.title).toBe('Just a title');
    // Untouched defaults survive the spread.
    expect(state.proofRequirements).toEqual(['url']);
    expect(state.aiContentPermitted).toBe(false);
    expect(state.currency).toBe(Currency.ZAR);
  });

  it('edit mode (initialBounty) trumps the preset when both are provided', () => {
    const override: Partial<BountyFormState> = {
      title: 'PRESET title',
      contentFormat: ContentFormat.VIDEO_ONLY,
    };
    const initialBounty = {
      id: 'b1',
      title: 'Edit-mode title',
      shortDescription: 'edit desc',
      contentFormat: ContentFormat.PHOTO_ONLY,
      fullInstructions: '',
      instructionSteps: ['x'],
      channels: { [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST] },
      aiContentPermitted: false,
      engagementRequirements: { tagAccount: null, mention: false, comment: false },
      postVisibility: null,
      currency: Currency.ZAR,
      rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: '100' }],
      payoutMethod: null,
      structuredEligibility: {
        minFollowers: null,
        publicProfile: false,
        minAccountAgeDays: null,
        locationRestriction: null,
        noCompetingBrandDays: null,
        customRules: [],
      },
      proofRequirements: 'url',
      maxSubmissions: null,
      startDate: null,
      endDate: null,
      payoutMetrics: null,
      brandAssets: [],
      accessType: 'PUBLIC',
    } as unknown as Parameters<typeof initBountyFormState>[1];

    const state = initBountyFormState(INITIAL_FORM_STATE, initialBounty, override);
    // Edit-mode title wins; preset's "PRESET title" never landed.
    expect(state.title).toBe('Edit-mode title');
    expect(state.contentFormat).toBe(ContentFormat.PHOTO_ONLY);
  });

  it('is idempotent — calling twice with the same args produces equivalent state', () => {
    // The hook contract relies on initializer-only application; even a
    // second call with the same input must yield the same shape (it
    // doesn't mutate the base, doesn't accumulate). React invokes init
    // exactly once per instance, so this is mostly defensive.
    const override: Partial<BountyFormState> = { title: 'X' };
    const a = initBountyFormState(INITIAL_FORM_STATE, undefined, override);
    const b = initBountyFormState(INITIAL_FORM_STATE, undefined, override);
    expect(a).toEqual(b);
    // INITIAL_FORM_STATE itself is unchanged.
    expect(INITIAL_FORM_STATE.title).toBe('');
  });
});

// ============================================================================
// bounty-presets.ts — stub contract
// ============================================================================

describe('bounty-presets stub', () => {
  it('lists the four expected preset ids', () => {
    expect(BOUNTY_PRESET_IDS).toEqual([
      'blank',
      'social-exposure',
      'check-ins',
      'product-sales',
    ]);
  });

  it('isBountyPresetId narrows valid ids', () => {
    expect(isBountyPresetId('blank')).toBe(true);
    expect(isBountyPresetId('social-exposure')).toBe(true);
    expect(isBountyPresetId('not-a-preset')).toBe(false);
    expect(isBountyPresetId(null)).toBe(false);
    expect(isBountyPresetId(undefined)).toBe(false);
    expect(isBountyPresetId('')).toBe(false);
  });

  it('getPresetFormState returns a Partial<BountyFormState> for every id', () => {
    for (const id of BOUNTY_PRESET_IDS) {
      const partial = getPresetFormState(id as BountyPresetId);
      // Stub returns {} — Wave A replaces with real partials. The
      // contract this test locks in is "the function exists and
      // returns a Partial<BountyFormState>" (importable, callable,
      // type-correct).
      expect(typeof partial).toBe('object');
      expect(partial).not.toBeNull();
    }
  });
});
