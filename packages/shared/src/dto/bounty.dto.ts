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
  ContentFormat,
  BountyAccessType,
} from '../enums';

// ─────────────────────────────────────
// Bounty DTOs
// ─────────────────────────────────────

// Brand summary embedded in bounty responses
export interface BountyBrandInfo {
  id: string;
  name: string;
  logo: string | null;
  /**
   * KYB-verified brand. Currently derived from `kybStatus === APPROVED` —
   * the brand finished the KYB flow and has been admin-approved. Drives the
   * pink BadgeCheck ✓ next to the brand name on bounty cards.
   */
  verified: boolean;
  /**
   * Optional 0–359 hue for the brand avatar tint. Backend currently leaves
   * this undefined; the UI derives a stable per-brand hue via
   * `hashHue(brand.id)`. Reserved for a future admin-assignable colour.
   */
  hue?: number;
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
  accessType: BountyAccessType;
  /**
   * True iff the requesting viewer has an existing application row for this
   * bounty (any status). Drives the "Applied" ribbon on bounty cards.
   * Always `false` for non-participant viewers (they can't apply).
   */
  userHasApplied: boolean;
  /**
   * True iff the requesting viewer has an existing submission row for this
   * bounty (any status). Drives the "Submitted" ribbon on bounty cards.
   * Always `false` for non-participant viewers (they can't submit).
   */
  userHasSubmitted: boolean;
}

/**
 * Pagination + soft analytics counters returned alongside `BountyListItem[]`
 * from `GET /bounties`. The forward-compat counters (`newToday`,
 * `weekEarnings`) are only populated for participant viewers — BA/SA get
 * undefined, and the UI silently drops the affected hero-strip clauses.
 */
export interface BountyListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /**
   * Count of LIVE bounties created today (server tz). Drives the
   * "X new today" clause in the Browse hero meta strip.
   */
  newToday: number;
  /**
   * Sum of the viewer's `hunter_available` credits over the past 7 days,
   * in minor units (cents). Participant-only; undefined otherwise.
   * Drives the "earnings up R X this week" clause in the Browse hero.
   */
  weekEarnings?: number;
}

export interface BountyListResponse {
  data: BountyListItem[];
  meta: BountyListMeta;
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
  contentFormat: ContentFormat;
  fullInstructions: string;
  instructionSteps: string[];
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
  accessType: BountyAccessType;
  /** See `BountyListItem.userHasApplied`. */
  userHasApplied: boolean;
  /** See `BountyListItem.userHasSubmitted`. */
  userHasSubmitted: boolean;
}

// POST /bounties
export interface CreateBountyRequest {
  title: string;
  shortDescription?: string;
  contentFormat?: ContentFormat;
  fullInstructions?: string;
  instructionSteps?: string[];
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
  contentFormat: ContentFormat;
  fullInstructions: string;
  instructionSteps: string[];
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
  contentFormat?: ContentFormat;
  fullInstructions?: string;
  instructionSteps?: string[];
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
