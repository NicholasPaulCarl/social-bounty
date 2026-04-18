import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  AUDIT_ACTIONS,
  DurationUnit,
  ENTITY_TYPES,
  PostVisibilityRule,
  SubmissionStatus,
  UserRole,
} from '@social-bounty/shared';
import type { PostVisibilityInput } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { KbService } from '../kb/kb.service';
import { LedgerService } from '../ledger/ledger.service';
import { RefundsService } from '../refunds/refunds.service';
import { SubmissionScraperService } from './submission-scraper.service';
import type { AuthenticatedUser } from '../auth/jwt.strategy';

/**
 * Phase 2A — PostVisibility re-check scheduler.
 *
 * Runs every 6 hours and verifies that approved submissions whose
 * bounty has a PostVisibility rule (`MUST_NOT_REMOVE` or
 * `MINIMUM_DURATION`) still have accessible posts. After 2 consecutive
 * failed re-scrapes, automatically issues a post-approval refund and
 * notifies both brand and hunter.
 *
 * Cadence buckets (per submission, age = now − approvedAt):
 *   - Days 1–7    → re-scrape every 24h
 *   - Days 8–30   → re-scrape every 72h
 *   - Days 31+    → re-scrape every 7d
 *
 * Stop conditions:
 *   - MINIMUM_DURATION: skip once age > minDurationValue × unit
 *   - MUST_NOT_REMOVE: skip once age > 90 days (perpetual rule has a
 *     hard cap to bound long-tail Apify cost)
 *
 * Lock: a Redis pass-lock prevents two cron ticks from overlapping
 * (`apify:scheduler-lock:visibility-recheck`, TTL slightly under the
 * 6h tick interval).
 *
 * Cap: MAX_PER_RUN = 100 submissions per tick. Oldest-
 * `lastVisibilityCheckAt`-first prevents starvation under sustained
 * load — a never-checked submission has lastVisibilityCheckAt=null
 * which sorts before any timestamped row.
 *
 * Refund actor: STITCH_SYSTEM_ACTOR_ID (the same env-driven system
 * actor used by ClearanceService and SubscriptionLifecycleScheduler).
 * If unset, the scheduler logs a warning and skips refund issuance —
 * checks still bump the counter so the next tick (after env fix) can
 * trigger the refund.
 */
const MAX_PER_RUN = 100;
const FAILURE_THRESHOLD = 2;
const HARD_CAP_DAYS = 90;
const PASS_LOCK_KEY = 'apify:scheduler-lock:visibility-recheck';
// Slightly under 6 hours so a stuck pass clears itself before the next
// tick (mirrors the apify-social.scheduler.ts pattern).
const PASS_LOCK_TTL_SECS = 5 * 60 * 60 + 30 * 60; // 5h30m

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

// Cadence interval in milliseconds, given submission age in days.
function intervalMs(ageDays: number): number {
  if (ageDays <= 7) return 24 * MS_PER_HOUR;
  if (ageDays <= 30) return 72 * MS_PER_HOUR;
  return 7 * 24 * MS_PER_HOUR;
}

// Convert DurationUnit + value into total minutes / days for window math.
function durationToDays(value: number, unit: DurationUnit | null | undefined): number {
  if (!unit) return value; // default to days when unit absent
  switch (unit) {
    case DurationUnit.HOURS:
      return value / 24;
    case DurationUnit.DAYS:
      return value;
    case DurationUnit.WEEKS:
      return value * 7;
    default:
      return value;
  }
}

@Injectable()
export class SubmissionVisibilityScheduler {
  private readonly logger = new Logger(SubmissionVisibilityScheduler.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private auditService: AuditService,
    private mailService: MailService,
    private kbService: KbService,
    private ledgerService: LedgerService,
    private refundsService: RefundsService,
    private scraper: SubmissionScraperService,
    private config: ConfigService,
  ) {}

  /**
   * 6-hourly cron entry point. Lock-guarded; no-op when nothing eligible.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async runRecheckPass(): Promise<void> {
    const acquired = await this.redis.setNxEx(
      PASS_LOCK_KEY,
      '1',
      PASS_LOCK_TTL_SECS,
    );
    if (!acquired) {
      this.logger.warn(
        'Visibility re-check pass already in progress — skipping this tick',
      );
      return;
    }

    try {
      const now = new Date();

      // Pull APPROVED submissions; filter further in JS for the visibility
      // rule + cadence + window. The candidate set is bounded by approved-
      // with-approvedAt, which is already small for MVP. Prisma JSON-path
      // filtering varies across versions and isn't worth the brittleness
      // here — the JS pass costs nothing per row.
      const candidates = await this.prisma.submission.findMany({
        where: {
          status: SubmissionStatus.APPROVED,
          approvedAt: { not: null },
        },
        include: {
          bounty: {
            select: {
              id: true,
              title: true,
              brandId: true,
              postVisibility: true,
            },
          },
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: [{ lastVisibilityCheckAt: 'asc' }],
        take: MAX_PER_RUN * 4, // overshoot: many filtered out by cadence/cap
      });

      const eligible = candidates.filter((s) => {
        const visibility = (s.bounty.postVisibility ??
          null) as unknown as PostVisibilityInput | null;
        if (!visibility?.rule) return false;
        if (!s.approvedAt) return false;

        const ageMs = now.getTime() - new Date(s.approvedAt).getTime();
        const ageDays = ageMs / MS_PER_DAY;

        // Window check: stop entirely when MINIMUM_DURATION elapses or
        // MUST_NOT_REMOVE hits the 90d hard cap.
        if (visibility.rule === PostVisibilityRule.MINIMUM_DURATION) {
          const window = durationToDays(
            visibility.minDurationValue ?? 0,
            visibility.minDurationUnit ?? null,
          );
          if (window > 0 && ageDays > window) return false;
        } else if (visibility.rule === PostVisibilityRule.MUST_NOT_REMOVE) {
          if (ageDays > HARD_CAP_DAYS) return false;
        }

        // Cadence check: only run when interval has elapsed since last
        // check (or never-checked, which we always want to run).
        const interval = intervalMs(ageDays);
        if (s.lastVisibilityCheckAt) {
          const sinceLast =
            now.getTime() - new Date(s.lastVisibilityCheckAt).getTime();
          if (sinceLast < interval) return false;
        }

        return true;
      });

      if (eligible.length === 0) {
        this.logger.debug('Visibility re-check pass: nothing eligible');
        return;
      }

      const batch = eligible.slice(0, MAX_PER_RUN);

      this.logger.log(
        `Visibility re-check pass: processing ${batch.length}/${eligible.length} eligible submissions`,
      );

      // Promise.allSettled — one bad submission shouldn't block the batch.
      const results = await Promise.allSettled(
        batch.map((s) => this.processOne(s)),
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        this.logger.error(
          `${failures.length}/${batch.length} visibility re-checks threw: ${failures
            .slice(0, 3)
            .map((f) => (f as PromiseRejectedResult).reason)
            .join('; ')}`,
        );
      }
    } finally {
      await this.redis.del(PASS_LOCK_KEY).catch((err) => {
        this.logger.warn(
          'Failed to release visibility-recheck pass lock',
          err,
        );
      });
    }
  }

  /**
   * Process one submission: re-scrape, history-write (handled by
   * scraper.rescrapeForVisibility), bump counter on failure / reset on
   * success, trigger refund + notifications at the failure threshold.
   */
  private async processOne(submission: {
    id: string;
    userId: string;
    consecutiveVisibilityFailures: number;
    bounty: { id: string; title: string; brandId: string; postVisibility: unknown };
    user: { email: string; firstName: string | null; lastName: string | null };
  }): Promise<void> {
    const summary = await this.scraper.rescrapeForVisibility(submission.id);

    // Stamp the check timestamp regardless of outcome so the cadence
    // bucketing can advance.
    const now = new Date();
    const anyFailed = summary.failedUrls > 0;
    const previousConsecutive = submission.consecutiveVisibilityFailures;

    // Kill-switch gate (ADR 0010 §3): when the financial kill switch is
    // active we must NOT issue an auto-refund. We also do NOT bump the
    // failure counter past the previous value at the threshold — leaving
    // it at FAILURE_THRESHOLD-1 means the next post-clearance tick will
    // immediately re-attempt the refund without inflating the counter.
    // Emails are suppressed because the brand+hunter "post removed"
    // copy describes a refund that did not happen.
    const wouldHitThreshold =
      anyFailed && previousConsecutive + 1 >= FAILURE_THRESHOLD;
    const killSwitchActive = wouldHitThreshold
      ? await this.ledgerService.isKillSwitchActive().catch((err) => {
          this.logger.warn(
            `Kill-switch read failed for ${submission.id}; treating as active for safety: ${
              err instanceof Error ? err.message : err
            }`,
          );
          return true;
        })
      : false;

    const newConsecutive = anyFailed
      ? killSwitchActive
        ? previousConsecutive
        : previousConsecutive + 1
      : 0;

    await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        lastVisibilityCheckAt: now,
        consecutiveVisibilityFailures: newConsecutive,
      },
    });

    if (killSwitchActive) {
      this.logger.warn(
        `Auto-refund deferred for submission ${submission.id} — kill switch active`,
      );
      await this.kbService
        .recordRecurrence({
          category: 'post_visibility',
          system: 'submission-scraper',
          title: 'Auto-refund deferred while kill switch is active',
          severity: 'warning',
          errorCode: 'POST_VISIBILITY_REFUND_KILL_SWITCHED',
          metadata: {
            system: 'submission-scraper',
            submissionId: submission.id,
            bountyId: submission.bounty.id,
          },
        })
        .catch((err) => {
          this.logger.warn(
            `KB kill-switch record failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
          );
        });
      return;
    }

    if (!anyFailed) {
      this.logger.debug(
        `Visibility re-check OK for ${submission.id} (counter reset)`,
      );
      return;
    }

    const failureReason = summary.failureMessages.join('; ') || 'unknown failure';
    const visibility = (submission.bounty.postVisibility ??
      null) as unknown as PostVisibilityInput | null;
    const ruleLabel = visibility?.rule ?? 'PostVisibility';

    // KB recurrence record on every failure — the first failure is
    // medium severity (could be Apify hiccup); the second crosses the
    // threshold for refund.
    if (newConsecutive === 1) {
      await this.kbService
        .recordRecurrence({
          category: 'post_visibility',
          system: 'submission-scraper',
          title: `PostVisibility first-failure: submission ${submission.id}`,
          severity: 'warning',
          errorCode: 'POST_VISIBILITY_FIRST_FAILURE',
          metadata: {
            system: 'submission-scraper',
            submissionId: submission.id,
            bountyId: submission.bounty.id,
            failureReason,
            failedUrls: summary.failedUrls,
            totalUrls: summary.totalUrls,
          },
        })
        .catch((err) => {
          this.logger.warn(
            `KB record failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
          );
        });
      this.logger.warn(
        `Visibility re-check first failure for ${submission.id} — counter at 1, awaiting threshold`,
      );
      return;
    }

    if (newConsecutive < FAILURE_THRESHOLD) {
      this.logger.warn(
        `Visibility re-check failure for ${submission.id} — counter at ${newConsecutive}, below threshold`,
      );
      return;
    }

    // Threshold hit. Fire the auto-refund + emails. We log the second-
    // failure KB recurrence at critical severity since this is the
    // structural signal (one failure is noise, two consecutive is real).
    await this.kbService
      .recordRecurrence({
        category: 'post_visibility',
        system: 'submission-scraper',
        title: `PostVisibility threshold reached: submission ${submission.id}`,
        severity: 'critical',
        errorCode: 'POST_VISIBILITY_THRESHOLD_REACHED',
        metadata: {
          system: 'submission-scraper',
          submissionId: submission.id,
          bountyId: submission.bounty.id,
          failureReason,
          consecutiveFailures: newConsecutive,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `KB threshold record failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
        );
      });

    await this.triggerAutoRefund(submission, failureReason, ruleLabel, newConsecutive);
  }

  /**
   * Issues the post-approval refund as the system actor. Sends emails
   * to brand admin + hunter regardless of refund outcome (a refund
   * failure is logged + audit-trailed; humans still need to know).
   */
  private async triggerAutoRefund(
    submission: {
      id: string;
      userId: string;
      bounty: { id: string; title: string; brandId: string };
      user: { email: string; firstName: string | null; lastName: string | null };
    },
    failureReason: string,
    ruleLabel: string,
    consecutiveFailures: number,
  ): Promise<void> {
    const systemActorId = this.config.get<string>('STITCH_SYSTEM_ACTOR_ID', '') ?? '';

    const reason = `Auto-detected: post no longer accessible after ${consecutiveFailures} consecutive scrape failures (${failureReason})`;

    if (!systemActorId) {
      this.logger.error(
        `STITCH_SYSTEM_ACTOR_ID unset — cannot issue auto-refund for ${submission.id}. Counter held at threshold; next tick after env fix will retry.`,
      );
      return;
    }

    const systemUser: AuthenticatedUser = {
      sub: systemActorId,
      email: 'system@socialbounty.local',
      role: UserRole.SUPER_ADMIN,
      brandId: null,
    };

    let refundIssued = false;
    try {
      await this.refundsService.requestAfterApproval(
        submission.id,
        reason,
        systemUser,
      );
      refundIssued = true;
    } catch (err) {
      this.logger.error(
        `Auto-refund failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Audit-log the trigger regardless of refund success — the human
    // operator needs the trail of "we tried" even when Stitch errored.
    await this.auditService
      .log({
        actorId: systemActorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND,
        entityType: ENTITY_TYPES.SUBMISSION,
        entityId: submission.id,
        beforeState: { consecutiveVisibilityFailures: consecutiveFailures - 1 },
        afterState: {
          consecutiveVisibilityFailures: consecutiveFailures,
          refundIssued,
          ruleLabel,
        },
        reason,
      })
      .catch((err) => {
        this.logger.warn(
          `Audit log write failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
        );
      });

    // Look up the brand admin for the email — at minimum we need the
    // first member of the brand. Send-best-effort; logged on failure.
    const brand = await this.prisma.brand.findUnique({
      where: { id: submission.bounty.brandId },
      select: { name: true, members: { select: { user: { select: { email: true, firstName: true } } }, take: 1 } },
    });
    const brandMember = brand?.members[0]?.user;
    const brandName = brand?.name ?? 'Brand';

    if (brandMember?.email) {
      this.mailService
        .sendPostRemovedBrandEmail(brandMember.email, {
          brandName,
          hunterName: [submission.user.firstName, submission.user.lastName]
            .filter(Boolean)
            .join(' ') || 'Hunter',
          bountyTitle: submission.bounty.title,
          visibilityRule: ruleLabel,
          failureReason,
          consecutiveFailures,
        })
        .catch((err) => {
          this.logger.warn(
            `Brand auto-refund email failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
          );
        });
    } else {
      this.logger.warn(
        `No brand member email for brand ${submission.bounty.brandId} — skipping brand notification for ${submission.id}`,
      );
    }

    if (submission.user.email) {
      this.mailService
        .sendPostRemovedHunterEmail(submission.user.email, {
          userName: submission.user.firstName || 'Participant',
          bountyTitle: submission.bounty.title,
          visibilityRule: ruleLabel,
          failureReason,
        })
        .catch((err) => {
          this.logger.warn(
            `Hunter auto-refund email failed for ${submission.id}: ${err instanceof Error ? err.message : err}`,
          );
        });
    }

    this.logger.log(
      `Visibility auto-refund processed for ${submission.id} (refundIssued=${refundIssued}, ruleLabel=${ruleLabel})`,
    );
  }
}

