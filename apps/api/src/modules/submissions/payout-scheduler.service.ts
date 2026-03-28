import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubmissionStatus, PayoutStatus } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processExpiredDeadlines() {
    const now = new Date();

    try {
      // Use a single atomic updateMany with WHERE conditions as the lock mechanism.
      // This is safe across multiple instances — PostgreSQL handles the row-level
      // locking. No in-memory flag needed.
      const result = await this.prisma.submission.updateMany({
        where: {
          status: SubmissionStatus.APPROVED,
          payoutStatus: PayoutStatus.NOT_PAID,
          verificationDeadline: { lte: now },
        },
        data: { payoutStatus: PayoutStatus.PAID },
      });

      if (result.count > 0) {
        this.logger.log(
          `Auto-paid ${result.count} submissions past verification deadline`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to process expired deadlines', error);
    }
  }
}
