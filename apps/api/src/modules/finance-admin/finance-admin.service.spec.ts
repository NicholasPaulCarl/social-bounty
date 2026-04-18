import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LedgerAccount, LedgerEntryType } from '@prisma/client';
import { SocialChannel, UserRole } from '@social-bounty/shared';
import { FinanceAdminService } from './finance-admin.service';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinanceAdminService.devSeedPayable', () => {
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let post: jest.Mock;
  let service: FinanceAdminService;

  function makeService(provider: string): FinanceAdminService {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'PAYMENTS_PROVIDER' ? provider : fallback,
      ),
    } as unknown as ConfigService;
    return new FinanceAdminService(prisma as PrismaService, ledger as LedgerService, config);
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'hunter_1' }),
      },
    };
    post = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_dev_1', idempotent: false });
    ledger = { postTransactionGroup: post };
    service = makeService('stitch_sandbox');
  });

  it('seeds a balanced hunter_net_payable group for a SUPER_ADMIN in sandbox', async () => {
    const res = await service.devSeedPayable(
      { userId: 'hunter_1', faceValueCents: 50_000n },
      { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
    );
    expect(res.transactionGroupId).toBe('grp_dev_1');
    expect(post).toHaveBeenCalledTimes(1);
    const [input] = post.mock.calls[0];
    expect(input.actionType).toBe('compensating_entry');
    expect(input.allowDuringKillSwitch).toBe(true);
    const debit = input.legs.find((l: any) => l.type === LedgerEntryType.DEBIT);
    const credit = input.legs.find((l: any) => l.type === LedgerEntryType.CREDIT);
    expect(debit.amountCents).toBe(50_000n);
    expect(credit.amountCents).toBe(50_000n);
    expect(credit.account).toBe(LedgerAccount.hunter_net_payable);
    expect(credit.userId).toBe('hunter_1');
    // clearanceReleaseAt must be in the past so the job picks it up.
    expect(credit.clearanceReleaseAt.getTime()).toBeLessThan(Date.now());
  });

  it('refuses when PAYMENTS_PROVIDER=stitch_live', async () => {
    service = makeService('stitch_live');
    await expect(
      service.devSeedPayable(
        { userId: 'hunter_1', faceValueCents: 50_000n },
        { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(post).not.toHaveBeenCalled();
  });

  it('refuses a non-SUPER_ADMIN actor', async () => {
    await expect(
      service.devSeedPayable(
        { userId: 'hunter_1', faceValueCents: 50_000n },
        { sub: 'u_1', role: UserRole.PARTICIPANT },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects non-positive faceValueCents', async () => {
    await expect(
      service.devSeedPayable(
        { userId: 'hunter_1', faceValueCents: 0n },
        { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown userId', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.devSeedPayable(
        { userId: 'nope', faceValueCents: 50_000n },
        { sub: 'sa_1', role: UserRole.SUPER_ADMIN },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Phase 3B — admin visibility-failure surface
// ─────────────────────────────────────────────────────────────────────────

describe('FinanceAdminService.listVisibilityFailures', () => {
  function makeService(prisma: any): FinanceAdminService {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'PAYMENTS_PROVIDER' ? 'stitch_sandbox' : fallback,
      ),
    } as unknown as ConfigService;
    return new FinanceAdminService(
      prisma as PrismaService,
      {} as LedgerService,
      config,
    );
  }

  function makeRow(overrides: Partial<any> = {}) {
    const now = new Date('2026-04-18T12:00:00Z');
    const earlier = new Date('2026-04-18T10:00:00Z');
    return {
      id: 'sub_1',
      userId: 'hunter_1',
      bountyId: 'bnty_1',
      approvedAt: new Date('2026-04-15T00:00:00Z'),
      lastVisibilityCheckAt: now,
      consecutiveVisibilityFailures: 2,
      bounty: {
        id: 'bnty_1',
        title: 'Promote our launch',
        brand: { id: 'brnd_1', name: 'Acme' },
      },
      user: { id: 'hunter_1', firstName: 'Sam', lastName: 'Hunter' },
      urlScrapes: [
        {
          id: 'us_1',
          scrapeStatus: 'FAILED',
          errorMessage: 'Post returns 404',
          updatedAt: now,
        },
        {
          id: 'us_2',
          scrapeStatus: 'FAILED',
          errorMessage: 'Account is private',
          updatedAt: earlier,
        },
      ],
      _count: { urlScrapeHistories: 4 },
      ...overrides,
    };
  }

  it('returns only submissions with consecutiveVisibilityFailures > 0, paginated, ordered desc', async () => {
    const findMany = jest.fn().mockResolvedValue([
      makeRow({ id: 'sub_a', consecutiveVisibilityFailures: 3 }),
      makeRow({ id: 'sub_b', consecutiveVisibilityFailures: 1 }),
    ]);
    const count = jest.fn().mockResolvedValue(2);
    const prisma = {
      submission: { findMany, count },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityFailures(1, 25);

    // Filter is applied
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { consecutiveVisibilityFailures: { gt: 0 } },
      }),
    );
    expect(count).toHaveBeenCalledWith({
      where: { consecutiveVisibilityFailures: { gt: 0 } },
    });
    // Ordered failures desc, then last-checked desc
    expect(findMany.mock.calls[0][0].orderBy).toEqual([
      { consecutiveVisibilityFailures: 'desc' },
      { lastVisibilityCheckAt: 'desc' },
    ]);
    // Pagination plumbed in
    expect(findMany.mock.calls[0][0].skip).toBe(0);
    expect(findMany.mock.calls[0][0].take).toBe(25);
    expect(res.meta).toEqual({ page: 1, limit: 25, total: 2, totalPages: 1 });
    expect(res.data).toHaveLength(2);
    expect(res.data[0].submissionId).toBe('sub_a');
  });

  it('flattens bounty + brand + hunter into row shape with most-recent FAILED errorMessage', async () => {
    const prisma = {
      submission: {
        findMany: jest.fn().mockResolvedValue([makeRow()]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityFailures();

    expect(res.data[0]).toEqual({
      submissionId: 'sub_1',
      bountyId: 'bnty_1',
      bountyTitle: 'Promote our launch',
      brandId: 'brnd_1',
      brandName: 'Acme',
      hunterId: 'hunter_1',
      hunterName: 'Sam Hunter',
      approvedAt: '2026-04-15T00:00:00.000Z',
      lastVisibilityCheckAt: '2026-04-18T12:00:00.000Z',
      consecutiveVisibilityFailures: 2,
      // Picks the most-recent FAILED row by updatedAt
      latestErrorMessage: 'Post returns 404',
      historyRowCount: 4,
    });
  });

  it('falls back to most-recent non-null errorMessage when no FAILED row currently set', async () => {
    const prisma = {
      submission: {
        findMany: jest.fn().mockResolvedValue([
          makeRow({
            urlScrapes: [
              {
                id: 'us_1',
                scrapeStatus: 'PENDING', // mid-flight reset
                errorMessage: 'last scrape said timeout',
                updatedAt: new Date('2026-04-18T11:00:00Z'),
              },
            ],
          }),
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityFailures();
    expect(res.data[0].latestErrorMessage).toBe('last scrape said timeout');
  });

  it('returns null latestErrorMessage when no errors recorded anywhere', async () => {
    const prisma = {
      submission: {
        findMany: jest.fn().mockResolvedValue([
          makeRow({ urlScrapes: [] }),
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityFailures();
    expect(res.data[0].latestErrorMessage).toBeNull();
  });

  it('clamps and applies pagination params (page=2, limit=10)', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      submission: {
        findMany,
        count: jest.fn().mockResolvedValue(35),
      },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityFailures(2, 10);
    expect(findMany.mock.calls[0][0].skip).toBe(10);
    expect(findMany.mock.calls[0][0].take).toBe(10);
    expect(res.meta).toEqual({ page: 2, limit: 10, total: 35, totalPages: 4 });
  });

  it('falls back to userId when hunter has no name', async () => {
    const prisma = {
      submission: {
        findMany: jest.fn().mockResolvedValue([
          makeRow({
            user: { id: 'hunter_x', firstName: '', lastName: '' },
            userId: 'hunter_x',
          }),
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityFailures();
    expect(res.data[0].hunterName).toBe('hunter_x');
  });
});

describe('FinanceAdminService.listVisibilityHistory', () => {
  function makeService(prisma: any): FinanceAdminService {
    const config = {
      get: jest.fn((_key: string, fallback?: unknown) => fallback),
    } as unknown as ConfigService;
    return new FinanceAdminService(
      prisma as PrismaService,
      {} as LedgerService,
      config,
    );
  }

  it('returns history rows newest-first and serialises dates + JSON columns', async () => {
    const prisma = {
      submission: {
        findUnique: jest.fn().mockResolvedValue({ id: 'sub_1' }),
      },
      submissionUrlScrapeHistory: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'h1',
            urlScrapeId: 'us_1',
            url: 'https://instagram.com/p/abc',
            channel: 'INSTAGRAM',
            format: 'FEED_POST',
            scrapeStatus: 'FAILED',
            scrapeResult: { likes: 0 },
            verificationChecks: [{ rule: 'minLikes', pass: false }],
            errorMessage: 'gone',
            checkedAt: new Date('2026-04-18T12:00:00Z'),
          },
          {
            id: 'h2',
            urlScrapeId: 'us_1',
            url: 'https://instagram.com/p/abc',
            channel: 'INSTAGRAM',
            format: 'FEED_POST',
            scrapeStatus: 'VERIFIED',
            scrapeResult: { likes: 50 },
            verificationChecks: [{ rule: 'minLikes', pass: true }],
            errorMessage: null,
            checkedAt: new Date('2026-04-17T12:00:00Z'),
          },
        ]),
      },
    };
    const service = makeService(prisma);

    const res = await service.listVisibilityHistory('sub_1');
    expect(prisma.submissionUrlScrapeHistory.findMany).toHaveBeenCalledWith({
      where: { submissionId: 'sub_1' },
      orderBy: { checkedAt: 'desc' },
    });
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({
      id: 'h1',
      urlScrapeId: 'us_1',
      url: 'https://instagram.com/p/abc',
      channel: 'INSTAGRAM',
      format: 'FEED_POST',
      scrapeStatus: 'FAILED',
      scrapeResult: { likes: 0 },
      verificationChecks: [{ rule: 'minLikes', pass: false }],
      errorMessage: 'gone',
      checkedAt: '2026-04-18T12:00:00.000Z',
    });
    expect(res[1].errorMessage).toBeNull();
  });

  it('throws NotFoundException for an unknown submissionId', async () => {
    const prisma = {
      submission: { findUnique: jest.fn().mockResolvedValue(null) },
      submissionUrlScrapeHistory: { findMany: jest.fn() },
    };
    const service = makeService(prisma);

    await expect(service.listVisibilityHistory('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.submissionUrlScrapeHistory.findMany).not.toHaveBeenCalled();
  });

  it('returns empty array when submission exists but has no history rows', async () => {
    const prisma = {
      submission: { findUnique: jest.fn().mockResolvedValue({ id: 'sub_1' }) },
      submissionUrlScrapeHistory: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = makeService(prisma);
    const res = await service.listVisibilityHistory('sub_1');
    expect(res).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 3D — getVisibilityAnalytics
//
// Tests cover the alert-threshold matrix specified in the agent brief plus
// the wire-shape contract (windowStart/windowEnd ISO format, channel sort
// order, totals roll-up, transient-row exclusion from failureRate).
// `prisma.$queryRaw` is mocked so the service runs offline; we shape the
// returned rows to match what the SQL would emit (one row per
// (channel, scrapeStatus) tuple, count as text).
// ─────────────────────────────────────────────────────────────────
describe('FinanceAdminService.getVisibilityAnalytics', () => {
  type RawRow = { channel: SocialChannel; scrapeStatus: string; count: string };
  let prisma: { $queryRaw: jest.Mock };
  let service: FinanceAdminService;

  function makeService(): FinanceAdminService {
    const config = {
      get: jest.fn((_key: string, fallback?: unknown) => fallback),
    } as unknown as ConfigService;
    return new FinanceAdminService(
      prisma as unknown as PrismaService,
      {} as LedgerService,
      config,
    );
  }

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    service = makeService();
  });

  it('empty window returns zero totals + zero buckets + no alerts', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);

    expect(res.windowHours).toBe(24);
    expect(res.buckets).toEqual([]);
    expect(res.totals).toEqual({ total: 0, verified: 0, failed: 0, failureRate: 0 });
    expect(res.alerts).toEqual([]);
    // ISO strings on the wire so cross-language clients parse cleanly.
    expect(typeof res.windowStart).toBe('string');
    expect(typeof res.windowEnd).toBe('string');
    expect(new Date(res.windowStart).getTime()).toBeLessThan(
      new Date(res.windowEnd).getTime(),
    );
  });

  it('all-VERIFIED single channel → failureRate 0, no alerts', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'VERIFIED', count: '50' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);

    expect(res.buckets).toHaveLength(1);
    expect(res.buckets[0]).toEqual({
      channel: SocialChannel.INSTAGRAM,
      total: 50,
      verified: 50,
      failed: 0,
      failureRate: 0,
    });
    expect(res.totals.failureRate).toBe(0);
    expect(res.alerts).toEqual([]);
  });

  it('mixed VERIFIED + FAILED computes the correct failureRate', async () => {
    // 30 verified + 20 failed = 0.4 failure rate exactly.
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'VERIFIED', count: '30' },
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'FAILED', count: '20' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);
    const bucket = res.buckets[0];
    expect(bucket.total).toBe(50);
    expect(bucket.verified).toBe(30);
    expect(bucket.failed).toBe(20);
    expect(bucket.failureRate).toBeCloseTo(0.4);
  });

  it('PENDING/IN_PROGRESS rows count toward total but NOT toward failureRate', async () => {
    // Transient rows are excluded from the rate denominator on purpose —
    // otherwise the rate would dip every time the scheduler wakes up.
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'VERIFIED', count: '10' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'FAILED', count: '10' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'PENDING', count: '5' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'IN_PROGRESS', count: '3' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);
    const bucket = res.buckets[0];
    expect(bucket.total).toBe(28);
    expect(bucket.verified).toBe(10);
    expect(bucket.failed).toBe(10);
    // 10/(10+10) = 0.5, NOT 10/28.
    expect(bucket.failureRate).toBe(0.5);
  });

  it('warning threshold: 35% failure across 15 settled rows → warning alert', async () => {
    // 5 failed / (5+10) verified = 33.3% — clears the warning bar (>=30%, >=10).
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'VERIFIED', count: '10' },
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'FAILED', count: '5' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);
    expect(res.alerts).toHaveLength(1);
    expect(res.alerts[0].channel).toBe(SocialChannel.INSTAGRAM);
    expect(res.alerts[0].severity).toBe('warning');
    expect(res.alerts[0].message).toContain('Instagram'.toUpperCase()); // channel name in message
  });

  it('critical threshold: 60% failure across 25 settled rows → critical alert', async () => {
    // 15 failed / 25 settled = 60% — clears critical (>=50%, >=20).
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.FACEBOOK, scrapeStatus: 'VERIFIED', count: '10' },
      { channel: SocialChannel.FACEBOOK, scrapeStatus: 'FAILED', count: '15' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);
    expect(res.alerts).toHaveLength(1);
    expect(res.alerts[0].channel).toBe(SocialChannel.FACEBOOK);
    expect(res.alerts[0].severity).toBe('critical');
    expect(res.alerts[0].message).toContain('Investigate');
  });

  it('high failure rate but tiny sample (50% across 5 rows) → NO alert', async () => {
    // Sample-size floor protection — 2/4 settled is too noisy to alert on.
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'VERIFIED', count: '2' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'FAILED', count: '2' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'PENDING', count: '1' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);
    expect(res.buckets[0].failureRate).toBe(0.5);
    // Settled denominator is 4 < 10 (warning floor) — no alert fires.
    expect(res.alerts).toEqual([]);
  });

  it('multi-channel: only the affected channels emit alerts', async () => {
    // Instagram is healthy, TikTok is critical, Facebook is warning.
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'VERIFIED', count: '50' },
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'FAILED', count: '2' }, // ~3.8%
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'VERIFIED', count: '10' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'FAILED', count: '15' }, // 60% / 25
      { channel: SocialChannel.FACEBOOK, scrapeStatus: 'VERIFIED', count: '7' },
      { channel: SocialChannel.FACEBOOK, scrapeStatus: 'FAILED', count: '5' }, // ~41.7% / 12
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);

    // Buckets sorted alphabetically by channel: FACEBOOK, INSTAGRAM, TIKTOK.
    expect(res.buckets.map((b) => b.channel)).toEqual([
      SocialChannel.FACEBOOK,
      SocialChannel.INSTAGRAM,
      SocialChannel.TIKTOK,
    ]);

    // Alerts fire only for FACEBOOK (warning) and TIKTOK (critical), not INSTAGRAM.
    const channelsAlerted = res.alerts.map((a) => a.channel).sort();
    expect(channelsAlerted).toEqual([SocialChannel.FACEBOOK, SocialChannel.TIKTOK]);
    const tiktokAlert = res.alerts.find((a) => a.channel === SocialChannel.TIKTOK);
    const fbAlert = res.alerts.find((a) => a.channel === SocialChannel.FACEBOOK);
    expect(tiktokAlert?.severity).toBe('critical');
    expect(fbAlert?.severity).toBe('warning');
  });

  it('totals roll up across all channels and use the same denominator math', async () => {
    // 30 verified + 10 failed = totals failureRate 0.25
    prisma.$queryRaw.mockResolvedValueOnce([
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'VERIFIED', count: '20' },
      { channel: SocialChannel.INSTAGRAM, scrapeStatus: 'FAILED', count: '5' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'VERIFIED', count: '10' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'FAILED', count: '5' },
      { channel: SocialChannel.TIKTOK, scrapeStatus: 'PENDING', count: '3' },
    ] as RawRow[]);

    const res = await service.getVisibilityAnalytics(24);
    expect(res.totals.total).toBe(43); // 25 + 18 (incl. pending)
    expect(res.totals.verified).toBe(30);
    expect(res.totals.failed).toBe(10);
    expect(res.totals.failureRate).toBe(0.25); // 10 / (30+10)
  });

  it('clamps an out-of-range windowHours and reflects the clamped value on the wire', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([] as RawRow[]);
    // 999999 is clamped to the 30-day max (720h).
    const res = await service.getVisibilityAnalytics(999999);
    expect(res.windowHours).toBe(24 * 30);
  });

  it('falls back to default 24h when given an unsafe number (NaN)', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([] as RawRow[]);
    const res = await service.getVisibilityAnalytics(Number.NaN);
    expect(res.windowHours).toBe(24);
  });
});
