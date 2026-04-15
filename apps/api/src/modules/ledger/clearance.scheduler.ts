import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClearanceService } from './clearance.service';

@Injectable()
export class ClearanceScheduler {
  private readonly logger = new Logger(ClearanceScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly clearance: ClearanceService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async tick(): Promise<void> {
    const enabled = this.config.get<string>('PAYOUTS_ENABLED', 'false') === 'true';
    if (!enabled) return;
    try {
      const { released, skipped } = await this.clearance.releaseEligible();
      if (released > 0 || skipped > 0) {
        this.logger.log(`clearance-release: released=${released} skipped=${skipped}`);
      }
    } catch (err) {
      this.logger.error(
        `clearance-release run failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
