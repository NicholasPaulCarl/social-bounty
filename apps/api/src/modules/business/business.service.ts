import { Injectable, BadRequestException } from '@nestjs/common';
import {
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

// Cache dashboard results for 5 minutes to avoid repeated DB roundtrips
const DASHBOARD_CACHE_TTL = 300;

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getDashboard(user: AuthenticatedUser) {
    if (!user.brandId) {
      throw new BadRequestException('You do not belong to an organisation');
    }

    const cacheKey = `dashboard:${user.brandId}`;

    // Return cached result if available
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const org = await this.prisma.brand.findUnique({
      where: { id: user.brandId },
      select: { id: true, name: true },
    });

    if (!org) {
      throw new BadRequestException('Organisation not found');
    }

    const orgId = user.brandId;

    // Run bounty status counts and submission status/payout counts in parallel.
    // Each group uses a single groupBy query instead of N individual count queries,
    // reducing the total DB roundtrips from 15+ down to 4.
    const [bountyGroups, submissionStatusGroups, submissionPayoutGroups] =
      await Promise.all([
        // One query returns counts for every bounty status
        this.prisma.bounty.groupBy({
          by: ['status'],
          where: { brandId: orgId },
          _count: { _all: true },
        }),
        // One query returns submission counts for every submission status,
        // scoped to this org's bounties via a relation filter
        this.prisma.submission.groupBy({
          by: ['status'],
          where: { bounty: { brandId: orgId } },
          _count: { _all: true },
        }),
        // One query returns submission counts for every payout status
        this.prisma.submission.groupBy({
          by: ['payoutStatus'],
          where: { bounty: { brandId: orgId } },
          _count: { _all: true },
        }),
      ]);

    // Helper: turn groupBy rows into a lookup map
    const toStatusMap = <T extends string>(
      groups: { _count: { _all: number } }[],
      key: string,
    ): Record<string, number> =>
      Object.fromEntries(
        groups.map((g) => [(g as Record<string, unknown>)[key] as string, g._count._all]),
      );

    const bountyByStatus = toStatusMap(bountyGroups, 'status');
    const submissionByStatus = toStatusMap(submissionStatusGroups, 'status');
    const submissionByPayout = toStatusMap(submissionPayoutGroups, 'payoutStatus');

    const totalBounties = Object.values(bountyByStatus).reduce((a, b) => a + b, 0);
    const totalSubmissions = Object.values(submissionByStatus).reduce((a, b) => a + b, 0);

    const pendingReview =
      (submissionByStatus[SubmissionStatus.SUBMITTED] ?? 0) +
      (submissionByStatus[SubmissionStatus.IN_REVIEW] ?? 0);

    const result = {
      organisation: org,
      bounties: {
        total: totalBounties,
        byStatus: {
          DRAFT: bountyByStatus[BountyStatus.DRAFT] ?? 0,
          LIVE: bountyByStatus[BountyStatus.LIVE] ?? 0,
          PAUSED: bountyByStatus[BountyStatus.PAUSED] ?? 0,
          CLOSED: bountyByStatus[BountyStatus.CLOSED] ?? 0,
        },
      },
      submissions: {
        total: totalSubmissions,
        pendingReview,
        byStatus: {
          SUBMITTED: submissionByStatus[SubmissionStatus.SUBMITTED] ?? 0,
          IN_REVIEW: submissionByStatus[SubmissionStatus.IN_REVIEW] ?? 0,
          NEEDS_MORE_INFO: submissionByStatus[SubmissionStatus.NEEDS_MORE_INFO] ?? 0,
          APPROVED: submissionByStatus[SubmissionStatus.APPROVED] ?? 0,
          REJECTED: submissionByStatus[SubmissionStatus.REJECTED] ?? 0,
        },
        byPayoutStatus: {
          NOT_PAID: submissionByPayout[PayoutStatus.NOT_PAID] ?? 0,
          PENDING: submissionByPayout[PayoutStatus.PENDING] ?? 0,
          PAID: submissionByPayout[PayoutStatus.PAID] ?? 0,
        },
      },
    };

    // Persist result to Redis so subsequent calls within the TTL window skip the DB
    await this.redis.set(cacheKey, JSON.stringify(result), DASHBOARD_CACHE_TTL);

    return result;
  }
}
