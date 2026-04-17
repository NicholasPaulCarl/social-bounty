import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ExpiredBountyService } from './expired-bounty.service';

/**
 * Daily 03:00 tick that returns expired-bounty reserves to `brand_refundable`.
 *
 * Gate: `EXPIRED_BOUNTY_RELEASE_ENABLED` (explicit flag) OR the shared
 * `PAYOUTS_ENABLED` flag — both default to false. Keeping the per-job flag
 * lets ops disable this job independently of payouts without code change.
 */
@Injectable()
export class ExpiredBountyScheduler {
  private readonly logger = new Logger(ExpiredBountyScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly service: ExpiredBountyService,
  ) {}

  private enabled(): boolean {
    const jobFlag = this.config.get<string>('EXPIRED_BOUNTY_RELEASE_ENABLED', '');
    if (jobFlag === 'true') return true;
    if (jobFlag === 'false') return false;
    // If the job-specific flag is unset, fall back to the global payouts flag.
    return this.config.get<string>('PAYOUTS_ENABLED', 'false') === 'true';
  }

  @Cron('0 3 * * *')
  async tick(): Promise<void> {
    if (!this.enabled()) return;
    try {
      const { released, skipped, ineligible } = await this.service.releaseEligible();
      if (released + skipped + ineligible > 0) {
        this.logger.log(
          `expired-bounty-release: released=${released} skipped=${skipped} ineligible=${ineligible}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `expired-bounty-release run failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
