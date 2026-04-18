import {
  derivePreviewChecks,
  hasAnyPreviewChecks,
  pairKey,
  ELIGIBILITY_KEY,
} from '@/lib/utils/bounty-preview-checks';
import {
  BountyAccessType,
  BountyStatus,
  ContentFormat,
  Currency,
  PaymentStatus,
  PostFormat,
  RewardType,
  SocialChannel,
  type BountyDetailResponse,
} from '@social-bounty/shared';

// ─── Fixture helpers ──────────────────────────────────────────────────────

function makeBounty(overrides: Partial<BountyDetailResponse> = {}): BountyDetailResponse {
  return {
    id: 'bounty-1',
    title: 'Test bounty',
    shortDescription: '',
    contentFormat: ContentFormat.BOTH,
    fullInstructions: '',
    instructionSteps: [],
    category: 'OTHER',
    rewardType: RewardType.CASH,
    rewardValue: '100',
    rewardDescription: null,
    maxSubmissions: null,
    remainingSubmissions: null,
    startDate: null,
    endDate: null,
    eligibilityRules: '',
    proofRequirements: 'url',
    status: BountyStatus.LIVE,
    submissionCount: 0,
    brand: { id: 'b1', name: 'Brand' },
    createdBy: { id: 'u1', firstName: 'A', lastName: 'B' },
    userSubmission: null,
    createdAt: '2026-04-18T00:00:00Z',
    updatedAt: '2026-04-18T00:00:00Z',
    channels: null,
    currency: Currency.ZAR,
    aiContentPermitted: true,
    engagementRequirements: null,
    postVisibility: null,
    structuredEligibility: null,
    visibilityAcknowledged: false,
    rewards: [],
    totalRewardValue: '100',
    payoutMetrics: null,
    paymentStatus: PaymentStatus.PAID,
    payoutMethod: null,
    brandAssets: [],
    accessType: BountyAccessType.PUBLIC,
    ...overrides,
  };
}

// ─── Empty / no-rules bounty ──────────────────────────────────────────────

describe('derivePreviewChecks — empty bounty', () => {
  it('returns {} when bounty has no engagement, no metrics, no eligibility, BOTH content format, no channels', () => {
    const bounty = makeBounty();
    expect(derivePreviewChecks(bounty)).toEqual({});
  });

  it('emits only formatMatch for a detectable channel/format pair with no other rules', () => {
    // formatMatch IS a check the scraper runs on every IG/TikTok URL — verifies
    // the URL points to the right format. It's useful info to surface even when
    // no other rules exist.
    const bounty = makeBounty({
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    });
    const result = derivePreviewChecks(bounty);
    const checks = result[pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL)];
    expect(checks).toHaveLength(1);
    expect(checks[0].rule).toBe('formatMatch');
  });

  it('returns no checks for Facebook channels with no other rules (no URL hint)', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST] },
    });
    const result = derivePreviewChecks(bounty);
    expect(result[pairKey(SocialChannel.FACEBOOK, PostFormat.FEED_POST)]).toEqual([]);
  });

  it('hasAnyPreviewChecks is false for fully empty bounty', () => {
    expect(hasAnyPreviewChecks(makeBounty())).toBe(false);
  });

  it('hasAnyPreviewChecks is false for Facebook-only bounty with no rules', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST] },
    });
    expect(hasAnyPreviewChecks(bounty)).toBe(false);
  });

  it('hasAnyPreviewChecks is true for IG/TikTok-only bounty (formatMatch always fires)', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    });
    expect(hasAnyPreviewChecks(bounty)).toBe(true);
  });
});

// ─── Eligibility-only bounty ──────────────────────────────────────────────

describe('derivePreviewChecks — eligibility-only', () => {
  it('emits eligibility group for minFollowers', () => {
    const bounty = makeBounty({
      structuredEligibility: { minFollowers: 1000 },
    });
    const result = derivePreviewChecks(bounty);
    expect(result[ELIGIBILITY_KEY]).toEqual([
      { rule: 'minFollowers', required: 1000, actual: null, pass: false },
    ]);
  });

  it('emits eligibility group for publicProfile === true (skips when false/missing)', () => {
    const t = derivePreviewChecks(
      makeBounty({ structuredEligibility: { publicProfile: true } }),
    );
    expect(t[ELIGIBILITY_KEY]).toEqual([
      { rule: 'publicProfile', required: true, actual: null, pass: false },
    ]);

    const f = derivePreviewChecks(
      makeBounty({ structuredEligibility: { publicProfile: false } }),
    );
    expect(f[ELIGIBILITY_KEY]).toBeUndefined();
  });

  it('emits eligibility group for minAccountAgeDays', () => {
    const bounty = makeBounty({
      structuredEligibility: { minAccountAgeDays: 30 },
    });
    const result = derivePreviewChecks(bounty);
    expect(result[ELIGIBILITY_KEY]).toEqual([
      { rule: 'minAccountAgeDays', required: 30, actual: null, pass: false },
    ]);
  });

  it('combines multiple eligibility rules in order', () => {
    const bounty = makeBounty({
      structuredEligibility: {
        minFollowers: 500,
        publicProfile: true,
        minAccountAgeDays: 14,
      },
    });
    const result = derivePreviewChecks(bounty);
    expect(result[ELIGIBILITY_KEY]).toHaveLength(3);
    expect(result[ELIGIBILITY_KEY].map((c) => c.rule)).toEqual([
      'minFollowers',
      'publicProfile',
      'minAccountAgeDays',
    ]);
  });

  it('hasAnyPreviewChecks is true when only eligibility rules are set', () => {
    expect(
      hasAnyPreviewChecks(
        makeBounty({ structuredEligibility: { minFollowers: 100 } }),
      ),
    ).toBe(true);
  });
});

// ─── Full bounty exercising every rule type ───────────────────────────────

describe('derivePreviewChecks — all 10 rule types', () => {
  const fullBounty = makeBounty({
    contentFormat: ContentFormat.VIDEO_ONLY,
    channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    engagementRequirements: { tagAccount: '@brand', mention: true },
    payoutMetrics: { minViews: 1000, minLikes: 50, minComments: 5 },
    structuredEligibility: {
      minFollowers: 500,
      publicProfile: true,
      minAccountAgeDays: 30,
    },
  });

  const result = derivePreviewChecks(fullBounty);

  it('emits all 3 eligibility checks', () => {
    expect(result[ELIGIBILITY_KEY]).toHaveLength(3);
  });

  it('emits all 7 per-URL checks for the (Instagram, Reel) pair', () => {
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL);
    const checks = result[key];
    expect(checks.map((c) => c.rule)).toEqual([
      'tagAccount',
      'mention',
      'minViews',
      'minLikes',
      'minComments',
      'contentFormat',
      'formatMatch',
    ]);
  });

  it('every check has actual:null and pass:false (preview shape)', () => {
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL);
    for (const check of result[key]) {
      expect(check.actual).toBeNull();
      expect(check.pass).toBe(false);
    }
  });

  it('contentFormat carries the bounty value as `required`', () => {
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL);
    const check = result[key].find((c) => c.rule === 'contentFormat');
    expect(check?.required).toBe(ContentFormat.VIDEO_ONLY);
  });

  it('formatMatch carries the format as `required`', () => {
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL);
    const check = result[key].find((c) => c.rule === 'formatMatch');
    expect(check?.required).toBe(PostFormat.REEL);
  });

  it('tagAccount carries the handle string', () => {
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL);
    const check = result[key].find((c) => c.rule === 'tagAccount');
    expect(check?.required).toBe('@brand');
  });
});

// ─── Partial-rule bounties (only declared rules emitted) ──────────────────

describe('derivePreviewChecks — partial rules', () => {
  it('emits only minViews when only minViews is set', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] },
      payoutMetrics: { minViews: 10_000 },
    });
    const result = derivePreviewChecks(bounty);
    const key = pairKey(SocialChannel.TIKTOK, PostFormat.VIDEO_POST);
    expect(result[key].map((c) => c.rule)).toEqual(['minViews', 'formatMatch']);
  });

  it('skips tagAccount when handle is empty string', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST] },
      engagementRequirements: { tagAccount: '   ' },
    });
    const result = derivePreviewChecks(bounty);
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.FEED_POST);
    expect(result[key].some((c) => c.rule === 'tagAccount')).toBe(false);
  });

  it('skips mention when mention is false (or undefined)', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST] },
      engagementRequirements: { mention: false },
    });
    const result = derivePreviewChecks(bounty);
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.FEED_POST);
    expect(result[key].some((c) => c.rule === 'mention')).toBe(false);
  });

  it('skips contentFormat when bounty allows BOTH', () => {
    const bounty = makeBounty({
      contentFormat: ContentFormat.BOTH,
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    });
    const result = derivePreviewChecks(bounty);
    const key = pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL);
    expect(result[key].some((c) => c.rule === 'contentFormat')).toBe(false);
  });

  it('skips formatMatch on Facebook (no URL hint)', () => {
    const bounty = makeBounty({
      channels: { [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.REEL] },
      payoutMetrics: { minViews: 100 },
    });
    const result = derivePreviewChecks(bounty);
    const fbFeed = pairKey(SocialChannel.FACEBOOK, PostFormat.FEED_POST);
    const fbReel = pairKey(SocialChannel.FACEBOOK, PostFormat.REEL);
    expect(result[fbFeed].some((c) => c.rule === 'formatMatch')).toBe(false);
    expect(result[fbReel].some((c) => c.rule === 'formatMatch')).toBe(false);
  });
});

// ─── Multi-channel + multi-format coverage ────────────────────────────────

describe('derivePreviewChecks — multi-channel coverage', () => {
  it('emits one group per (channel, format) pair, with same rule shape per pair', () => {
    const bounty = makeBounty({
      channels: {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST],
        [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
      },
      engagementRequirements: { mention: true },
      payoutMetrics: { minViews: 1000 },
    });
    const result = derivePreviewChecks(bounty);
    const keys = Object.keys(result).filter((k) => k !== ELIGIBILITY_KEY);
    expect(keys).toHaveLength(3);
    expect(keys.sort()).toEqual(
      [
        pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL),
        pairKey(SocialChannel.INSTAGRAM, PostFormat.FEED_POST),
        pairKey(SocialChannel.TIKTOK, PostFormat.VIDEO_POST),
      ].sort(),
    );
    // Each pair has the same engagement/metrics rules, but only IG-Reel and IG-FeedPost
    // and TikTok-Video pick up formatMatch (all 3 are detectable).
    for (const key of keys) {
      const rules = result[key].map((c) => c.rule);
      expect(rules).toContain('mention');
      expect(rules).toContain('minViews');
      expect(rules).toContain('formatMatch');
    }
  });

  it('preserves channel/format identity across pairs', () => {
    const bounty = makeBounty({
      channels: {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.STORY],
      },
      payoutMetrics: { minLikes: 10 },
    });
    const result = derivePreviewChecks(bounty);
    const reelChecks = result[pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL)];
    const storyChecks = result[pairKey(SocialChannel.INSTAGRAM, PostFormat.STORY)];
    const reelFormatMatch = reelChecks.find((c) => c.rule === 'formatMatch');
    const storyFormatMatch = storyChecks.find((c) => c.rule === 'formatMatch');
    expect(reelFormatMatch?.required).toBe(PostFormat.REEL);
    expect(storyFormatMatch?.required).toBe(PostFormat.STORY);
  });

  it('hasAnyPreviewChecks reflects per-URL rules even with eligibility absent', () => {
    expect(
      hasAnyPreviewChecks(
        makeBounty({
          channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
          engagementRequirements: { mention: true },
        }),
      ),
    ).toBe(true);
  });
});
