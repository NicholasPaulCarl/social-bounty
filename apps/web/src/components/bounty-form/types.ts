import type {
  ChannelSelection,
  RewardLineInput,
  PostVisibilityInput,
  StructuredEligibilityInput,
  EngagementRequirementsInput,
  PayoutMetricsInput,
  BountyDetailResponse,
} from '@social-bounty/shared';
import { Currency, RewardType, PostVisibilityRule, DurationUnit } from '@social-bounty/shared';

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

export interface BountyFormState {
  // Section 1: Basic Info
  title: string;
  shortDescription: string;
  fullInstructions: string;
  category: string;

  // Section 2: Channels
  channels: ChannelSelection;

  // Section 3: Content Rules
  aiContentPermitted: boolean;
  engagementRequirements: EngagementRequirementsInput;

  // Section 4: Post Visibility
  postVisibility: PostVisibilityInput | null;
  visibilityAcknowledged: boolean;

  // Section 5: Rewards
  currency: Currency;
  rewards: RewardLineInput[];

  // Section 6: Eligibility
  structuredEligibility: StructuredEligibilityInput;

  // Section 7: Proof Requirements
  proofRequirements: string;

  // Section 8: Submission Limits
  maxSubmissions: number | null;

  // Section 9: Schedule
  startDate: Date | null;
  endDate: Date | null;

  // Section 10: Payout Metrics
  payoutMetrics: PayoutMetricsInput;

  // UI state
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitAttempted: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type BountyFormAction =
  // Section 1
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SHORT_DESCRIPTION'; payload: string }
  | { type: 'SET_FULL_INSTRUCTIONS'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  // Section 2
  | { type: 'TOGGLE_CHANNEL'; payload: { channel: string; formats: string[] } }
  | { type: 'TOGGLE_FORMAT'; payload: { channel: string; format: string } }
  // Section 3
  | { type: 'SET_AI_CONTENT_PERMITTED'; payload: boolean }
  | { type: 'SET_TAG_ACCOUNT'; payload: string }
  | { type: 'SET_MENTION'; payload: boolean }
  | { type: 'SET_COMMENT'; payload: boolean }
  // Section 4
  | { type: 'SET_VISIBILITY_RULE'; payload: PostVisibilityRule | null }
  | { type: 'SET_DURATION_VALUE'; payload: number | null }
  | { type: 'SET_DURATION_UNIT'; payload: DurationUnit | null }
  | { type: 'SET_VISIBILITY_ACKNOWLEDGED'; payload: boolean }
  // Section 5
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_REWARD' }
  | { type: 'REMOVE_REWARD'; payload: number }
  | { type: 'UPDATE_REWARD'; payload: { index: number; field: keyof RewardLineInput; value: RewardType | string | number } }
  // Section 6
  | { type: 'SET_MIN_FOLLOWERS'; payload: number | null }
  | { type: 'SET_PUBLIC_PROFILE'; payload: boolean }
  | { type: 'SET_MIN_ACCOUNT_AGE'; payload: number | null }
  | { type: 'SET_LOCATION_RESTRICTION'; payload: string | null }
  | { type: 'SET_NO_COMPETING_BRAND_DAYS'; payload: number | null }
  | { type: 'ADD_CUSTOM_RULE' }
  | { type: 'REMOVE_CUSTOM_RULE'; payload: number }
  | { type: 'UPDATE_CUSTOM_RULE'; payload: { index: number; value: string } }
  // Section 7
  | { type: 'SET_PROOF_REQUIREMENTS'; payload: string }
  // Section 8
  | { type: 'SET_MAX_SUBMISSIONS'; payload: number | null }
  // Section 9
  | { type: 'SET_START_DATE'; payload: Date | null }
  | { type: 'SET_END_DATE'; payload: Date | null }
  // Section 10
  | { type: 'SET_MIN_VIEWS'; payload: number | null }
  | { type: 'SET_MIN_LIKES'; payload: number | null }
  | { type: 'SET_MIN_COMMENTS'; payload: number | null }
  // Validation
  | { type: 'SET_TOUCHED'; payload: string }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_SUBMIT_ATTEMPTED' }
  // Bulk
  | { type: 'LOAD_BOUNTY'; payload: BountyDetailResponse };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const INITIAL_FORM_STATE: BountyFormState = {
  title: '',
  shortDescription: '',
  fullInstructions: '',
  category: '',
  channels: {},
  aiContentPermitted: false,
  engagementRequirements: {
    tagAccount: null,
    mention: false,
    comment: false,
  },
  postVisibility: null,
  visibilityAcknowledged: false,
  currency: Currency.ZAR,
  rewards: [{ rewardType: RewardType.CASH, name: '', monetaryValue: 0 }],
  structuredEligibility: {
    minFollowers: null,
    publicProfile: false,
    minAccountAgeDays: null,
    locationRestriction: null,
    noCompetingBrandDays: null,
    customRules: [],
  },
  proofRequirements: '',
  maxSubmissions: null,
  startDate: null,
  endDate: null,
  payoutMetrics: {
    minViews: null,
    minLikes: null,
    minComments: null,
  },
  errors: {},
  touched: {},
  submitAttempted: false,
};

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

export const SECTIONS = [
  { number: 1, title: 'Basic Information', icon: 'pi-file-edit', key: 'basicInfo' },
  { number: 2, title: 'Channels', icon: 'pi-share-alt', key: 'channels' },
  { number: 3, title: 'Content Rules', icon: 'pi-sliders-h', key: 'contentRules' },
  { number: 4, title: 'Post Visibility', icon: 'pi-eye', key: 'postVisibility' },
  { number: 5, title: 'Rewards', icon: 'pi-money-bill', key: 'rewards' },
  { number: 6, title: 'Eligibility', icon: 'pi-users', key: 'eligibility' },
  { number: 7, title: 'Proof Requirements', icon: 'pi-camera', key: 'proofRequirements' },
  { number: 8, title: 'Submission Limits', icon: 'pi-hashtag', key: 'submissionLimits' },
  { number: 9, title: 'Schedule', icon: 'pi-calendar', key: 'schedule' },
  { number: 10, title: 'Payout Metrics', icon: 'pi-chart-bar', key: 'payoutMetrics' },
] as const;
