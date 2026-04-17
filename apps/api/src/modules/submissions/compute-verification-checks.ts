/**
 * Pure function: compute the verification report for a single scraped post.
 *
 * Lives outside the SubmissionScraperService so it can be exhaustively
 * unit-tested without mocking Apify, Prisma, or Redis. Each rule maps 1:1
 * onto a row in the bounty's structured rules / eligibility config.
 *
 * Hunter eligibility checks (minFollowers / publicProfile / minAccountAgeDays)
 * are scoped to the *first* URL in a submission, not per-URL. The orchestrator
 * passes `hunterEligibility = null` for non-first URLs so those rules skip
 * cleanly here. This keeps the report shape clean and avoids duplicate
 * eligibility entries on multi-URL submissions.
 *
 * Return contract: only rules the bounty actually enforces produce entries.
 * A bounty with no `engagementRequirements`, no `payoutMetrics`, content
 * format `BOTH`, and no eligibility constraints returns `[]` — perfectly
 * valid and the orchestrator marks the URL VERIFIED with empty checks.
 */
import { ContentFormat, PostFormat, SocialChannel } from '@social-bounty/shared';
import type {
  EngagementRequirementsInput,
  PayoutMetricsInput,
  ScrapedPostData,
  StructuredEligibilityInput,
  VerificationCheck,
} from '@social-bounty/shared';

export interface ComputeChecksArgs {
  scraped: ScrapedPostData | null;
  expectedChannel: SocialChannel;
  expectedFormat: PostFormat;
  bountyRules: {
    engagementRequirements: EngagementRequirementsInput | null;
    payoutMetrics: PayoutMetricsInput | null;
    contentFormat: ContentFormat;
  };
  hunterEligibility: {
    followerCount: number | null;
    isPublic: boolean | null;
    accountAgeDays: number | null;
  } | null;
  bountyEligibility: StructuredEligibilityInput | null;
}

function normalize(handle: string): string {
  return handle.trim().toLowerCase().replace(/^@+/, '');
}

export function computeVerificationChecks(args: ComputeChecksArgs): VerificationCheck[] {
  const checks: VerificationCheck[] = [];

  // Defensive default — operate on an empty post if scrape returned null.
  // The orchestrator only calls us when a row is being marked anything other
  // than failed-network, but null-safety here prevents an unrelated KB entry.
  const scraped: ScrapedPostData = args.scraped ?? {
    likes: null,
    comments: null,
    views: null,
    caption: null,
    taggedUsernames: [],
    ownerUsername: null,
    postedAt: null,
    isVideo: null,
    detectedFormat: null,
  };

  const eng = args.bountyRules.engagementRequirements;
  const metrics = args.bountyRules.payoutMetrics;

  // ── Engagement requirements ────────────────────────────────────────

  if (eng?.tagAccount && eng.tagAccount.trim().length > 0) {
    const expected = normalize(eng.tagAccount);
    const tagged = scraped.taggedUsernames.map(normalize);
    const captionMatches =
      scraped.caption != null &&
      // Tolerant match: @handle anywhere in caption.
      new RegExp(`@${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
        scraped.caption,
      );
    const pass = tagged.includes(expected) || captionMatches;
    checks.push({
      rule: 'tagAccount',
      required: eng.tagAccount,
      actual: { tagged: scraped.taggedUsernames, captionContains: captionMatches },
      pass,
    });
  }

  if (eng?.mention === true) {
    const pass = /@[\w.]+/.test(scraped.caption ?? '');
    checks.push({
      rule: 'mention',
      required: true,
      actual: pass,
      pass,
    });
  }

  // ── Payout metric thresholds ───────────────────────────────────────

  if (metrics?.minViews != null) {
    const actual = scraped.views ?? 0;
    checks.push({
      rule: 'minViews',
      required: metrics.minViews,
      actual,
      pass: actual >= metrics.minViews,
    });
  }
  if (metrics?.minLikes != null) {
    const actual = scraped.likes ?? 0;
    checks.push({
      rule: 'minLikes',
      required: metrics.minLikes,
      actual,
      pass: actual >= metrics.minLikes,
    });
  }
  if (metrics?.minComments != null) {
    const actual = scraped.comments ?? 0;
    checks.push({
      rule: 'minComments',
      required: metrics.minComments,
      actual,
      pass: actual >= metrics.minComments,
    });
  }

  // ── Content-format gate ────────────────────────────────────────────

  if (args.bountyRules.contentFormat !== ContentFormat.BOTH) {
    const wantsVideo = args.bountyRules.contentFormat === ContentFormat.VIDEO_ONLY;
    const wantsPhoto = args.bountyRules.contentFormat === ContentFormat.PHOTO_ONLY;
    let pass = true;
    if (wantsVideo) pass = scraped.isVideo === true;
    if (wantsPhoto) pass = scraped.isVideo === false;
    checks.push({
      rule: 'contentFormat',
      required: args.bountyRules.contentFormat,
      actual: scraped.isVideo,
      pass,
    });
  }

  // ── Format match (Reel vs Feed Post vs Story) ──────────────────────
  // Skipped silently when the scraper couldn't determine format
  // (notably Facebook). Without a detectedFormat we'd false-fail.

  if (scraped.detectedFormat !== null) {
    checks.push({
      rule: 'formatMatch',
      required: args.expectedFormat,
      actual: scraped.detectedFormat,
      pass: scraped.detectedFormat === args.expectedFormat,
    });
  }

  // ── Hunter eligibility (only on the FIRST URL of a submission) ─────

  const elig = args.bountyEligibility;
  const hunter = args.hunterEligibility;

  if (elig?.minFollowers != null && hunter !== null) {
    const actual = hunter.followerCount ?? 0;
    checks.push({
      rule: 'minFollowers',
      required: elig.minFollowers,
      actual,
      pass: actual >= elig.minFollowers,
    });
  }
  if (elig?.publicProfile === true && hunter !== null) {
    checks.push({
      rule: 'publicProfile',
      required: true,
      actual: hunter.isPublic,
      pass: hunter.isPublic === true,
    });
  }
  if (elig?.minAccountAgeDays != null && hunter !== null) {
    const actual = hunter.accountAgeDays ?? 0;
    checks.push({
      rule: 'minAccountAgeDays',
      required: elig.minAccountAgeDays,
      actual,
      pass: actual >= elig.minAccountAgeDays,
    });
  }

  return checks;
}
