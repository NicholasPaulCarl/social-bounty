import { SubmissionStatus, PayoutStatus, RewardType, Currency, SocialChannel, PostFormat } from '../enums';
import type { PaginationMeta } from '../common';

// ─────────────────────────────────────
// Reported Metrics
// ─────────────────────────────────────

export interface ReportedMetricsInput {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
}

// ─────────────────────────────────────
// Payout DTOs
// ─────────────────────────────────────

export interface PayoutResponse {
  id: string;
  submissionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  proofOfPaymentUrl: string | null;
  proofOfPaymentName: string | null;
  createdAt: string;
}

// ─────────────────────────────────────
// Review History
// ─────────────────────────────────────

export interface ReviewHistoryEntry {
  status: string;
  changedAt: string;
  changedBy: string | null;
  note: string | null;
}

// ─────────────────────────────────────
// Submission DTOs
// ─────────────────────────────────────

// File upload info embedded in submission responses
export interface FileUploadInfo {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

// Bounty summary embedded in submission responses
export interface SubmissionBountyInfo {
  id: string;
  title: string;
  rewardType: RewardType;
  rewardValue: string | null;
  currency: Currency;
}

// Bounty summary with org info for "my submissions"
export interface SubmissionBountyWithOrgInfo extends SubmissionBountyInfo {
  brand: {
    id: string;
    name: string;
  };
}

// User summary embedded in submission responses (for reviewers)
export interface SubmissionUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Reviewer summary
export interface SubmissionReviewerInfo {
  id: string;
  firstName: string;
  lastName: string;
}

// ─────────────────────────────────────
// Per-URL Scrape + Verification (Phase 1 submission verification)
// ─────────────────────────────────────

export type UrlScrapeStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';

// One URL per (channel, format) pair from bounty.channels.
// Submitted by the hunter, validated by submission-coverage.validator.ts.
export interface ProofLinkInput {
  channel: SocialChannel;
  format: PostFormat;
  url: string;
}

// Shape of data extracted from the Apify post scraper. Platform-specific
// mappers produce this shape from actor output; null fields indicate the
// scraper did not return or could not extract that metric.
export interface ScrapedPostData {
  likes: number | null;
  comments: number | null;
  views: number | null;
  caption: string | null;
  taggedUsernames: string[];
  ownerUsername: string | null;
  postedAt: string | null;
  isVideo: boolean | null;
  // Format detected from scraped metadata (e.g. Instagram item.type=Video → REEL).
  // null when scraper can't determine — formatMatch check skips silently.
  detectedFormat: PostFormat | null;
}

// One pass/fail entry in the verification report. `required` is the bounty
// rule value; `actual` is what the scrape/cached data showed.
export interface VerificationCheck {
  rule:
    | 'tagAccount'
    | 'mention'
    | 'minViews'
    | 'minLikes'
    | 'minComments'
    | 'contentFormat'
    | 'formatMatch'
    | 'minFollowers'
    | 'publicProfile'
    | 'minAccountAgeDays';
  required: unknown;
  actual: unknown;
  pass: boolean;
}

export interface SubmissionUrlScrapeInfo {
  id: string;
  url: string;
  channel: SocialChannel;
  format: PostFormat;
  scrapeStatus: UrlScrapeStatus;
  scrapeResult: ScrapedPostData | null;
  verificationChecks: VerificationCheck[] | null;
  errorMessage: string | null;
  scrapedAt: string | null;
}

// POST /bounties/:bountyId/submissions
export interface CreateSubmissionRequest {
  proofText: string;
  // Replaces the legacy `proofLinks?: string[]`. Required going forward —
  // the coverage validator in submissions.service rejects the request if
  // any (channel, format) pair from bounty.channels is missing a URL.
  proofLinks: ProofLinkInput[];
  reportedMetrics?: ReportedMetricsInput;
}

export interface CreateSubmissionResponse {
  id: string;
  bountyId: string;
  userId: string;
  proofText: string;
  // Legacy flat string[] maintained for back-compat — the source of
  // truth is `urlScrapes` below. Derived from urlScrapes[].url.
  proofLinks: string[] | null;
  proofImages: FileUploadInfo[];
  status: SubmissionStatus;
  payoutStatus: PayoutStatus;
  reportedMetrics: ReportedMetricsInput | null;
  verificationDeadline: string | null;
  urlScrapes: SubmissionUrlScrapeInfo[];
  createdAt: string;
}

// GET /submissions/me (list item)
export interface MySubmissionListItem {
  id: string;
  bountyId: string;
  bounty: SubmissionBountyWithOrgInfo;
  proofText: string;
  proofLinks: string[] | null;
  proofImages: FileUploadInfo[];
  status: SubmissionStatus;
  reviewerNote: string | null;
  payoutStatus: PayoutStatus;
  reportedMetrics: ReportedMetricsInput | null;
  verificationDeadline: string | null;
  urlScrapes: SubmissionUrlScrapeInfo[];
  createdAt: string;
  updatedAt: string;
}

// GET /submissions/me (query params)
export interface MySubmissionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: SubmissionStatus;
  payoutStatus?: PayoutStatus;
  bountyId?: string;
}

// GET /bounties/:bountyId/submissions (list item - for reviewers)
export interface SubmissionReviewListItem {
  id: string;
  userId: string;
  user: SubmissionUserInfo;
  proofText: string;
  proofLinks: string[] | null;
  proofImages: FileUploadInfo[];
  status: SubmissionStatus;
  reviewerNote: string | null;
  reviewedBy: SubmissionReviewerInfo | null;
  payoutStatus: PayoutStatus;
  reportedMetrics: ReportedMetricsInput | null;
  verificationDeadline: string | null;
  urlScrapes: SubmissionUrlScrapeInfo[];
  createdAt: string;
  updatedAt: string;
}

// GET /bounties/:bountyId/submissions (query params)
export interface SubmissionReviewListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: SubmissionStatus;
  payoutStatus?: PayoutStatus;
}

// GET /submissions/:id
export interface SubmissionDetailResponse {
  id: string;
  bountyId: string;
  bounty: SubmissionBountyInfo;
  userId: string;
  user: SubmissionUserInfo;
  proofText: string;
  proofLinks: string[] | null;
  proofImages: FileUploadInfo[];
  status: SubmissionStatus;
  reviewerNote: string | null;
  reviewedBy: SubmissionReviewerInfo | null;
  payoutStatus: PayoutStatus;
  reportedMetrics: ReportedMetricsInput | null;
  verificationDeadline: string | null;
  urlScrapes: SubmissionUrlScrapeInfo[];
  createdAt: string;
  updatedAt: string;
}

// PATCH /submissions/:id (resubmit)
// `proofLinks` carries the FULL replacement set (including any VERIFIED
// URLs to keep). The scraper service only re-scrapes rows whose status
// is PENDING or FAILED — VERIFIED rows are cached.
export interface UpdateSubmissionRequest {
  proofText?: string;
  proofLinks?: ProofLinkInput[];
  removeImageIds?: string[];
}

// PATCH /submissions/:id/review
export interface ReviewSubmissionRequest {
  status: SubmissionStatus;
  reviewerNote?: string;
}

export interface ReviewSubmissionResponse {
  id: string;
  status: SubmissionStatus;
  reviewerNote: string | null;
  reviewedBy: SubmissionReviewerInfo;
  payoutStatus: PayoutStatus;
  updatedAt: string;
}

// PATCH /submissions/:id/payout
export interface UpdatePayoutRequest {
  payoutStatus: PayoutStatus;
  note?: string;
  proofOfPaymentUrl?: string;
  proofOfPaymentName?: string;
}

export interface UpdatePayoutResponse {
  id: string;
  payoutStatus: PayoutStatus;
  proofOfPaymentUrl: string | null;
  proofOfPaymentName: string | null;
  updatedAt: string;
}

// ─────────────────────────────────────
// Review Queue DTOs
// ─────────────────────────────────────

export interface ReviewQueueStats {
  pending: number;
  inReview: number;
  needsMoreInfo: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface ReviewQueueResponse {
  stats: ReviewQueueStats;
  data: SubmissionReviewListItem[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────
// Earnings Summary DTOs
// ─────────────────────────────────────

export interface EarningsSummaryResponse {
  totalSubmissions: number;
  approvedCount: number;
  rejectedCount: number;
  totalEarned: number;
  pendingPayout: number;
}
