import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
  UserRole,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('BusinessService', () => {
  let service: BusinessService;
  let prisma: {
    brand: { findUnique: jest.Mock };
    bounty: { groupBy: jest.Mock };
    submission: { groupBy: jest.Mock };
  };
  let redis: { get: jest.Mock; set: jest.Mock };

  const mockUser: AuthenticatedUser = {
    sub: 'user-1',
    email: 'admin@test.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'org-1',
  };

  const mockOrg = { id: 'org-1', name: 'Acme Corp' };

  /** Default groupBy responses that contain every status so totals add up correctly */
  const defaultBountyGroups = [
    { status: BountyStatus.DRAFT, _count: { _all: 2 } },
    { status: BountyStatus.LIVE, _count: { _all: 3 } },
    { status: BountyStatus.PAUSED, _count: { _all: 1 } },
    { status: BountyStatus.CLOSED, _count: { _all: 4 } },
  ];

  const defaultSubmissionStatusGroups = [
    { status: SubmissionStatus.SUBMITTED, _count: { _all: 5 } },
    { status: SubmissionStatus.IN_REVIEW, _count: { _all: 2 } },
    { status: SubmissionStatus.NEEDS_MORE_INFO, _count: { _all: 1 } },
    { status: SubmissionStatus.APPROVED, _count: { _all: 8 } },
    { status: SubmissionStatus.REJECTED, _count: { _all: 3 } },
  ];

  const defaultSubmissionPayoutGroups = [
    { payoutStatus: PayoutStatus.NOT_PAID, _count: { _all: 10 } },
    { payoutStatus: PayoutStatus.PENDING, _count: { _all: 2 } },
    { payoutStatus: PayoutStatus.PAID, _count: { _all: 7 } },
  ];

  beforeEach(async () => {
    prisma = {
      brand: { findUnique: jest.fn() },
      bounty: { groupBy: jest.fn() },
      submission: { groupBy: jest.fn() },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null), // cache miss by default
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
  });

  // ─── Guard clauses ──────────────────────────────────────────────────────────

  it('throws BadRequestException when user has no brandId', async () => {
    const noOrgUser: AuthenticatedUser = { ...mockUser, brandId: null };
    await expect(service.getDashboard(noOrgUser)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when the brand is not found', async () => {
    prisma.brand.findUnique.mockResolvedValue(null);
    await expect(service.getDashboard(mockUser)).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('returns correct dashboard metrics from DB', async () => {
    prisma.brand.findUnique.mockResolvedValue(mockOrg);
    prisma.bounty.groupBy.mockResolvedValue(defaultBountyGroups);
    prisma.submission.groupBy
      .mockResolvedValueOnce(defaultSubmissionStatusGroups)
      .mockResolvedValueOnce(defaultSubmissionPayoutGroups);

    const result = await service.getDashboard(mockUser);

    expect(result.brand).toEqual(mockOrg);

    // Bounty totals
    expect(result.bounties.total).toBe(10); // 2+3+1+4
    expect(result.bounties.byStatus.DRAFT).toBe(2);
    expect(result.bounties.byStatus.LIVE).toBe(3);
    expect(result.bounties.byStatus.PAUSED).toBe(1);
    expect(result.bounties.byStatus.CLOSED).toBe(4);

    // Submission totals
    expect(result.submissions.total).toBe(19); // 5+2+1+8+3
    expect(result.submissions.pendingReview).toBe(7); // SUBMITTED(5) + IN_REVIEW(2)
    expect(result.submissions.byStatus.SUBMITTED).toBe(5);
    expect(result.submissions.byStatus.IN_REVIEW).toBe(2);
    expect(result.submissions.byStatus.NEEDS_MORE_INFO).toBe(1);
    expect(result.submissions.byStatus.APPROVED).toBe(8);
    expect(result.submissions.byStatus.REJECTED).toBe(3);
    expect(result.submissions.byPayoutStatus.NOT_PAID).toBe(10);
    expect(result.submissions.byPayoutStatus.PENDING).toBe(2);
    expect(result.submissions.byPayoutStatus.PAID).toBe(7);
  });

  it('defaults missing status counts to 0 when groupBy returns no row for that status', async () => {
    prisma.brand.findUnique.mockResolvedValue(mockOrg);
    prisma.bounty.groupBy.mockResolvedValue([]); // no bounties at all
    prisma.submission.groupBy.mockResolvedValue([]); // no submissions at all

    const result = await service.getDashboard(mockUser);

    expect(result.bounties.total).toBe(0);
    expect(result.bounties.byStatus.DRAFT).toBe(0);
    expect(result.submissions.total).toBe(0);
    expect(result.submissions.pendingReview).toBe(0);
    expect(result.submissions.byPayoutStatus.PAID).toBe(0);
  });

  // ─── Caching ────────────────────────────────────────────────────────────────

  it('stores the result in Redis with a 300-second TTL on cache miss', async () => {
    prisma.brand.findUnique.mockResolvedValue(mockOrg);
    prisma.bounty.groupBy.mockResolvedValue(defaultBountyGroups);
    prisma.submission.groupBy
      .mockResolvedValueOnce(defaultSubmissionStatusGroups)
      .mockResolvedValueOnce(defaultSubmissionPayoutGroups);

    const result = await service.getDashboard(mockUser);

    expect(redis.set).toHaveBeenCalledWith(
      `dashboard:${mockUser.brandId}`,
      JSON.stringify(result),
      300,
    );
  });

  it('returns cached value and skips DB queries on cache hit', async () => {
    const cachedData = { brand: mockOrg, bounties: {}, submissions: {} };
    redis.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await service.getDashboard(mockUser);

    expect(result).toEqual(cachedData);
    expect(prisma.brand.findUnique).not.toHaveBeenCalled();
    expect(prisma.bounty.groupBy).not.toHaveBeenCalled();
    expect(prisma.submission.groupBy).not.toHaveBeenCalled();
    // No new entry written when serving from cache
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('checks the cache key namespaced to the brandId', async () => {
    prisma.brand.findUnique.mockResolvedValue(mockOrg);
    prisma.bounty.groupBy.mockResolvedValue([]);
    prisma.submission.groupBy.mockResolvedValue([]);

    await service.getDashboard(mockUser);

    expect(redis.get).toHaveBeenCalledWith(`dashboard:${mockUser.brandId}`);
  });

  // ─── Query efficiency ────────────────────────────────────────────────────────

  it('uses exactly one groupBy for bounties and two groupBy calls for submissions', async () => {
    prisma.brand.findUnique.mockResolvedValue(mockOrg);
    prisma.bounty.groupBy.mockResolvedValue(defaultBountyGroups);
    prisma.submission.groupBy
      .mockResolvedValueOnce(defaultSubmissionStatusGroups)
      .mockResolvedValueOnce(defaultSubmissionPayoutGroups);

    await service.getDashboard(mockUser);

    // Replaces 5 individual count() calls with 1 groupBy
    expect(prisma.bounty.groupBy).toHaveBeenCalledTimes(1);
    // Replaces 9 individual count() calls with 2 groupBy calls
    expect(prisma.submission.groupBy).toHaveBeenCalledTimes(2);
  });

  it('scopes submission groupBy queries to the brand via relation filter', async () => {
    prisma.brand.findUnique.mockResolvedValue(mockOrg);
    prisma.bounty.groupBy.mockResolvedValue([]);
    prisma.submission.groupBy.mockResolvedValue([]);

    await service.getDashboard(mockUser);

    const submissionCalls = prisma.submission.groupBy.mock.calls;
    for (const [args] of submissionCalls) {
      expect(args.where).toEqual({
        bounty: { brandId: mockUser.brandId },
      });
    }
  });
});
