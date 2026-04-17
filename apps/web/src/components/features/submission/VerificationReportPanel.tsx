'use client';

import type {
  SubmissionUrlScrapeInfo,
  VerificationCheck,
  ScrapedPostData,
  ReportedMetricsInput,
} from '@social-bounty/shared';

interface VerificationReportPanelProps {
  urlScrapes: SubmissionUrlScrapeInfo[];
  reportedMetrics?: ReportedMetricsInput | null;
}

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
        <span className={hasReported ? 'text-text-primary font-medium' : 'text-text-muted'}>
          {hasReported ? reported.toLocaleString() : '—'}
        </span>
      </div>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-text-secondary text-xs">Scraped:</span>
        <span className={hasScraped ? 'text-text-primary font-medium' : 'text-text-muted'}>
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
    ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30'
    : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30';

  const badgeIcon = isVerified ? 'pi pi-check-circle' : 'pi pi-times-circle';

  return (
    <div className="glass-card p-4 space-y-3">
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
            className="text-accent-cyan hover:underline text-xs break-all"
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
          <i className={badgeIcon} />
          {scrape.scrapeStatus}
        </span>
      </div>

      {isFailed && scrape.errorMessage && (
        <div className="bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-xs px-3 py-2 rounded-lg">
          <i className="pi pi-exclamation-circle mr-1.5" />
          {scrape.errorMessage}
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
          {checks.map((check, idx) => (
            <li
              key={`${scrape.id}-${check.rule}-${idx}`}
              className="flex items-start gap-2 text-xs"
            >
              <i
                className={`mt-0.5 ${check.pass ? 'pi pi-check-circle text-accent-emerald' : 'pi pi-times-circle text-accent-rose'}`}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-medium">
                  {RULE_LABELS[check.rule] ?? check.rule}
                </div>
                <div className="text-text-muted">
                  Required: <span className="text-text-secondary">{formatRuleValue(check.required)}</span>
                  <span className="mx-1.5">·</span>
                  Actual: <span className="text-text-secondary">{formatRuleValue(check.actual)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VerificationReportPanel({
  urlScrapes,
  reportedMetrics,
}: VerificationReportPanelProps) {
  if (!urlScrapes || urlScrapes.length === 0) {
    return null;
  }

  const inFlight = urlScrapes.some(
    (u) => u.scrapeStatus === 'PENDING' || u.scrapeStatus === 'IN_PROGRESS',
  );

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Verification Report</h3>
        {!inFlight && (
          <span className="text-xs text-text-muted">
            {urlScrapes.filter((u) => u.scrapeStatus === 'VERIFIED').length} of {urlScrapes.length} verified
          </span>
        )}
      </div>

      {inFlight ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <i className="pi pi-spinner pi-spin text-3xl text-accent-cyan mb-3" aria-hidden="true" />
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
