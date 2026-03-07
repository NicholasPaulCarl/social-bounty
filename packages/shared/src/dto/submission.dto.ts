import { SubmissionStatus, PayoutStatus, RewardType } from '../enums';
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
}

// Bounty summary with org info for "my submissions"
export interface SubmissionBountyWithOrgInfo extends SubmissionBountyInfo {
  organisation: {
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

// POST /bounties/:bountyId/submissions
export interface CreateSubmissionRequest {
  proofText: string;
  proofLinks?: string[];
  reportedMetrics?: ReportedMetricsInput;
}

export interface CreateSubmissionResponse {
  id: string;
  bountyId: string;
  userId: string;
  proofText: string;
  proofLinks: string[] | null;
  proofImages: FileUploadInfo[];
  status: SubmissionStatus;
  payoutStatus: PayoutStatus;
  reportedMetrics: ReportedMetricsInput | null;
  verificationDeadline: string | null;
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
  createdAt: string;
  updatedAt: string;
}

// PATCH /submissions/:id (resubmit)
export interface UpdateSubmissionRequest {
  proofText?: string;
  proofLinks?: string[];
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
}

export interface UpdatePayoutResponse {
  id: string;
  payoutStatus: PayoutStatus;
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
  totalEarned: number;
  pendingPayout: number;
}
