/**
 * Pure function: derive the "auto-verification preview" report for a bounty.
 *
 * Mirrors the gating logic in `apps/api/src/modules/submissions/compute-verification-checks.ts`,
 * but emits checks with `actual: null` and `pass: false` because at preview time
 * we don't have a scraped post yet — we're showing brands/hunters what the
 * Apify pipeline *will* check on every submission.
 *
 * Input shape:
 *   The `BountyPreviewInput` interface is the smallest "rules-relevant slice"
 *   of a bounty that this function needs. Both `BountyDetailResponse` (the
 *   saved-bounty wire shape) and `BountyFormState` (the in-flight form-state
 *   shape) structurally satisfy it — that's how the same function powers both
 *   the saved-bounty preview pages and the live preview shown inside the
 *   bounty form during creation/edit (Phase 3C).
 *
 * Return contract:
 *   - Per-URL groups keyed by `${channel}_${format}` (one entry per (channel, format)
 *     pair that appears in `input.channels`).
 *   - A synthetic `__eligibility__` key when any hunter-eligibility rule is set
 *     (`minFollowers` / `publicProfile` / `minAccountAgeDays`). The panel renders
 *     this section above the per-URL groups.
 *
 * A bounty with no engagement requirements, no payout metrics, content format
 * `BOTH`, and no eligibility constraints returns `{}` — the panel renders the
 * "no auto-verification rules" empty state. This mirrors the cost-guard branch
 * in `SubmissionScraperService` which skips Apify entirely for such bounties.
 */
import {
  ContentFormat,
  PostFormat,
  SocialChannel,
  type ChannelSelection,
  type EngagementRequirementsInput,
  type PayoutMetricsInput,
  type StructuredEligibilityInput,
  type VerificationCheck,
} from '@social-bounty/shared';

export const ELIGIBILITY_KEY = '__eligibility__';

/**
 * The minimum slice of a bounty needed to derive preview checks. Designed so
 * both `BountyDetailResponse` (saved bounty) and `BountyFormState` (in-flight
 * form) structurally satisfy it without wrapping or copying.
 *
 * Optional fields use `?` (rather than required + nullable) so the form state
 * — which never has `null` for these — assigns cleanly without explicit
 * coercion. The function treats `null` and `undefined` the same way.
 */
export interface BountyPreviewInput {
  channels: ChannelSelection | null;
  contentFormat: ContentFormat;
  engagementRequirements?: EngagementRequirementsInput | null;
  payoutMetrics?: PayoutMetricsInput | null;
  structuredEligibility?: StructuredEligibilityInput | null;
}

/**
 * Format-detection hints we trust. Mirrors `FORMAT_URL_HINTS` in
 * `apps/api/src/modules/submissions/submission-coverage.validator.ts` —
 * if the scraper can detect the format from the URL, we add a `formatMatch`
 * preview row. Facebook is intentionally absent (its URLs don't expose
 * format), so no formatMatch row is shown there.
 */
const FORMATS_WITH_DETECTION: Partial<Record<SocialChannel, PostFormat[]>> = {
  [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST, PostFormat.STORY],
  [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
  // FACEBOOK: no format hints
};

export function pairKey(channel: SocialChannel, format: PostFormat): string {
  return `${channel}_${format}`;
}

/**
 * Whether the bounty has *any* auto-verification rule the scraper would check.
 * Used by the panel to decide whether to render the "no rules" empty state.
 */
export function hasAnyPreviewChecks(input: BountyPreviewInput): boolean {
  const groups = derivePreviewChecks(input);
  return Object.values(groups).some((checks) => checks.length > 0);
}

export function derivePreviewChecks(
  input: BountyPreviewInput,
): Record<string, VerificationCheck[]> {
  const groups: Record<string, VerificationCheck[]> = {};

  const eng = input.engagementRequirements;
  const metrics = input.payoutMetrics;
  const elig = input.structuredEligibility;
  const contentFormat = input.contentFormat;
  const channels = input.channels ?? {};

  // ── Eligibility checks (synthetic key, applies once across submission) ──

  const eligibilityChecks: VerificationCheck[] = [];
  if (elig?.minFollowers != null) {
    eligibilityChecks.push({
      rule: 'minFollowers',
      required: elig.minFollowers,
      actual: null,
      pass: false,
    });
  }
  if (elig?.publicProfile === true) {
    eligibilityChecks.push({
      rule: 'publicProfile',
      required: true,
      actual: null,
      pass: false,
    });
  }
  if (elig?.minAccountAgeDays != null) {
    eligibilityChecks.push({
      rule: 'minAccountAgeDays',
      required: elig.minAccountAgeDays,
      actual: null,
      pass: false,
    });
  }
  if (eligibilityChecks.length > 0) {
    groups[ELIGIBILITY_KEY] = eligibilityChecks;
  }

  // ── Per (channel, format) groups ───────────────────────────────────────

  for (const channelKey of Object.keys(channels) as SocialChannel[]) {
    const formats = channels[channelKey] ?? [];
    for (const format of formats) {
      const checks: VerificationCheck[] = [];

      // Engagement
      if (eng?.tagAccount && eng.tagAccount.trim().length > 0) {
        checks.push({
          rule: 'tagAccount',
          required: eng.tagAccount,
          actual: null,
          pass: false,
        });
      }
      if (eng?.mention === true) {
        checks.push({
          rule: 'mention',
          required: true,
          actual: null,
          pass: false,
        });
      }

      // Payout metrics
      if (metrics?.minViews != null) {
        checks.push({
          rule: 'minViews',
          required: metrics.minViews,
          actual: null,
          pass: false,
        });
      }
      if (metrics?.minLikes != null) {
        checks.push({
          rule: 'minLikes',
          required: metrics.minLikes,
          actual: null,
          pass: false,
        });
      }
      if (metrics?.minComments != null) {
        checks.push({
          rule: 'minComments',
          required: metrics.minComments,
          actual: null,
          pass: false,
        });
      }

      // Content format gate (only when bounty restricts to one)
      if (contentFormat !== ContentFormat.BOTH) {
        checks.push({
          rule: 'contentFormat',
          required: contentFormat,
          actual: null,
          pass: false,
        });
      }

      // Format match — only when the scraper can detect the format from URL.
      // Facebook formats produce no entry; that mirrors the runtime behavior.
      const detectable = FORMATS_WITH_DETECTION[channelKey] ?? [];
      if (detectable.includes(format)) {
        checks.push({
          rule: 'formatMatch',
          required: format,
          actual: null,
          pass: false,
        });
      }

      groups[pairKey(channelKey, format)] = checks;
    }
  }

  return groups;
}
