import type {
  ChannelSelection,
  RewardLineInput,
  PostVisibilityInput,
  StructuredEligibilityInput,
  EngagementRequirementsInput,
  PayoutMetricsInput,
  BountyDetailResponse,
} from '@social-bounty/shared';
import { Currency, RewardType, PostVisibilityRule, DurationUnit, BountyAccessType, SocialPlatform, ContentFormat } from '@social-bounty/shared';

// Local enum until shared package exports PayoutMethod
export enum PayoutMethod {
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  E_WALLET = 'E_WALLET',
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

export interface BountyFormState {
  // Section 1: Bounty Basic Information
  title: string;
  shortDescription: string;
  contentFormat: ContentFormat;
  fullInstructions: string;
  instructionSteps: string[];
  channels: ChannelSelection;

  // Section 2: Bounty Content
  aiContentPermitted: boolean;
  engagementRequirements: EngagementRequirementsInput;
  postVisibility: PostVisibilityInput | null;
  visibilityAcknowledged: boolean;
  currency: Currency;
  rewards: RewardLineInput[];
  payoutMethod: PayoutMethod | null;

  // Section 3: Bounty Rules
  structuredEligibility: StructuredEligibilityInput;
  proofRequirements: string[];
  maxSubmissions: number | null;
  startDate: Date | null;
  endDate: Date | null;
  payoutMetrics: PayoutMetricsInput;

  // Section 4: Brand Assets
  stagedBrandAssetFiles: File[];

  // Section 5: Access Type
  accessType: BountyAccessType;
  invitations: Array<{ platform: SocialPlatform; handle: string }>;
  selectedHunters: Array<{ id: string; firstName: string; lastName: string; profilePictureUrl: string | null }>;

  // UI state
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitAttempted: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type BountyFormAction =
  // Section 1: Bounty Basic Information
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SHORT_DESCRIPTION'; payload: string }
  | { type: 'SET_CONTENT_FORMAT'; payload: ContentFormat }
  | { type: 'SET_FULL_INSTRUCTIONS'; payload: string }
  | { type: 'ADD_INSTRUCTION_STEP' }
  | { type: 'REMOVE_INSTRUCTION_STEP'; payload: number }
  | { type: 'UPDATE_INSTRUCTION_STEP'; payload: { index: number; value: string } }
  | { type: 'TOGGLE_CHANNEL'; payload: { channel: string; formats: string[] } }
  | { type: 'TOGGLE_FORMAT'; payload: { channel: string; format: string } }
  // Section 2: Bounty Content
  | { type: 'SET_AI_CONTENT_PERMITTED'; payload: boolean }
  | { type: 'SET_TAG_ACCOUNT'; payload: string }
  | { type: 'SET_MENTION'; payload: boolean }
  | { type: 'SET_COMMENT'; payload: boolean }
  | { type: 'SET_VISIBILITY_RULE'; payload: PostVisibilityRule | null }
  | { type: 'SET_DURATION_VALUE'; payload: number | null }
  | { type: 'SET_DURATION_UNIT'; payload: DurationUnit | null }
  | { type: 'SET_VISIBILITY_ACKNOWLEDGED'; payload: boolean }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_PAYOUT_METHOD'; payload: PayoutMethod | null }
  | { type: 'ADD_REWARD' }
  | { type: 'REMOVE_REWARD'; payload: number }
  | { type: 'UPDATE_REWARD'; payload: { index: number; field: keyof RewardLineInput; value: RewardType | string | number } }
  // Section 3: Bounty Rules
  | { type: 'SET_MIN_FOLLOWERS'; payload: number | null }
  | { type: 'SET_PUBLIC_PROFILE'; payload: boolean }
  | { type: 'SET_MIN_ACCOUNT_AGE'; payload: number | null }
  | { type: 'SET_LOCATION_RESTRICTION'; payload: string | null }
  | { type: 'SET_NO_COMPETING_BRAND_DAYS'; payload: number | null }
  | { type: 'ADD_CUSTOM_RULE' }
  | { type: 'REMOVE_CUSTOM_RULE'; payload: number }
  | { type: 'UPDATE_CUSTOM_RULE'; payload: { index: number; value: string } }
  | { type: 'TOGGLE_PROOF_REQUIREMENT'; payload: string }
  | { type: 'SET_MAX_SUBMISSIONS'; payload: number | null }
  | { type: 'SET_START_DATE'; payload: Date | null }
  | { type: 'SET_END_DATE'; payload: Date | null }
  | { type: 'SET_MIN_VIEWS'; payload: number | null }
  | { type: 'SET_MIN_LIKES'; payload: number | null }
  | { type: 'SET_MIN_COMMENTS'; payload: number | null }
  // Section 4: Brand Assets
  | { type: 'STAGE_BRAND_ASSET_FILES'; payload: File[] }
  | { type: 'REMOVE_STAGED_BRAND_ASSET'; payload: number }
  // Section 5: Access Type
  | { type: 'SET_ACCESS_TYPE'; payload: BountyAccessType }
  | { type: 'ADD_INVITATION'; payload: { platform: SocialPlatform; handle: string } }
  | { type: 'REMOVE_INVITATION'; payload: number }
  | { type: 'ADD_SELECTED_HUNTER'; payload: { id: string; firstName: string; lastName: string; profilePictureUrl: string | null } }
  | { type: 'REMOVE_SELECTED_HUNTER'; payload: string }
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
  contentFormat: ContentFormat.BOTH,
  fullInstructions: '',
  instructionSteps: [''],
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
  // CASH rewards use 'Cash' as the auto-filled name (the value + currency
  // is self-describing); the UI hides the name input entirely for CASH.
  rewards: [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 0 }],
  payoutMethod: null,
  structuredEligibility: {
    minFollowers: null,
    publicProfile: false,
    minAccountAgeDays: null,
    locationRestriction: null,
    noCompetingBrandDays: null,
    customRules: [],
  },
  proofRequirements: [],
  maxSubmissions: null,
  startDate: null,
  endDate: null,
  payoutMetrics: {
    minViews: null,
    minLikes: null,
    minComments: null,
  },
  stagedBrandAssetFiles: [],
  accessType: BountyAccessType.PUBLIC,
  invitations: [],
  selectedHunters: [],
  errors: {},
  touched: {},
  submitAttempted: false,
};

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

export const SECTIONS = [
  { number: 1, title: 'Bounty Information', icon: 'pi-file-edit', key: 'bountyBasicInfo' },
  { number: 2, title: 'Bounty Content', icon: 'pi-sliders-h', key: 'bountyContent' },
  { number: 3, title: 'Bounty Rules', icon: 'pi-shield', key: 'bountyRules' },
  { number: 4, title: 'Brand Assets', icon: 'pi-images', key: 'brandAssets' },
] as const;
