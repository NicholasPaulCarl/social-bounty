import {
  BOUNTY_PRESETS,
  getPresetFormState,
  isBountyPresetId,
  type BountyPresetId,
} from '../bounty-presets';
import {
  ContentFormat,
  PostFormat,
  RewardType,
  SocialChannel,
} from '@social-bounty/shared';

describe('BOUNTY_PRESETS registry', () => {
  it('exposes the four expected presets in order', () => {
    expect(BOUNTY_PRESETS.map((p) => p.id)).toEqual([
      'blank',
      'social-exposure',
      'check-ins',
      'product-sales',
    ]);
  });

  it('every preset has a label, description, and Icon', () => {
    for (const preset of BOUNTY_PRESETS) {
      expect(typeof preset.label).toBe('string');
      expect(preset.label.length).toBeGreaterThan(0);
      expect(typeof preset.description).toBe('string');
      expect(preset.description.length).toBeGreaterThan(0);
      // Icons in lucide-react resolve to functions/components.
      expect(preset.Icon).toBeDefined();
    }
  });

  it('blank preset has no platforms field (or empty array)', () => {
    const blank = BOUNTY_PRESETS.find((p) => p.id === 'blank')!;
    expect(blank.platforms == null || blank.platforms.length === 0).toBe(true);
  });

  it('social-exposure preset platforms are Instagram, Facebook, TikTok', () => {
    const preset = BOUNTY_PRESETS.find((p) => p.id === 'social-exposure')!;
    expect(preset.platforms).toEqual([
      SocialChannel.INSTAGRAM,
      SocialChannel.FACEBOOK,
      SocialChannel.TIKTOK,
    ]);
  });

  it('check-ins preset platforms are Facebook, Instagram', () => {
    const preset = BOUNTY_PRESETS.find((p) => p.id === 'check-ins')!;
    expect(preset.platforms).toEqual([
      SocialChannel.FACEBOOK,
      SocialChannel.INSTAGRAM,
    ]);
  });

  it('product-sales preset platforms are Instagram, TikTok', () => {
    const preset = BOUNTY_PRESETS.find((p) => p.id === 'product-sales')!;
    expect(preset.platforms).toEqual([
      SocialChannel.INSTAGRAM,
      SocialChannel.TIKTOK,
    ]);
  });
});

describe('isBountyPresetId guard', () => {
  it.each<[unknown, boolean]>([
    ['blank', true],
    ['social-exposure', true],
    ['check-ins', true],
    ['product-sales', true],
    ['Blank', false],
    ['', false],
    [null, false],
    [undefined, false],
    [42, false],
    ['unknown-preset', false],
  ])('isBountyPresetId(%p) → %p', (input, expected) => {
    expect(isBountyPresetId(input)).toBe(expected);
  });
});

describe('getPresetFormState', () => {
  it('blank returns an empty partial', () => {
    const state = getPresetFormState('blank');
    expect(state).toEqual({});
  });

  it('social-exposure seeds Instagram/Facebook/TikTok with BOTH and AI off', () => {
    const state = getPresetFormState('social-exposure');
    expect(state.channels).toEqual({
      [SocialChannel.INSTAGRAM]: [
        PostFormat.FEED_POST,
        PostFormat.STORY,
        PostFormat.REEL,
      ],
      [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.STORY],
      [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
    });
    expect(state.contentFormat).toBe(ContentFormat.BOTH);
    expect(state.aiContentPermitted).toBe(false);
  });

  it('check-ins seeds Facebook/Instagram and a location instruction step', () => {
    const state = getPresetFormState('check-ins');
    expect(state.channels).toEqual({
      [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.STORY],
      [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST, PostFormat.STORY],
    });
    expect(state.instructionSteps).toEqual([
      'Visit the location and check in on the platform',
    ]);
    // No location-verification feature is added — the preset only
    // contributes channels + a guidance step.
    expect(state).not.toHaveProperty('structuredEligibility');
  });

  it('product-sales seeds Instagram/TikTok and a single empty PRODUCT reward', () => {
    const state = getPresetFormState('product-sales');
    expect(state.channels).toEqual({
      [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST, PostFormat.REEL],
      [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
    });
    expect(state.rewards).toEqual([
      { rewardType: RewardType.PRODUCT, name: '', monetaryValue: 0 },
    ]);
  });

  it('every preset seed only references valid shared enums', () => {
    const validChannels = Object.values(SocialChannel);
    const validFormats = Object.values(PostFormat);
    const validContentFormats = Object.values(ContentFormat);
    const validRewardTypes = Object.values(RewardType);

    const ids: BountyPresetId[] = [
      'blank',
      'social-exposure',
      'check-ins',
      'product-sales',
    ];
    for (const id of ids) {
      const state = getPresetFormState(id);
      if (state.channels) {
        for (const [ch, formats] of Object.entries(state.channels)) {
          expect(validChannels).toContain(ch);
          for (const f of formats ?? []) {
            expect(validFormats).toContain(f);
          }
        }
      }
      if (state.contentFormat !== undefined) {
        expect(validContentFormats).toContain(state.contentFormat);
      }
      for (const reward of state.rewards ?? []) {
        expect(validRewardTypes).toContain(reward.rewardType);
      }
    }
  });
});
