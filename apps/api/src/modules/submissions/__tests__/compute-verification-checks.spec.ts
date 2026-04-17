import { ContentFormat, PostFormat, SocialChannel } from '@social-bounty/shared';
import type { ScrapedPostData } from '@social-bounty/shared';
import { computeVerificationChecks } from '../compute-verification-checks';

const baseScraped: ScrapedPostData = {
  likes: 100,
  comments: 10,
  views: 5000,
  caption: 'Loving the new @acme launch! #ad',
  taggedUsernames: ['friend1', 'acme'],
  ownerUsername: 'hunter1',
  postedAt: '2026-04-17T00:00:00.000Z',
  isVideo: true,
  detectedFormat: PostFormat.REEL,
};

function noRules() {
  return {
    engagementRequirements: null,
    payoutMetrics: null,
    contentFormat: ContentFormat.BOTH,
  };
}

describe('computeVerificationChecks', () => {
  // ── 10 rule cases ──────────────────────────────────────

  it('rule: tagAccount passes when handle in taggedUsernames', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: {
        ...noRules(),
        engagementRequirements: { tagAccount: '@acme' },
      },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    const rule = checks.find((c) => c.rule === 'tagAccount');
    expect(rule?.pass).toBe(true);
  });

  it('rule: tagAccount fails when handle missing from tags and caption', () => {
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, taggedUsernames: [], caption: 'no tag here' },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: {
        ...noRules(),
        engagementRequirements: { tagAccount: 'acme' },
      },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks.find((c) => c.rule === 'tagAccount')?.pass).toBe(false);
  });

  it('rule: mention passes when caption has any @-mention', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: { ...noRules(), engagementRequirements: { mention: true } },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks.find((c) => c.rule === 'mention')?.pass).toBe(true);
  });

  it('rule: minViews fails when views below threshold', () => {
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, views: 100 },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: { ...noRules(), payoutMetrics: { minViews: 1000 } },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    const rule = checks.find((c) => c.rule === 'minViews');
    expect(rule?.pass).toBe(false);
    expect(rule?.required).toBe(1000);
    expect(rule?.actual).toBe(100);
  });

  it('rule: minLikes passes when likes meet threshold', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: { ...noRules(), payoutMetrics: { minLikes: 50 } },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks.find((c) => c.rule === 'minLikes')?.pass).toBe(true);
  });

  it('rule: minComments fails on null/zero scraped comments', () => {
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, comments: null },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: { ...noRules(), payoutMetrics: { minComments: 5 } },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    const rule = checks.find((c) => c.rule === 'minComments');
    expect(rule?.pass).toBe(false);
    expect(rule?.actual).toBe(0);
  });

  it('rule: contentFormat VIDEO_ONLY fails when scraped post is photo', () => {
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, isVideo: false },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.FEED_POST,
      bountyRules: { ...noRules(), contentFormat: ContentFormat.VIDEO_ONLY },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks.find((c) => c.rule === 'contentFormat')?.pass).toBe(false);
  });

  it('rule: contentFormat PHOTO_ONLY passes when scraped post is photo', () => {
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, isVideo: false },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.FEED_POST,
      bountyRules: { ...noRules(), contentFormat: ContentFormat.PHOTO_ONLY },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks.find((c) => c.rule === 'contentFormat')?.pass).toBe(true);
  });

  it('rule: formatMatch fails when scraped detectedFormat differs from expected', () => {
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, detectedFormat: PostFormat.REEL },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.FEED_POST,
      // Trigger with any rule so the function returns more than zero entries
      bountyRules: { ...noRules(), payoutMetrics: { minLikes: 1 } },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    const rule = checks.find((c) => c.rule === 'formatMatch');
    expect(rule?.pass).toBe(false);
    expect(rule?.required).toBe(PostFormat.FEED_POST);
    expect(rule?.actual).toBe(PostFormat.REEL);
  });

  it('rule: minFollowers fails on insufficient follower count', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: noRules(),
      hunterEligibility: { followerCount: 500, isPublic: true, accountAgeDays: 365 },
      bountyEligibility: { minFollowers: 1000 },
    });
    expect(checks.find((c) => c.rule === 'minFollowers')?.pass).toBe(false);
  });

  it('rule: publicProfile fails when hunter profile is private', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: noRules(),
      hunterEligibility: { followerCount: 1000, isPublic: false, accountAgeDays: 365 },
      bountyEligibility: { publicProfile: true },
    });
    const rule = checks.find((c) => c.rule === 'publicProfile');
    expect(rule?.pass).toBe(false);
  });

  it('rule: minAccountAgeDays passes on a sufficiently old hunter account', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: noRules(),
      hunterEligibility: { followerCount: 1000, isPublic: true, accountAgeDays: 365 },
      bountyEligibility: { minAccountAgeDays: 90 },
    });
    expect(checks.find((c) => c.rule === 'minAccountAgeDays')?.pass).toBe(true);
  });

  // ── 3 edge cases ───────────────────────────────────────

  it('handles null scraped data gracefully — rules still emit but read defaults', () => {
    const checks = computeVerificationChecks({
      scraped: null,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: {
        ...noRules(),
        payoutMetrics: { minViews: 10 },
      },
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks).toHaveLength(1);
    expect(checks[0].rule).toBe('minViews');
    expect(checks[0].actual).toBe(0);
    expect(checks[0].pass).toBe(false);
  });

  it('skips eligibility checks when hunterEligibility is null', () => {
    const checks = computeVerificationChecks({
      scraped: baseScraped,
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: noRules(),
      hunterEligibility: null,
      bountyEligibility: { minFollowers: 1000, publicProfile: true, minAccountAgeDays: 90 },
    });
    // No eligibility entries when hunterEligibility null — eligibility branch
    // skips entirely (this is the "non-first URL" case in a multi-URL submission).
    expect(checks.find((c) => c.rule === 'minFollowers')).toBeUndefined();
    expect(checks.find((c) => c.rule === 'publicProfile')).toBeUndefined();
    expect(checks.find((c) => c.rule === 'minAccountAgeDays')).toBeUndefined();
  });

  it('returns empty array when bounty has no rules and scrape gave no detectedFormat', () => {
    // formatMatch emits whenever detectedFormat is non-null, independent of
    // other rules — so to assert true zero-checks the scrape must lack a
    // detected format (the Facebook case in production).
    const checks = computeVerificationChecks({
      scraped: { ...baseScraped, detectedFormat: null },
      expectedChannel: SocialChannel.INSTAGRAM,
      expectedFormat: PostFormat.REEL,
      bountyRules: noRules(),
      hunterEligibility: null,
      bountyEligibility: null,
    });
    expect(checks).toEqual([]);
  });
});
