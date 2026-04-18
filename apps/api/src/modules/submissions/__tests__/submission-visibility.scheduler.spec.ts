import { ConfigService } from '@nestjs/config';
import {
  AUDIT_ACTIONS,
  DurationUnit,
  ENTITY_TYPES,
  PostVisibilityRule,
  SubmissionStatus,
  UserRole,
} from '@social-bounty/shared';
import { AuditService } from '../../audit/audit.service';
import { KbService } from '../../kb/kb.service';
import { MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RefundsService } from '../../refunds/refunds.service';
import { SubmissionScraperService } from '../submission-scraper.service';
import { SubmissionVisibilityScheduler } from '../submission-visibility.scheduler';

/**
 * Phase 2A — SubmissionVisibilityScheduler covers the policy layer of
 * the PostVisibility re-check feature. The scraper.rescrapeForVisibility
 * call is mocked — it's exercised separately in submission-scraper.service.spec.
 *
 * Cases:
 *   1. Lock contention: skip when another tick holds the pass lock.
 *   2. No eligible submissions → no-op.
 *   3. Single submission re-scrape success path → counter resets, no
 *      refund, no audit log.
 *   4. Single submission second failure → RefundsService.requestAfterApproval
 *      called, audit log written, both emails sent.
 *   5. MUST_NOT_REMOVE bounty after 90d → not picked up.
 *   6. MINIMUM_DURATION cap → not picked up after the duration window
 *      elapses.
 *   7. MAX_PER_RUN cap → only first 100 of 150 eligible processed.
 *   8. Cadence: not run when last check was within the day-1-7 24h
 *      window.
 */
describe('SubmissionVisibilityScheduler', () => {
  const SYSTEM_ACTOR = 'system-actor-1';

  function buildHarness(opts: {
    submissions: Array<{
      id: string;
      userId: string;
      approvedAt: Date | null;
      lastVisibilityCheckAt: Date | null;
      consecutiveVisibilityFailures: number;
      bounty: {
        id: string;
        title: string;
        brandId: string;
        postVisibility: { rule: PostVisibilityRule; minDurationValue?: number; minDurationUnit?: DurationUnit } | null;
      };
      user: { email: string; firstName: string | null; lastName: string | null };
    }>;
    lockAcquired?: boolean;
    rescrapeResults?: Map<
      string,
      { totalUrls: number; failedUrls: number; verifiedUrls: number; failureMessages: string[] }
    >;
    brand?: { name: string; memberEmail: string | null };
  }) {
    const lockAcquired = opts.lockAcquired ?? true;
    const submissionsStore = new Map(
      opts.submissions.map((s) => [
        s.id,
        {
          ...s,
          status: SubmissionStatus.APPROVED,
        },
      ]),
    );
    const rescrapeResults = opts.rescrapeResults ?? new Map();

    const prisma = {
      submission: {
        findMany: jest.fn(async ({ where, take }: any) => {
          // Apply only the universal filter (status=APPROVED + approvedAt IS NOT NULL).
          // The scheduler filters in JS for postVisibility / cadence.
          if (where?.status !== SubmissionStatus.APPROVED) return [];
          const filtered = Array.from(submissionsStore.values()).filter(
            (s) => s.approvedAt !== null,
          );
          // Sort by lastVisibilityCheckAt asc, null first.
          filtered.sort((a, b) => {
            if (!a.lastVisibilityCheckAt && !b.lastVisibilityCheckAt) return 0;
            if (!a.lastVisibilityCheckAt) return -1;
            if (!b.lastVisibilityCheckAt) return 1;
            return a.lastVisibilityCheckAt.getTime() - b.lastVisibilityCheckAt.getTime();
          });
          return filtered.slice(0, take ?? filtered.length);
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const existing = submissionsStore.get(where.id);
          if (!existing) throw new Error(`no submission ${where.id}`);
          const updated = { ...existing, ...data };
          submissionsStore.set(where.id, updated);
          return updated;
        }),
      },
      brand: {
        findUnique: jest.fn(async () => {
          const b = opts.brand ?? { name: 'Test Brand', memberEmail: 'admin@brand.test' };
          return {
            name: b.name,
            members: b.memberEmail
              ? [{ user: { email: b.memberEmail, firstName: 'Brand' } }]
              : [],
          };
        }),
      },
    } as unknown as PrismaService;

    const redis = {
      setNxEx: jest.fn().mockResolvedValue(lockAcquired),
      del: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService;

    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    const mailService = {
      sendPostRemovedBrandEmail: jest.fn().mockResolvedValue(undefined),
      sendPostRemovedHunterEmail: jest.fn().mockResolvedValue(undefined),
    } as unknown as MailService;

    const kbService = {
      recordRecurrence: jest.fn().mockResolvedValue({ isNew: true, issue: { id: 'issue-1' } }),
    } as unknown as KbService;

    const refundsService = {
      requestAfterApproval: jest.fn().mockResolvedValue({ id: 'refund-1' }),
    } as unknown as RefundsService;

    const scraper = {
      rescrapeForVisibility: jest.fn(async (id: string) => {
        return (
          rescrapeResults.get(id) ?? {
            totalUrls: 1,
            failedUrls: 0,
            verifiedUrls: 1,
            failureMessages: [],
          }
        );
      }),
    } as unknown as SubmissionScraperService;

    const config = {
      get: jest.fn((key: string, defaultValue?: string) =>
        key === 'STITCH_SYSTEM_ACTOR_ID' ? SYSTEM_ACTOR : defaultValue ?? '',
      ),
    } as unknown as ConfigService;

    const scheduler = new SubmissionVisibilityScheduler(
      prisma,
      redis,
      auditService,
      mailService,
      kbService,
      refundsService,
      scraper,
      config,
    );

    return {
      scheduler,
      prisma,
      redis,
      auditService,
      mailService,
      kbService,
      refundsService,
      scraper,
      submissionsStore,
    };
  }

  function buildSubmission(overrides: any = {}) {
    return {
      id: overrides.id ?? 'sub-1',
      userId: overrides.userId ?? 'hunter-1',
      approvedAt: overrides.approvedAt ?? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastVisibilityCheckAt: overrides.lastVisibilityCheckAt ?? null,
      consecutiveVisibilityFailures: overrides.consecutiveVisibilityFailures ?? 0,
      bounty: overrides.bounty ?? {
        id: 'bounty-1',
        title: 'Test Bounty',
        brandId: 'brand-1',
        postVisibility: { rule: PostVisibilityRule.MUST_NOT_REMOVE },
      },
      user: overrides.user ?? {
        email: 'hunter@test.com',
        firstName: 'Hunter',
        lastName: 'McTest',
      },
    };
  }

  it('skips when another tick holds the pass lock', async () => {
    const { scheduler, redis, scraper, prisma } = buildHarness({
      submissions: [],
      lockAcquired: false,
    });

    await scheduler.runRecheckPass();

    expect(redis.setNxEx).toHaveBeenCalledTimes(1);
    expect(scraper.rescrapeForVisibility).not.toHaveBeenCalled();
    expect((prisma.submission.findMany as jest.Mock)).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('no-ops when no eligible submissions exist', async () => {
    const { scheduler, redis, scraper, refundsService } = buildHarness({
      submissions: [],
    });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).not.toHaveBeenCalled();
    expect(refundsService.requestAfterApproval).not.toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalled();
  });

  it('success path: counter resets, no refund, no email, no audit log', async () => {
    const { scheduler, scraper, refundsService, mailService, auditService, submissionsStore } =
      buildHarness({
        submissions: [buildSubmission()],
        rescrapeResults: new Map([
          ['sub-1', { totalUrls: 2, failedUrls: 0, verifiedUrls: 2, failureMessages: [] }],
        ]),
      });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).toHaveBeenCalledWith('sub-1');
    const after = submissionsStore.get('sub-1')!;
    expect(after.consecutiveVisibilityFailures).toBe(0);
    expect(after.lastVisibilityCheckAt).toBeInstanceOf(Date);
    expect(refundsService.requestAfterApproval).not.toHaveBeenCalled();
    expect(mailService.sendPostRemovedBrandEmail).not.toHaveBeenCalled();
    expect(mailService.sendPostRemovedHunterEmail).not.toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('first failure: bumps counter to 1, records KB but does NOT refund', async () => {
    const { scheduler, scraper, refundsService, mailService, kbService, submissionsStore } =
      buildHarness({
        submissions: [buildSubmission({ consecutiveVisibilityFailures: 0 })],
        rescrapeResults: new Map([
          [
            'sub-1',
            { totalUrls: 1, failedUrls: 1, verifiedUrls: 0, failureMessages: ['INSTAGRAM REEL: 404'] },
          ],
        ]),
      });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).toHaveBeenCalledTimes(1);
    const after = submissionsStore.get('sub-1')!;
    expect(after.consecutiveVisibilityFailures).toBe(1);
    expect(kbService.recordRecurrence).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'post_visibility',
        errorCode: 'POST_VISIBILITY_FIRST_FAILURE',
        severity: 'warning',
      }),
    );
    expect(refundsService.requestAfterApproval).not.toHaveBeenCalled();
    expect(mailService.sendPostRemovedBrandEmail).not.toHaveBeenCalled();
    expect(mailService.sendPostRemovedHunterEmail).not.toHaveBeenCalled();
  });

  it('second consecutive failure triggers refund + brand + hunter emails + audit log', async () => {
    const { scheduler, scraper, refundsService, mailService, auditService, kbService, submissionsStore } =
      buildHarness({
        submissions: [
          buildSubmission({ consecutiveVisibilityFailures: 1, id: 'sub-fail' }),
        ],
        rescrapeResults: new Map([
          [
            'sub-fail',
            { totalUrls: 1, failedUrls: 1, verifiedUrls: 0, failureMessages: ['TIKTOK VIDEO_POST: 404'] },
          ],
        ]),
      });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).toHaveBeenCalledTimes(1);
    const after = submissionsStore.get('sub-fail')!;
    expect(after.consecutiveVisibilityFailures).toBe(2);

    expect(refundsService.requestAfterApproval).toHaveBeenCalledTimes(1);
    const refundCall = (refundsService.requestAfterApproval as jest.Mock).mock.calls[0];
    expect(refundCall[0]).toBe('sub-fail');
    expect(refundCall[1]).toContain('Auto-detected');
    expect(refundCall[1]).toContain('TIKTOK VIDEO_POST: 404');
    expect(refundCall[2]).toMatchObject({
      sub: SYSTEM_ACTOR,
      role: UserRole.SUPER_ADMIN,
    });

    expect(mailService.sendPostRemovedBrandEmail).toHaveBeenCalledTimes(1);
    expect(mailService.sendPostRemovedHunterEmail).toHaveBeenCalledTimes(1);
    const brandEmail = (mailService.sendPostRemovedBrandEmail as jest.Mock).mock.calls[0];
    expect(brandEmail[0]).toBe('admin@brand.test');
    expect(brandEmail[1]).toMatchObject({
      bountyTitle: 'Test Bounty',
      consecutiveFailures: 2,
    });
    const hunterEmail = (mailService.sendPostRemovedHunterEmail as jest.Mock).mock.calls[0];
    expect(hunterEmail[0]).toBe('hunter@test.com');
    expect(hunterEmail[1]).toMatchObject({
      userName: 'Hunter',
      bountyTitle: 'Test Bounty',
    });

    expect(auditService.log).toHaveBeenCalledTimes(1);
    const auditCall = (auditService.log as jest.Mock).mock.calls[0][0];
    expect(auditCall.action).toBe(AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND);
    expect(auditCall.entityType).toBe(ENTITY_TYPES.SUBMISSION);
    expect(auditCall.entityId).toBe('sub-fail');
    expect(auditCall.afterState).toMatchObject({
      consecutiveVisibilityFailures: 2,
      refundIssued: true,
    });

    expect(kbService.recordRecurrence).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'POST_VISIBILITY_THRESHOLD_REACHED',
        severity: 'critical',
      }),
    );
  });

  it('MUST_NOT_REMOVE bounty older than 90 days is skipped', async () => {
    const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
    const { scheduler, scraper } = buildHarness({
      submissions: [
        buildSubmission({
          approvedAt: ninetyOneDaysAgo,
          bounty: {
            id: 'b1',
            title: 'Old Bounty',
            brandId: 'brand-1',
            postVisibility: { rule: PostVisibilityRule.MUST_NOT_REMOVE },
          },
        }),
      ],
    });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).not.toHaveBeenCalled();
  });

  it('MINIMUM_DURATION bounty past the duration window is skipped', async () => {
    // 10-day window, bounty approved 11 days ago → outside window.
    const elevenDaysAgo = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);
    const { scheduler, scraper } = buildHarness({
      submissions: [
        buildSubmission({
          approvedAt: elevenDaysAgo,
          bounty: {
            id: 'b1',
            title: 'Min Duration Bounty',
            brandId: 'brand-1',
            postVisibility: {
              rule: PostVisibilityRule.MINIMUM_DURATION,
              minDurationValue: 10,
              minDurationUnit: DurationUnit.DAYS,
            },
          },
        }),
      ],
    });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).not.toHaveBeenCalled();
  });

  it('MAX_PER_RUN cap honored — only first 100 of 150 eligible processed', async () => {
    const submissions = Array.from({ length: 150 }, (_, i) =>
      buildSubmission({
        id: `sub-${i}`,
        userId: `hunter-${i}`,
        // Make all but a few never-checked (so they sort first).
        lastVisibilityCheckAt: null,
        consecutiveVisibilityFailures: 0,
      }),
    );

    const { scheduler, scraper } = buildHarness({
      submissions,
      rescrapeResults: new Map(
        submissions.map((s) => [
          s.id,
          { totalUrls: 1, failedUrls: 0, verifiedUrls: 1, failureMessages: [] },
        ]),
      ),
    });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).toHaveBeenCalledTimes(100);
  });

  it('cadence: skips when last check was within 24h window for a 2-day-old submission', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { scheduler, scraper } = buildHarness({
      submissions: [
        buildSubmission({
          approvedAt: twoDaysAgo,
          lastVisibilityCheckAt: oneHourAgo,
        }),
      ],
    });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).not.toHaveBeenCalled();
  });

  it('cadence: runs when 24h+ has elapsed for a 2-day-old submission', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const { scheduler, scraper } = buildHarness({
      submissions: [
        buildSubmission({
          approvedAt: twoDaysAgo,
          lastVisibilityCheckAt: twentyFiveHoursAgo,
        }),
      ],
    });

    await scheduler.runRecheckPass();

    expect(scraper.rescrapeForVisibility).toHaveBeenCalledTimes(1);
  });
});
