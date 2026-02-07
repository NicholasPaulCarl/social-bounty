import { BountyStatus, RewardType, SubmissionStatus, PayoutStatus } from '../enums';

// ─────────────────────────────────────
// Bounty DTOs
// ─────────────────────────────────────

// Organisation summary embedded in bounty responses
export interface BountyOrganisationInfo {
  id: string;
  name: string;
  logo: string | null;
}

// Creator summary embedded in bounty detail response
export interface BountyCreatorInfo {
  id: string;
  firstName: string;
  lastName: string;
}

// User's existing submission summary embedded in bounty detail
export interface BountyUserSubmissionInfo {
  id: string;
  status: SubmissionStatus;
  payoutStatus: PayoutStatus;
}

// GET /bounties (list item)
export interface BountyListItem {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  rewardType: RewardType;
  rewardValue: string | null;
  rewardDescription: string | null;
  maxSubmissions: number | null;
  startDate: string | null;
  endDate: string | null;
  status: BountyStatus;
  submissionCount: number;
  organisation: BountyOrganisationInfo;
  createdAt: string;
}

// GET /bounties (query params)
export interface BountyListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: BountyStatus;
  category?: string;
  rewardType?: RewardType;
  search?: string;
  organisationId?: string;
}

// GET /bounties/:id
export interface BountyDetailResponse {
  id: string;
  title: string;
  shortDescription: string;
  fullInstructions: string;
  category: string;
  rewardType: RewardType;
  rewardValue: string | null;
  rewardDescription: string | null;
  maxSubmissions: number | null;
  remainingSubmissions: number | null;
  startDate: string | null;
  endDate: string | null;
  eligibilityRules: string;
  proofRequirements: string;
  status: BountyStatus;
  submissionCount: number;
  organisation: BountyOrganisationInfo;
  createdBy: BountyCreatorInfo;
  userSubmission: BountyUserSubmissionInfo | null;
  createdAt: string;
  updatedAt: string;
}

// POST /bounties
export interface CreateBountyRequest {
  title: string;
  shortDescription: string;
  fullInstructions: string;
  category: string;
  rewardType: RewardType;
  rewardValue?: number | null;
  rewardDescription?: string | null;
  maxSubmissions?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  eligibilityRules: string;
  proofRequirements: string;
}

export interface CreateBountyResponse {
  id: string;
  title: string;
  shortDescription: string;
  fullInstructions: string;
  category: string;
  rewardType: RewardType;
  rewardValue: string | null;
  rewardDescription: string | null;
  maxSubmissions: number | null;
  startDate: string | null;
  endDate: string | null;
  eligibilityRules: string;
  proofRequirements: string;
  status: BountyStatus;
  organisationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// PATCH /bounties/:id
export interface UpdateBountyRequest {
  title?: string;
  shortDescription?: string;
  fullInstructions?: string;
  category?: string;
  rewardType?: RewardType;
  rewardValue?: number | null;
  rewardDescription?: string | null;
  maxSubmissions?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  eligibilityRules?: string;
  proofRequirements?: string;
}

// PATCH /bounties/:id/status
export interface UpdateBountyStatusRequest {
  status: BountyStatus;
}

export interface UpdateBountyStatusResponse {
  id: string;
  status: BountyStatus;
  updatedAt: string;
}
