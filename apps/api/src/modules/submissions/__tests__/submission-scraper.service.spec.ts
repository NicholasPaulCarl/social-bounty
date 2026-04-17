import {
  ContentFormat,
  PostFormat,
  SocialChannel,
  SocialPlatform,
} from '@social-bounty/shared';
import type { ScrapedPostData } from '@social-bounty/shared';
import { SubmissionScraperService } from '../submission-scraper.service';

type Mock = jest.Mock;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePrisma(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    submission: { findUnique: jest.fn() },
    submissionUrlScrape: {
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    userSocialHandle: { findMany: jest.fn().mockResolvedValue([]) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: jest.fn((arg: any) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      if (typeof arg === 'function') return arg(prisma);
      return Promise.resolve();
    }),
  };
  return prisma;
}

function makeRedis(acquired = true) {
  return {
    setNxEx: jest.fn().mockResolvedValue(acquired),
    del: jest.fn().mockResolvedValue(undefined),
  };
}

function makeApify() {
  return {
    scrapeInstagramPosts: jest.fn().mockResolvedValue(new Map()),
    scrapeTiktokPosts: jest.fn().mockResolvedValue(new Map()),
    scrapeFacebookPosts: jest.fn().mockResolvedValue(new Map()),
  };
}

function basicSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    userId: 'hunter-1',
    urlScrapes: [
      {
        id: 'scrape-1',
        url: 'https://instagram.com/reels/AAA',
        channel: SocialChannel.INSTAGRAM,
        format: PostFormat.REEL,
        scrapeStatus: 'PENDING',
      },
    ],
    bounty: {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
      engagementRequirements: { tagAccount: 'acme' },
      payoutMetrics: null,
      contentFormat: ContentFormat.BOTH,
      structuredEligibility: null,
    },
    ...overrides,
  };
}

const VALID_SCRAPE: ScrapedPostData = {
  likes: 100,
  comments: 10,
  views: 5000,
  caption: '@acme thanks!',
  taggedUsernames: ['acme'],
  ownerUsername: 'hunter1',
  postedAt: '2026-04-17T00:00:00.000Z',
  isVideo: true,
  detectedFormat: PostFormat.REEL,
};

describe('SubmissionScraperService', () => {
  it('cost guard skips Apify when bounty has no rules to verify', async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    const apify = makeApify();
    prisma.submission.findUnique.mockResolvedValue({
      ...basicSubmission(),
      bounty: {
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        engagementRequirements: null,
        payoutMetrics: null,
        contentFormat: ContentFormat.BOTH,
        structuredEligibility: null,
      },
    });

    const svc = new SubmissionScraperService(
      prisma as never,
      redis as never,
      apify as never,
    );
    await svc.scrapeAndVerify('sub-1');

    expect(apify.scrapeInstagramPosts).not.toHaveBeenCalled();
    expect(apify.scrapeTiktokPosts).not.toHaveBeenCalled();
    expect(apify.scrapeFacebookPosts).not.toHaveBeenCalled();
    // PENDING row is flipped to VERIFIED with empty checks
    expect(prisma.submissionUrlScrape.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'scrape-1' },
        data: expect.objectContaining({ scrapeStatus: 'VERIFIED' }),
      }),
    );
    expect(redis.del).toHaveBeenCalled();
  });

  it('lock contention: skip when another run holds the lock', async () => {
    const prisma = makePrisma();
    const redis = makeRedis(false);
    const apify = makeApify();
    const svc = new SubmissionScraperService(
      prisma as never,
      redis as never,
      apify as never,
    );

    await svc.scrapeAndVerify('sub-1');

    expect(prisma.submission.findUnique).not.toHaveBeenCalled();
    expect(apify.scrapeInstagramPosts).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('success path transitions PENDING → VERIFIED with checks attached', async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    const apify = makeApify();
    apify.scrapeInstagramPosts.mockResolvedValue(
      new Map([['https://instagram.com/reels/AAA', VALID_SCRAPE]]),
    );
    prisma.submission.findUnique.mockResolvedValue(basicSubmission());

    const svc = new SubmissionScraperService(
      prisma as never,
      redis as never,
      apify as never,
    );
    await svc.scrapeAndVerify('sub-1');

    expect(apify.scrapeInstagramPosts).toHaveBeenCalledTimes(1);
    expect(prisma.submissionUrlScrape.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['scrape-1'] } },
      data: { scrapeStatus: 'IN_PROGRESS', errorMessage: null },
    });
    // Final commit: VERIFIED via the per-row update inside $transaction
    const updates = (prisma.submissionUrlScrape.update as Mock).mock.calls;
    const verifiedCall = updates.find(
      (c: unknown[]) =>
        (c[0] as { data?: { scrapeStatus?: string } })?.data?.scrapeStatus === 'VERIFIED',
    );
    expect(verifiedCall).toBeDefined();
  });

  it('partial failure: per-URL Apify error surfaces FAILED with errorMessage', async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    const apify = makeApify();
    apify.scrapeInstagramPosts.mockResolvedValue(
      new Map([['https://instagram.com/reels/AAA', { error: 'Actor timeout' }]]),
    );
    prisma.submission.findUnique.mockResolvedValue(basicSubmission());

    const svc = new SubmissionScraperService(
      prisma as never,
      redis as never,
      apify as never,
    );
    await svc.scrapeAndVerify('sub-1');

    const updates = (prisma.submissionUrlScrape.update as Mock).mock.calls;
    const failedCall = updates.find(
      (c: unknown[]) =>
        (c[0] as { data?: { scrapeStatus?: string } })?.data?.scrapeStatus === 'FAILED',
    );
    expect(failedCall).toBeDefined();
    expect(
      (failedCall![0] as { data: { errorMessage: string } }).data.errorMessage,
    ).toContain('Actor timeout');
  });

  it('cached VERIFIED rows are not re-scraped', async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    const apify = makeApify();
    prisma.submission.findUnique.mockResolvedValue({
      ...basicSubmission(),
      urlScrapes: [
        {
          id: 'scrape-1',
          url: 'https://instagram.com/reels/AAA',
          channel: SocialChannel.INSTAGRAM,
          format: PostFormat.REEL,
          scrapeStatus: 'VERIFIED',
        },
        {
          id: 'scrape-2',
          url: 'https://instagram.com/reels/BBB',
          channel: SocialChannel.INSTAGRAM,
          format: PostFormat.REEL,
          scrapeStatus: 'PENDING',
        },
      ],
    });
    apify.scrapeInstagramPosts.mockResolvedValue(
      new Map([['https://instagram.com/reels/BBB', VALID_SCRAPE]]),
    );

    const svc = new SubmissionScraperService(
      prisma as never,
      redis as never,
      apify as never,
    );
    await svc.scrapeAndVerify('sub-1');

    // Only the PENDING URL is sent to Apify
    expect(apify.scrapeInstagramPosts).toHaveBeenCalledWith([
      'https://instagram.com/reels/BBB',
    ]);
    // updateMany sets only the PENDING row to IN_PROGRESS, never the
    // VERIFIED scrape-1.
    expect(prisma.submissionUrlScrape.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['scrape-2'] } },
      data: { scrapeStatus: 'IN_PROGRESS', errorMessage: null },
    });
  });

  it('eligibility checks attach only to the first url scrape', async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    const apify = makeApify();
    prisma.submission.findUnique.mockResolvedValue({
      ...basicSubmission(),
      urlScrapes: [
        {
          id: 'scrape-first',
          url: 'https://instagram.com/reels/AAA',
          channel: SocialChannel.INSTAGRAM,
          format: PostFormat.REEL,
          scrapeStatus: 'PENDING',
          createdAt: new Date(2026, 0, 1),
        },
        {
          id: 'scrape-second',
          url: 'https://instagram.com/reels/BBB',
          channel: SocialChannel.INSTAGRAM,
          format: PostFormat.REEL,
          scrapeStatus: 'PENDING',
          createdAt: new Date(2026, 0, 2),
        },
      ],
      bounty: {
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        engagementRequirements: null,
        payoutMetrics: null,
        contentFormat: ContentFormat.BOTH,
        structuredEligibility: { minFollowers: 1000 },
      },
    });
    prisma.userSocialHandle.findMany.mockResolvedValue([
      {
        platform: SocialPlatform.INSTAGRAM,
        followerCount: 5000,
        createdAt: new Date(2025, 0, 1),
      },
    ]);
    apify.scrapeInstagramPosts.mockResolvedValue(
      new Map([
        ['https://instagram.com/reels/AAA', VALID_SCRAPE],
        ['https://instagram.com/reels/BBB', VALID_SCRAPE],
      ]),
    );

    const svc = new SubmissionScraperService(
      prisma as never,
      redis as never,
      apify as never,
    );
    await svc.scrapeAndVerify('sub-1');

    // Expect updates carry verificationChecks on each row.
    const updates = (prisma.submissionUrlScrape.update as Mock).mock.calls;
    const firstUpdate = updates.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'scrape-first',
    );
    const secondUpdate = updates.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'scrape-second',
    );

    const firstChecks = (firstUpdate![0] as { data: { verificationChecks: unknown[] } }).data
      .verificationChecks;
    const secondChecks = (secondUpdate![0] as { data: { verificationChecks: unknown[] } }).data
      .verificationChecks;

    const firstHasMinFollowers = (firstChecks as Array<{ rule: string }>).some(
      (c) => c.rule === 'minFollowers',
    );
    const secondHasMinFollowers = (secondChecks as Array<{ rule: string }>).some(
      (c) => c.rule === 'minFollowers',
    );
    expect(firstHasMinFollowers).toBe(true);
    expect(secondHasMinFollowers).toBe(false);
  });
});
