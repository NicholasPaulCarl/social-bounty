import { Injectable, BadRequestException } from '@nestjs/common';
import {
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(user: AuthenticatedUser) {
    if (!user.organisationId) {
      throw new BadRequestException('You do not belong to an organisation');
    }

    const org = await this.prisma.organisation.findUnique({
      where: { id: user.organisationId },
      select: { id: true, name: true },
    });

    if (!org) {
      throw new BadRequestException('Organisation not found');
    }

    const bountyWhere = { organisationId: user.organisationId };

    const [
      totalBounties,
      draftBounties,
      liveBounties,
      pausedBounties,
      closedBounties,
    ] = await Promise.all([
      this.prisma.bounty.count({ where: bountyWhere }),
      this.prisma.bounty.count({ where: { ...bountyWhere, status: BountyStatus.DRAFT } }),
      this.prisma.bounty.count({ where: { ...bountyWhere, status: BountyStatus.LIVE } }),
      this.prisma.bounty.count({ where: { ...bountyWhere, status: BountyStatus.PAUSED } }),
      this.prisma.bounty.count({ where: { ...bountyWhere, status: BountyStatus.CLOSED } }),
    ]);

    // Get all bounty IDs for submission queries
    const bountyIds = await this.prisma.bounty.findMany({
      where: bountyWhere,
      select: { id: true },
    });
    const ids = bountyIds.map((b) => b.id);

    const submissionWhere = { bountyId: { in: ids } };

    const [
      totalSubmissions,
      submittedCount,
      inReviewCount,
      needsMoreInfoCount,
      approvedCount,
      rejectedCount,
      notPaidCount,
      pendingPayoutCount,
      paidCount,
    ] = await Promise.all([
      this.prisma.submission.count({ where: submissionWhere }),
      this.prisma.submission.count({ where: { ...submissionWhere, status: SubmissionStatus.SUBMITTED } }),
      this.prisma.submission.count({ where: { ...submissionWhere, status: SubmissionStatus.IN_REVIEW } }),
      this.prisma.submission.count({ where: { ...submissionWhere, status: SubmissionStatus.NEEDS_MORE_INFO } }),
      this.prisma.submission.count({ where: { ...submissionWhere, status: SubmissionStatus.APPROVED } }),
      this.prisma.submission.count({ where: { ...submissionWhere, status: SubmissionStatus.REJECTED } }),
      this.prisma.submission.count({ where: { ...submissionWhere, payoutStatus: PayoutStatus.NOT_PAID } }),
      this.prisma.submission.count({ where: { ...submissionWhere, payoutStatus: PayoutStatus.PENDING } }),
      this.prisma.submission.count({ where: { ...submissionWhere, payoutStatus: PayoutStatus.PAID } }),
    ]);

    const pendingReview = submittedCount + inReviewCount;

    return {
      organisation: org,
      bounties: {
        total: totalBounties,
        byStatus: {
          DRAFT: draftBounties,
          LIVE: liveBounties,
          PAUSED: pausedBounties,
          CLOSED: closedBounties,
        },
      },
      submissions: {
        total: totalSubmissions,
        pendingReview,
        byStatus: {
          SUBMITTED: submittedCount,
          IN_REVIEW: inReviewCount,
          NEEDS_MORE_INFO: needsMoreInfoCount,
          APPROVED: approvedCount,
          REJECTED: rejectedCount,
        },
        byPayoutStatus: {
          NOT_PAID: notPaidCount,
          PENDING: pendingPayoutCount,
          PAID: paidCount,
        },
      },
    };
  }
}
