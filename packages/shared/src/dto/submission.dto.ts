import { SubmissionStatus, PayoutStatus, RewardType } from '../enums';

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
