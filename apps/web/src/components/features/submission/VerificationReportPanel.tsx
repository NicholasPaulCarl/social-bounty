'use client';

import {
  CheckCircle2,
  XCircle,
  Shield,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import type {
  SubmissionUrlScrapeInfo,
  VerificationCheck,
  ScrapedPostData,
  ReportedMetricsInput,
} from '@social-bounty/shared';
import { ELIGIBILITY_KEY } from '@/lib/utils/bounty-preview-checks';

/**
 * Two distinct modes:
 *
 * 1. Submission-report mode (default): consumers pass `urlScrapes` from a
 *    submission. Renders per-URL panels with status badges, scraped-vs-
 *    hunter metrics, and pass/fail check lists. This is the brand-side
 *    review-page surface that shipped in PR 4 of the bounty-submission feature.
 *
 * 2. Preview mode (`previewMode`): consumers pass `previewChecks` derived
 *    from a bounty (via `derivePreviewChecks`). Renders per-rule-group lists
 *    with no status/scraped axis — `actual` is unknown until a hunter submits.
 *    Used on bounty-detail pages so brands and hunters see ahead of time what
 *    Apify will auto-verify on every submission. The `audience` prop swaps
 *    the section heading copy.
 */
interface BasePanelProps {
  reportedMetrics?: ReportedMetricsInput | null;
}

interface SubmissionPanelProps extends BasePanelProps {
  previewMode?: false;
  urlScrapes: SubmissionUrlScrapeInfo[];
  previewChecks?: never;
  audience?: never;
}

/**
 * `audience` controls the section heading + per-group subtitle copy.
 *   - 'brand'      — saved-bounty preview shown to the brand owner.
 *   - 'hunter'     — saved-bounty preview shown to a participant browsing.
 *   - 'brand-form' — live preview shown inside the bounty create/edit form.
 *                    Empty-state copy nudges the brand toward picking
 *                    channels and adding rules, rather than the
 *                    saved-bounty "submissions go to manual review" framing.
 */
interface PreviewPanelProps extends BasePanelProps {
  previewMode: true;
  previewChecks: Record<string, VerificationCheck[]>;
  audience?: 'brand' | 'hunter' | 'brand-form';
  urlScrapes?: never;
}

type VerificationReportPanelProps = SubmissionPanelProps | PreviewPanelProps;

const CHANNEL_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
};

const FORMAT_LABELS: Record<string, string> = {
  STORY: 'Story',
  REEL: 'Reel',
  FEED_POST: 'Feed Post',
  VIDEO_POST: 'Video',
};

const RULE_LABELS: Record<VerificationCheck['rule'], string> = {
  tagAccount: 'Tags required account',
  mention: 'Mentions an account',
  minViews: 'Minimum views',
  minLikes: 'Minimum likes',
  minComments: 'Minimum comments',
  contentFormat: 'Content format',
  formatMatch: 'URL format matches',
  minFollowers: 'Hunter follower count',
  publicProfile: 'Hunter profile is public',
  minAccountAgeDays: 'Hunter account age (days)',
};

function truncateUrl(url: string, max = 60): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 3)}...`;
}

function formatRuleValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

function MetricCell({
  label,
  reported,
  scraped,
}: {
  label: string;
  reported: number | null | undefined;
  scraped: number | null | undefined;
}) {
  const hasReported = reported !== null && reported !== undefined;
  const hasScraped = scraped !== null && scraped !== undefined;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-muted text-[10px] uppercase tracking-wider font-medium">{label}</span>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-text-secondary text-xs">Hunter:</span>
        <span className={hasReported ? 'text-text-primary font-mono tabular-nums font-medium' : 'text-text-muted'}>
          {hasReported ? reported.toLocaleString() : '—'}
        </span>
      </div>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-text-secondary text-xs">Scraped:</span>
        <span className={hasScraped ? 'text-text-primary font-mono tabular-nums font-medium' : 'text-text-muted'}>
          {hasScraped ? scraped.toLocaleString() : '—'}
        </span>
      </div>
    </div>
  );
}

function UrlScrapeCard({
  scrape,
  reportedMetrics,
}: {
  scrape: SubmissionUrlScrapeInfo;
  reportedMetrics?: ReportedMetricsInput | null;
}) {
  const isVerified = scrape.scrapeStatus === 'VERIFIED';
  const isFailed = scrape.scrapeStatus === 'FAILED';
  const scraped: ScrapedPostData | null = scrape.scrapeResult;
  const checks: VerificationCheck[] = scrape.verificationChecks ?? [];

  const badgeClass = isVerified
    ? 'bg-success-600/10 text-success-600 border border-success-600/30'
    : 'bg-danger-600/10 text-danger-600 border border-danger-600/30';

  const BadgeIcon = isVerified ? CheckCircle2 : XCircle;

  return (
    <div className="glass-card !rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">
            {CHANNEL_LABELS[scrape.channel] ?? scrape.channel}{' '}
            <span className="font-normal text-text-secondary">
              {FORMAT_LABELS[scrape.format] ?? scrape.format}
            </span>
          </div>
          <a
            href={scrape.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:underline text-xs break-all"
            title={scrape.url}
          >
            {truncateUrl(scrape.url)}
          </a>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClass} shrink-0`}
          role="status"
          aria-label={`Verification status: ${scrape.scrapeStatus}`}
        >
          <BadgeIcon size={12} strokeWidth={2} aria-hidden="true" />
          {scrape.scrapeStatus}
        </span>
      </div>

      {isFailed && scrape.errorMessage && (
        <div className="bg-danger-600/10 border border-danger-600/30 text-danger-600 text-xs px-3 py-2 rounded-lg flex items-start gap-1.5">
          <AlertCircle size={14} strokeWidth={2} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{scrape.errorMessage}</span>
        </div>
      )}

      {scraped && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <MetricCell label="Likes" reported={reportedMetrics?.likes} scraped={scraped.likes} />
          <MetricCell label="Comments" reported={reportedMetrics?.comments} scraped={scraped.comments} />
          <MetricCell label="Views" reported={reportedMetrics?.views} scraped={scraped.views} />
        </div>
      )}

      {checks.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {checks.map((check, idx) => {
            const CheckIcon = check.pass ? CheckCircle2 : XCircle;
            return (
              <li
                key={`${scrape.id}-${check.rule}-${idx}`}
                className="flex items-start gap-2 text-xs"
              >
                <CheckIcon
                  size={14}
                  strokeWidth={2}
                  className={`mt-0.5 shrink-0 ${check.pass ? 'text-success-600' : 'text-danger-600'}`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium">
                    {RULE_LABELS[check.rule] ?? check.rule}
                  </div>
                  <div className="text-text-muted">
                    Required: <span className="text-text-secondary font-mono tabular-nums">{formatRuleValue(check.required)}</span>
                    <span className="mx-1.5">·</span>
                    Actual: <span className="text-text-secondary font-mono tabular-nums">{formatRuleValue(check.actual)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Preview-mode building blocks
// ────────────────────────────────────────────────────────────────────────

function PreviewRuleRow({ check }: { check: VerificationCheck }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <Shield
        size={14}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-pink-600"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <div className="text-text-primary font-medium">
          {RULE_LABELS[check.rule] ?? check.rule}
        </div>
        <div className="text-text-muted">
          Required: <span className="text-text-secondary font-mono tabular-nums">{formatRuleValue(check.required)}</span>
          <span className="mx-1.5">·</span>
          <span className="text-pink-600/80">will be auto-verified</span>
        </div>
      </div>
    </li>
  );
}

function PreviewGroupCard({
  title,
  subtitle,
  checks,
}: {
  title: string;
  subtitle?: string;
  checks: VerificationCheck[];
}) {
  if (checks.length === 0) return null;
  return (
    <div className="glass-card !rounded-xl p-4 space-y-3">
      <div className="space-y-0.5">
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        {subtitle && (
          <div className="text-xs text-text-muted">{subtitle}</div>
        )}
      </div>
      <ul className="space-y-1.5">
        {checks.map((check, idx) => (
          <PreviewRuleRow key={`${title}-${check.rule}-${idx}`} check={check} />
        ))}
      </ul>
    </div>
  );
}

function parsePairKey(key: string): { channel: string; format: string } {
  const idx = key.indexOf('_');
  if (idx === -1) return { channel: key, format: '' };
  return { channel: key.slice(0, idx), format: key.slice(idx + 1) };
}

function PreviewBody({
  previewChecks,
  audience,
}: {
  previewChecks: Record<string, VerificationCheck[]>;
  audience: 'brand' | 'hunter' | 'brand-form';
}) {
  const eligibilityChecks = previewChecks[ELIGIBILITY_KEY] ?? [];
  const pairKeys = Object.keys(previewChecks)
    .filter((k) => k !== ELIGIBILITY_KEY)
    .sort();
  const totalRuleCount =
    eligibilityChecks.length + pairKeys.reduce((n, k) => n + previewChecks[k].length, 0);

  // Empty state — mirrors the cost-guard branch in SubmissionScraperService.
  // Form context gets a nudge toward action ("pick channels, add rules");
  // saved-bounty context tells the audience that submissions skip auto-verify.
  if (totalRuleCount === 0) {
    const isForm = audience === 'brand-form';
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Info
          size={30}
          strokeWidth={2}
          className="text-text-muted mb-3"
          aria-hidden="true"
        />
        <p className="text-text-primary font-medium">
          {isForm ? 'Nothing to auto-verify yet' : 'No auto-verification rules'}
        </p>
        <p className="text-text-muted text-sm mt-1">
          {isForm
            ? 'Select channels and add rules to preview what will be auto-verified.'
            : 'Submissions go straight to manual review.'}
        </p>
      </div>
    );
  }

  // Eligibility group title swaps:
  //   - hunter    : "About you"
  //   - brand     : "Hunter eligibility"
  //   - brand-form: "Hunter eligibility" (same as saved-brand view)
  const eligibilityTitle = audience === 'hunter' ? 'About you' : 'Hunter eligibility';
  const eligibilitySubtitle =
    audience === 'hunter'
      ? 'Checked once, against your linked social profile.'
      : "Checked against the hunter's linked social profile.";

  return (
    <div className="space-y-3">
      {eligibilityChecks.length > 0 && (
        <PreviewGroupCard
          title={eligibilityTitle}
          subtitle={eligibilitySubtitle}
          checks={eligibilityChecks}
        />
      )}
      {pairKeys.map((key) => {
        const { channel, format } = parsePairKey(key);
        const channelLabel = CHANNEL_LABELS[channel] ?? channel;
        const formatLabel = FORMAT_LABELS[format] ?? format;
        return (
          <PreviewGroupCard
            key={key}
            title={`${channelLabel} ${formatLabel}`}
            subtitle="Checked on the submitted post URL."
            checks={previewChecks[key]}
          />
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Top-level component — dispatches to submission-report or preview body
// ────────────────────────────────────────────────────────────────────────

export function VerificationReportPanel(props: VerificationReportPanelProps) {
  if (props.previewMode) {
    const audience = props.audience ?? 'brand';
    return (
      <div className="glass-card !rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {audience === 'hunter' ? "What you'll need to pass" : 'Auto-verification preview'}
          </h3>
        </div>
        {/* Both 'brand' and 'brand-form' show the same heading; only the
            empty-state copy and (above) the eligibility-section subtitle
            change between brand-saved and brand-form views. */}
        <PreviewBody previewChecks={props.previewChecks} audience={audience} />
      </div>
    );
  }

  const { urlScrapes, reportedMetrics } = props;
  if (!urlScrapes || urlScrapes.length === 0) {
    return null;
  }

  const inFlight = urlScrapes.some(
    (u) => u.scrapeStatus === 'PENDING' || u.scrapeStatus === 'IN_PROGRESS',
  );

  return (
    <div className="glass-card !rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Verification Report</h3>
        {!inFlight && (
          <span className="text-xs text-text-muted font-mono tabular-nums">
            {urlScrapes.filter((u) => u.scrapeStatus === 'VERIFIED').length} of {urlScrapes.length} verified
          </span>
        )}
      </div>

      {inFlight ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Loader2
            size={30}
            strokeWidth={2}
            className="animate-spin text-pink-600 mb-3"
            aria-hidden="true"
          />
          <p className="text-text-primary font-medium">Verifying social posts...</p>
          <p className="text-text-muted text-sm mt-1">
            Check back in ~30s — Apify is scraping each URL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {urlScrapes.map((scrape) => (
            <UrlScrapeCard key={scrape.id} scrape={scrape} reportedMetrics={reportedMetrics} />
          ))}
        </div>
      )}
    </div>
  );
}
