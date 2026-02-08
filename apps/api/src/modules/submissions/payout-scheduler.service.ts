import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubmissionStatus, PayoutStatus } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);
  private isProcessing = false;

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processExpiredDeadlines() {
    if (this.isProcessing) {
      this.logger.warn('Skipping: previous run still in progress');
      return;
    }

    this.isProcessing = true;
    try {
      const now = new Date();

      const expired = await this.prisma.submission.findMany({
        where: {
          status: SubmissionStatus.APPROVED,
          payoutStatus: PayoutStatus.NOT_PAID,
          verificationDeadline: { lte: now },
        },
        select: { id: true },
      });

      if (expired.length === 0) return;

      this.logger.log(`Processing ${expired.length} expired verification deadlines`);

      const result = await this.prisma.submission.updateMany({
        where: {
          id: { in: expired.map((s) => s.id) },
          status: SubmissionStatus.APPROVED,
          payoutStatus: PayoutStatus.NOT_PAID,
          verificationDeadline: { lte: now },
        },
        data: { payoutStatus: PayoutStatus.PAID },
      });

      this.logger.log(`Auto-paid ${result.count} submissions past verification deadline`);
    } catch (error) {
      this.logger.error('Failed to process expired deadlines', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
