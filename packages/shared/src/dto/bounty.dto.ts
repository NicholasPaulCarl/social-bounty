import {
  BountyStatus,
  RewardType,
  SubmissionStatus,
  PayoutStatus,
  PaymentStatus,
  PayoutMethod,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
  Currency,
} from '../enums';

// ─────────────────────────────────────
// Bounty DTOs
// ─────────────────────────────────────

// Organisation summary embedded in bounty responses
export interface BountyBrandInfo {
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

// Brand asset info embedded in bounty detail
export interface BrandAssetInfo {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

// ─────────────────────────────────────
// Status History
// ─────────────────────────────────────

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  changedBy: string;
  note?: string;
}

// ─────────────────────────────────────
// New structured input types
// ─────────────────────────────────────

export type ChannelSelection = Partial<Record<SocialChannel, PostFormat[]>>;

export interface RewardLineInput {
  rewardType: RewardType;
  name: string;
  monetaryValue: number;
}

export interface RewardLineResponse {
  id: string;
  rewardType: RewardType;
  name: string;
  monetaryValue: string;
  sortOrder: number;
}

export interface StructuredEligibilityInput {
  minFollowers?: number | null;
  publicProfile?: boolean;
  minAccountAgeDays?: number | null;
  locationRestriction?: string | null;
  noCompetingBrandDays?: number | null;
  customRules?: string[];
}

export interface PostVisibilityInput {
  rule: PostVisibilityRule;
  minDurationValue?: number | null;
  minDurationUnit?: DurationUnit | null;
}

export interface EngagementRequirementsInput {
  tagAccount?: string | null;
  mention?: boolean;
  comment?: boolean;
}

export interface PayoutMetricsInput {
  minViews?: number | null;
  minLikes?: number | null;
  minComments?: number | null;
}

// ─────────────────────────────────────
// Request / Response DTOs
// ─────────────────────────────────────

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
  brand: BountyBrandInfo;
  createdAt: string;
  // New fields
  channels: ChannelSelection | null;
  currency: Currency;
  totalRewardValue: string | null;
  rewards: RewardLineResponse[];
  payoutMetrics: PayoutMetricsInput | null;
  paymentStatus: PaymentStatus;
  payoutMethod?: PayoutMethod | null;
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
  brandId?: string;
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
  brand: BountyBrandInfo;
  createdBy: BountyCreatorInfo;
  userSubmission: BountyUserSubmissionInfo | null;
  createdAt: string;
  updatedAt: string;
  // New fields
  channels: ChannelSelection | null;
  currency: Currency;
  aiContentPermitted: boolean;
  engagementRequirements: EngagementRequirementsInput | null;
  postVisibility: PostVisibilityInput | null;
  structuredEligibility: StructuredEligibilityInput | null;
  visibilityAcknowledged: boolean;
  rewards: RewardLineResponse[];
  totalRewardValue: string | null;
  payoutMetrics: PayoutMetricsInput | null;
  paymentStatus: PaymentStatus;
  payoutMethod?: PayoutMethod | null;
  brandAssets: BrandAssetInfo[];
}

// POST /bounties
export interface CreateBountyRequest {
  title: string;
  shortDescription?: string;
  fullInstructions?: string;
  category?: string;
  proofRequirements?: string;
  maxSubmissions?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  // New structured fields (optional for draft saves)
  channels?: ChannelSelection;
  rewards?: RewardLineInput[];
  postVisibility?: PostVisibilityInput;
  structuredEligibility?: StructuredEligibilityInput;
  currency?: Currency;
  aiContentPermitted?: boolean;
  engagementRequirements?: EngagementRequirementsInput;
  // Payout metrics (optional)
  payoutMetrics?: PayoutMetricsInput;
  // Payout method (optional)
  payoutMethod?: PayoutMethod;
  // Legacy fields (optional, for backward compat)
  rewardType?: RewardType;
  rewardValue?: number | null;
  rewardDescription?: string | null;
  eligibilityRules?: string;
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
  brandId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // New fields
  channels: ChannelSelection | null;
  currency: Currency;
  aiContentPermitted: boolean;
  engagementRequirements: EngagementRequirementsInput | null;
  postVisibility: PostVisibilityInput | null;
  structuredEligibility: StructuredEligibilityInput | null;
  visibilityAcknowledged: boolean;
  rewards: RewardLineResponse[];
  totalRewardValue: string | null;
  payoutMetrics: PayoutMetricsInput | null;
  paymentStatus: PaymentStatus;
  payoutMethod?: PayoutMethod | null;
}

// PATCH /bounties/:id
export interface UpdateBountyRequest {
  title?: string;
  shortDescription?: string;
  fullInstructions?: string;
  category?: string;
  maxSubmissions?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  proofRequirements?: string;
  // New structured fields (optional for partial updates)
  channels?: ChannelSelection;
  rewards?: RewardLineInput[];
  postVisibility?: PostVisibilityInput;
  structuredEligibility?: StructuredEligibilityInput;
  currency?: Currency;
  aiContentPermitted?: boolean;
  engagementRequirements?: EngagementRequirementsInput;
  // Payout metrics (optional)
  payoutMetrics?: PayoutMetricsInput;
  // Payout method (optional)
  payoutMethod?: PayoutMethod;
  // Legacy fields (optional, for backward compat)
  rewardType?: RewardType;
  rewardValue?: number | null;
  rewardDescription?: string | null;
  eligibilityRules?: string;
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
