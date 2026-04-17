import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ContentFormat,
  PostFormat,
  SocialChannel,
  SocialPlatform,
} from '@social-bounty/shared';
import type {
  EngagementRequirementsInput,
  PayoutMetricsInput,
  ScrapedPostData,
  StructuredEligibilityInput,
  VerificationCheck,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApifyService, type PostScrapeResult } from '../apify/apify.service';
import { computeVerificationChecks } from './compute-verification-checks';

/**
 * Background orchestrator for per-URL submission scraping + verification.
 *
 * Triggered fire-and-forget by `SubmissionsService.create` (and `updateSubmission`
 * on resubmit) via `setImmediate` after the database transaction commits. The
 * service owns three responsibilities:
 *
 *  1. **Cost guard** — if the bounty has no rules to verify, mark every
 *     PENDING url scrape as VERIFIED with empty checks. Zero Apify cost.
 *  2. **Lock** — a per-submission Redis lock prevents two concurrent runs
 *     from racing (e.g. resubmit triggered while a previous scrape is in
 *     flight) and from billing duplicate actor invocations.
 *  3. **Per-channel batching** — URLs are grouped by channel and passed to
 *     a single actor call per channel. Results merge per-URL into a single
 *     `prisma.$transaction` so partial failures are recorded, not lost.
 *
 * Idempotency: VERIFIED rows are never re-scraped on a retry — the cost
 * guard at the top of the run is also an implicit cache. Re-run on the
 * same submission only acts on PENDING / FAILED rows.
 */
const SCRAPE_LOCK_TTL_SECS = 5 * 60; // 5 minutes — matches REFRESH_LOCK_TTL_SECS in apify.service

const PLATFORM_TO_CHANNEL: Record<SocialChannel, SocialPlatform> = {
  [SocialChannel.INSTAGRAM]: SocialPlatform.INSTAGRAM,
  [SocialChannel.FACEBOOK]: SocialPlatform.FACEBOOK,
  [SocialChannel.TIKTOK]: SocialPlatform.TIKTOK,
};

@Injectable()
export class SubmissionScraperService {
  private readonly logger = new Logger(SubmissionScraperService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private apify: ApifyService,
  ) {}

  /**
   * Background entry point. Safe to call repeatedly: only PENDING / FAILED
   * rows are operated on — VERIFIED rows act as the cache.
   */
  async scrapeAndVerify(submissionId: string): Promise<void> {
    const lockKey = `apify:scrape-lock:submission:${submissionId}`;
    const acquired = await this.redis.setNxEx(lockKey, '1', SCRAPE_LOCK_TTL_SECS);
    if (!acquired) {
      this.logger.debug(`Skip scrape for submission ${submissionId} — lock held`);
      return;
    }

    try {
      const submission = await this.prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          urlScrapes: { orderBy: { createdAt: 'asc' } },
          bounty: {
            select: {
              channels: true,
              engagementRequirements: true,
              payoutMetrics: true,
              contentFormat: true,
              structuredEligibility: true,
            },
          },
        },
      });
      if (!submission) {
        this.logger.warn(`Submission ${submissionId} not found — skipping scrape`);
        return;
      }

      const allScrapes = submission.urlScrapes;
      if (allScrapes.length === 0) {
        this.logger.debug(`Submission ${submissionId} has no urlScrapes — nothing to do`);
        return;
      }

      const bounty = submission.bounty;
      const rules = {
        engagementRequirements: (bounty.engagementRequirements ??
          null) as unknown as EngagementRequirementsInput | null,
        payoutMetrics: (bounty.payoutMetrics ??
          null) as unknown as PayoutMetricsInput | null,
        contentFormat: (bounty.contentFormat as ContentFormat) ?? ContentFormat.BOTH,
      };
      const eligibility = (bounty.structuredEligibility ??
        null) as unknown as StructuredEligibilityInput | null;

      // ── Cost guard ───────────────────────────────────────────────────
      // No engagement rules, no payout metrics, content format unrestricted,
      // no meaningful eligibility → mark every PENDING row VERIFIED with
      // empty checks. Zero Apify cost.
      const hasMeaningfulEligibility =
        eligibility != null &&
        ((eligibility.minFollowers != null && eligibility.minFollowers > 0) ||
          eligibility.publicProfile === true ||
          (eligibility.minAccountAgeDays != null && eligibility.minAccountAgeDays > 0));

      const hasAnyRules =
        rules.engagementRequirements != null ||
        rules.payoutMetrics != null ||
        rules.contentFormat !== ContentFormat.BOTH ||
        hasMeaningfulEligibility;

      if (!hasAnyRules) {
        const pending = allScrapes.filter((s) => s.scrapeStatus === 'PENDING');
        if (pending.length === 0) return;
        await this.prisma.$transaction(
          pending.map((s) =>
            this.prisma.submissionUrlScrape.update({
              where: { id: s.id },
              data: {
                scrapeStatus: 'VERIFIED',
                verificationChecks: [] as unknown as Prisma.InputJsonValue,
                scrapedAt: new Date(),
              },
            }),
          ),
        );
        this.logger.debug(
          `Cost guard: marked ${pending.length} url scrape(s) for submission ${submissionId} VERIFIED with empty checks`,
        );
        return;
      }

      // ── Filter to rows that need work ────────────────────────────────
      // VERIFIED is the cache — we never re-scrape those. PENDING is fresh,
      // FAILED is a retry from a hunter resubmit.
      const todo = allScrapes.filter(
        (s) => s.scrapeStatus === 'PENDING' || s.scrapeStatus === 'FAILED',
      );
      if (todo.length === 0) {
        this.logger.debug(`Submission ${submissionId} — no PENDING / FAILED rows`);
        return;
      }

      // Mark IN_PROGRESS so the UI can show a spinner the moment a refetch
      // hits. updateMany works because we're not changing relation fields.
      await this.prisma.submissionUrlScrape.updateMany({
        where: { id: { in: todo.map((t) => t.id) } },
        data: { scrapeStatus: 'IN_PROGRESS', errorMessage: null },
      });

      // ── Eligibility lookup (one DB read for all hunter handles) ─────
      const channels = Array.from(new Set(todo.map((t) => t.channel as SocialChannel)));
      const handles = await this.prisma.userSocialHandle.findMany({
        where: {
          userId: submission.userId,
          platform: { in: channels.map((c) => PLATFORM_TO_CHANNEL[c]) },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eligibilityByChannel = new Map<SocialChannel, any>();
      for (const h of handles) {
        const ch = Object.entries(PLATFORM_TO_CHANNEL).find(
          ([, p]) => p === h.platform,
        )?.[0] as SocialChannel | undefined;
        if (!ch) continue;
        const accountAgeDays = Math.floor(
          (Date.now() - new Date(h.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        eligibilityByChannel.set(ch, {
          followerCount: h.followerCount ?? null,
          // UserSocialHandle has no isPublic column — leave null so the
          // publicProfile check skips silently rather than false-failing.
          isPublic: null,
          accountAgeDays,
        });
      }

      // ── Per-channel batched Apify calls ──────────────────────────────
      const byChannel: Record<SocialChannel, string[]> = {
        [SocialChannel.INSTAGRAM]: [],
        [SocialChannel.FACEBOOK]: [],
        [SocialChannel.TIKTOK]: [],
      };
      for (const t of todo) byChannel[t.channel as SocialChannel].push(t.url);

      const [igResults, fbResults, ttResults] = await Promise.all([
        byChannel[SocialChannel.INSTAGRAM].length > 0
          ? this.apify.scrapeInstagramPosts(byChannel[SocialChannel.INSTAGRAM])
          : Promise.resolve(new Map<string, PostScrapeResult>()),
        byChannel[SocialChannel.FACEBOOK].length > 0
          ? this.apify.scrapeFacebookPosts(byChannel[SocialChannel.FACEBOOK])
          : Promise.resolve(new Map<string, PostScrapeResult>()),
        byChannel[SocialChannel.TIKTOK].length > 0
          ? this.apify.scrapeTiktokPosts(byChannel[SocialChannel.TIKTOK])
          : Promise.resolve(new Map<string, PostScrapeResult>()),
      ]);

      const allResults = new Map<string, PostScrapeResult>([
        ...igResults,
        ...fbResults,
        ...ttResults,
      ]);

      // ── Compute checks + persist all rows in a single transaction ───
      // Eligibility checks attach to the FIRST url scrape of the submission
      // (deterministically: createdAt asc). hunterEligibility is null for
      // every other URL so the eligibility branches in computeVerificationChecks
      // skip cleanly.
      const firstUrlId = allScrapes[0].id;

      const updates: Prisma.PrismaPromise<unknown>[] = [];
      for (const row of todo) {
        const result = allResults.get(row.url);
        const updateBase = { scrapedAt: new Date() };
        if (!result || 'error' in result) {
          updates.push(
            this.prisma.submissionUrlScrape.update({
              where: { id: row.id },
              data: {
                ...updateBase,
                scrapeStatus: 'FAILED',
                errorMessage: result ? result.error : 'Unknown scrape error',
                scrapeResult: Prisma.DbNull,
                verificationChecks: Prisma.DbNull,
              },
            }),
          );
          continue;
        }
        const isFirst = row.id === firstUrlId;
        const checks: VerificationCheck[] = computeVerificationChecks({
          scraped: result,
          expectedChannel: row.channel as SocialChannel,
          expectedFormat: row.format as PostFormat,
          bountyRules: rules,
          hunterEligibility: isFirst
            ? eligibilityByChannel.get(row.channel as SocialChannel) ?? null
            : null,
          bountyEligibility: eligibility,
        });
        const failed = checks.filter((c) => !c.pass);
        const finalStatus = failed.length === 0 ? 'VERIFIED' : 'FAILED';
        const errorMessage =
          failed.length > 0
            ? `Failed checks: ${failed.map((f) => f.rule).join(', ')}`
            : null;
        updates.push(
          this.prisma.submissionUrlScrape.update({
            where: { id: row.id },
            data: {
              ...updateBase,
              scrapeStatus: finalStatus,
              scrapeResult: result as unknown as Prisma.InputJsonValue,
              verificationChecks: checks as unknown as Prisma.InputJsonValue,
              errorMessage,
            },
          }),
        );
      }

      try {
        await this.prisma.$transaction(updates);
      } catch (err) {
        // P2025 = "Record to update not found" — the row was deleted (e.g.
        // submission deleted) mid-scrape. Log and move on; nothing to recover.
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2025'
        ) {
          this.logger.warn(
            `Scrape result lost: submission ${submissionId} row(s) deleted mid-scrape`,
          );
          return;
        }
        throw err;
      }

      this.logger.log(
        `Submission ${submissionId} scrape complete — ${todo.length} URL(s) processed`,
      );
    } finally {
      await this.redis.del(lockKey).catch((err) => {
        this.logger.warn(
          `Failed to release scrape lock for submission ${submissionId}`,
          err,
        );
      });
    }
  }
}

// Re-export the pure check fn for callers that want to compute without the
// service overhead (e.g. preview of "rules to be auto-verified" in Phase 2).
export { computeVerificationChecks };
export type { ScrapedPostData };
