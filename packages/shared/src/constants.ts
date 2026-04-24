import { SocialChannel, PostFormat } from './enums';

// ─────────────────────────────────────
// Application constants
// ─────────────────────────────────────

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  SORT_ORDER: 'desc' as const,
  SORT_BY: 'createdAt',
};

export const OTP_RULES = {
  LENGTH: 6,
  TTL_SECONDS: 300,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 60,
};

export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_LOGO_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_FILES_PER_SUBMISSION: 5,
  MAX_PROOF_LINKS: 10,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const,
};

export const BRAND_ASSET_LIMITS = {
  MAX_FILES_PER_BOUNTY: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ] as const,
};

export const FIELD_LIMITS = {
  FIRST_NAME_MAX: 100,
  LAST_NAME_MAX: 100,
  BRAND_NAME_MAX: 200,
  BOUNTY_TITLE_MAX: 200,
  SHORT_DESCRIPTION_MAX: 500,
  FULL_INSTRUCTIONS_MAX: 10000,
  CATEGORY_MAX: 100,
  REWARD_DESCRIPTION_MAX: 500,
  ELIGIBILITY_RULES_MAX: 5000,
  PROOF_REQUIREMENTS_MAX: 5000,
  PROOF_TEXT_MAX: 10000,
  REVIEWER_NOTE_MAX: 5000,
  PAYOUT_NOTE_MAX: 2000,
  REASON_MAX: 5000,
  ADMIN_REASON_MAX: 2000,
};

export const RATE_LIMITS = {
  REQUEST_OTP: { limit: 5, ttl: 60 },
  VERIFY_OTP: { limit: 10, ttl: 60 },
  SIGNUP: { limit: 5, ttl: 60 },
  DEFAULT: { limit: 100, ttl: 60 },
};

export const JWT_CONFIG = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
};

export const AUDIT_ACTIONS = {
  USER_STATUS_CHANGE: 'user.status_change',
  BRAND_CREATE: 'brand.create',
  BRAND_UPDATE: 'brand.update',
  BRAND_STATUS_CHANGE: 'brand.status_change',
  BRAND_MEMBER_ADD: 'brand.member_add',
  BRAND_MEMBER_REMOVE: 'brand.member_remove',
  BOUNTY_CREATE: 'bounty.create',
  BOUNTY_UPDATE: 'bounty.update',
  BOUNTY_STATUS_CHANGE: 'bounty.status_change',
  BOUNTY_DELETE: 'bounty.delete',
  BOUNTY_OVERRIDE: 'bounty.override',
  BRAND_ASSET_UPLOAD: 'brand_asset.upload',
  BRAND_ASSET_DELETE: 'brand_asset.delete',
  SUBMISSION_CREATE: 'submission.create',
  SUBMISSION_UPDATE: 'submission.update',
  SUBMISSION_REVIEW: 'submission.review',
  SUBMISSION_PAYOUT_CHANGE: 'submission.payout_change',
  SUBMISSION_OVERRIDE: 'submission.override',
  SETTINGS_UPDATE: 'settings.update',
  DISPUTE_CREATE: 'dispute.create',
  DISPUTE_STATUS_CHANGE: 'dispute.status_change',
  DISPUTE_RESOLVE: 'dispute.resolve',
  DISPUTE_ESCALATE: 'dispute.escalate',
  DISPUTE_ASSIGN: 'dispute.assign',
  DISPUTE_MESSAGE: 'dispute.message',
  DISPUTE_EVIDENCE_UPLOAD: 'dispute.evidence_upload',
  DISPUTE_WITHDRAW: 'dispute.withdraw',
  DISPUTE_AUTO_ESCALATE: 'dispute.auto_escalate',
  DISPUTE_AUTO_CLOSE: 'dispute.auto_close',
  WALLET_CREDIT: 'wallet.credit',
  WALLET_ADJUST: 'wallet.adjust',
  WITHDRAWAL_REQUEST: 'withdrawal.request',
  WITHDRAWAL_PROCESS: 'withdrawal.process',
  WITHDRAWAL_COMPLETE: 'withdrawal.complete',
  WITHDRAWAL_FAIL: 'withdrawal.fail',
  WITHDRAWAL_CANCEL: 'withdrawal.cancel',
  SUBSCRIPTION_AUTO_DOWNGRADE: 'subscription.auto_downgrade',
  SUBMISSION_VISIBILITY_AUTO_REFUND: 'submission.visibility_auto_refund',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_UPGRADE_INITIATED: 'SUBSCRIPTION_UPGRADE_INITIATED',
  SUBSCRIPTION_UPGRADE_AUTHORISED: 'SUBSCRIPTION_UPGRADE_AUTHORISED',
  SUBSCRIPTION_UPGRADE_FAILED: 'SUBSCRIPTION_UPGRADE_FAILED',
  KB_INEFFECTIVE_FIX_FLAGGED: 'KB_INEFFECTIVE_FIX_FLAGGED',
  TRADESAFE_TOKEN_CREATED: 'tradesafe.token_created',
} as const;

export const ENTITY_TYPES = {
  USER: 'User',
  BRAND: 'Brand',
  BOUNTY: 'Bounty',
  SUBMISSION: 'Submission',
  SETTINGS: 'Settings',
  BRAND_ASSET: 'BrandAsset',
  DISPUTE: 'Dispute',
  WALLET: 'Wallet',
  WITHDRAWAL: 'Withdrawal',
  SUBSCRIPTION: 'Subscription',
} as const;

export const CHANNEL_POST_FORMATS: Record<SocialChannel, PostFormat[]> = {
  [SocialChannel.INSTAGRAM]: [PostFormat.STORY, PostFormat.REEL, PostFormat.FEED_POST],
  [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.STORY, PostFormat.REEL],
  [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
};

export const CHANNEL_URL_PATTERNS: Record<SocialChannel, RegExp> = {
  [SocialChannel.INSTAGRAM]: /^https?:\/\/(www\.)?instagram\.com\//,
  [SocialChannel.FACEBOOK]: /^https?:\/\/(www\.)?facebook\.com\//,
  [SocialChannel.TIKTOK]: /^https?:\/\/(www\.)?tiktok\.com\//,
};

export const BOUNTY_REWARD_LIMITS = {
  MAX_REWARD_LINES: 10,
  REWARD_NAME_MAX: 200,
  MAX_CUSTOM_ELIGIBILITY_RULES: 5,
  CUSTOM_RULE_MAX_LENGTH: 500,
} as const;

export const PAYOUT_METRICS_LIMITS = {
  MAX_VIEWS: 10_000_000,
  MAX_LIKES: 10_000_000,
  MAX_COMMENTS: 10_000_000,
} as const;

export const VERIFICATION_DEADLINE_HOURS = 48;

export const BOUNTY_CATEGORIES = [
  { id: 'social-media', name: 'Social Media', slug: 'social-media' },
  { id: 'content-creation', name: 'Content Creation', slug: 'content-creation' },
  { id: 'reviews', name: 'Reviews', slug: 'reviews' },
  { id: 'referrals', name: 'Referrals', slug: 'referrals' },
  { id: 'surveys', name: 'Surveys', slug: 'surveys' },
  { id: 'other', name: 'Other', slug: 'other' },
] as const;

export type CategoryInfo = (typeof BOUNTY_CATEGORIES)[number];

// ─── Dispute Limits ──────────────────

export const DISPUTE_LIMITS = {
  MAX_ACTIVE_PER_SUBMISSION: 3,
  MAX_PER_USER_PER_DAY: 5,
  TITLE_MAX: 200,
  DESCRIPTION_MAX: 10000,
  DESIRED_OUTCOME_MAX: 5000,
  MESSAGE_MAX: 5000,
  RESOLUTION_SUMMARY_MAX: 5000,
  EVIDENCE_DESCRIPTION_MAX: 500,
  MAX_EVIDENCE_FILES: 10,
  AUTO_ESCALATE_DAYS: 7,
  AUTO_CLOSE_DAYS: 90,
  RESPONSE_DEADLINE_DAYS: 7,
} as const;

export const DISPUTE_EVIDENCE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_DISPUTE: 10,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ] as const,
} as const;

// ─── Brand Profile ──────────────────

export const BRAND_PROFILE_LIMITS = {
  HANDLE_MIN: 3,
  HANDLE_MAX: 30,
  BIO_MAX: 500,
  LOGO_MAX_SIZE: 2 * 1024 * 1024, // 2MB
  LOGO_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  COVER_PHOTO_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  COVER_PHOTO_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
} as const;

// ─── Hunter Profile ──────────────────

export const PROFILE_LIMITS = {
  BIO_MAX: 500,
  PROFILE_PICTURE_MAX_SIZE: 2 * 1024 * 1024, // 2MB
  PROFILE_PICTURE_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  MAX_SOCIAL_LINKS: 5,
  HANDLE_MAX: 100,
} as const;

export const HUNTER_INTERESTS = [
  'Fitness & Wellness',
  'Food & Cooking',
  'Travel & Adventure',
  'Tech & Gaming',
  'Fashion & Beauty',
  'Lifestyle & Home',
  'Music & Entertainment',
  'Business & Finance',
  'Education & Learning',
  'Photography & Art',
  'Sports',
  'Parenting & Family',
  'Pets & Animals',
  'Cars & Automotive',
  'Comedy & Humor',
] as const;

export type HunterInterest = (typeof HUNTER_INTERESTS)[number];

// ─── Wallet & Withdrawal ─────────────

export const WALLET_LIMITS = {
  MIN_WITHDRAWAL: 50,
  MAX_WITHDRAWAL: 50000,
  DESCRIPTION_MAX: 500,
  ADJUSTMENT_REASON_MAX: 2000,
} as const;

export const WITHDRAWAL_LIMITS = {
  MAX_PENDING_PER_USER: 3,
  DESTINATION_MAX: 320,
} as const;

// ─── Bounty Access ───────────────────

export const BOUNTY_ACCESS_CONSTANTS = {
  APPLICATION_MESSAGE_MAX: 500,
  REVIEW_NOTE_MAX: 1000,
  MAX_INVITATIONS_PER_BOUNTY: 100,
} as const;

// ─── Social Handles ──────────────────

export const SOCIAL_HANDLE_CONSTANTS = {
  MAX_LENGTH: { X: 15, INSTAGRAM: 30, FACEBOOK: 50, TIKTOK: 24 },
  PROFILE_URL_TEMPLATES: {
    X: 'https://x.com/{handle}',
    INSTAGRAM: 'https://www.instagram.com/{handle}/',
    FACEBOOK: 'https://www.facebook.com/{handle}',
    TIKTOK: 'https://www.tiktok.com/@{handle}',
  },
  REVALIDATION_INTERVAL_DAYS: 30,
} as const;

// ─── Inbox ───────────────────────────

export const INBOX_CONSTANTS = {
  NOTIFICATION_RETENTION_DAYS: 90,
  MESSAGE_EDIT_WINDOW_MINUTES: 15,
  MESSAGE_RATE_LIMIT_PER_HOUR: 30,
  MAX_MESSAGE_LENGTH: 2000,
  UNREAD_POLL_INTERVAL_MS: 30000,
} as const;

// ─── Subscription Constants ─────────

export const SUBSCRIPTION_CONSTANTS = {
  HUNTER_PRO_PRICE_ZAR: 350,
  BRAND_PRO_PRICE_ZAR: 950,
  BILLING_CYCLE_DAYS: 30,
  GRACE_PERIOD_DAYS: 3,
  MAX_PAYMENT_RETRIES: 3,
  EXPIRY_REMINDER_DAYS_BEFORE: 3,
} as const;

export const COMMISSION_RATES = {
  HUNTER_FREE: 0.20,
  HUNTER_PRO: 0.10,
  BRAND_FREE: 0.15,
  BRAND_PRO: 0.05,
} as const;

export const CLEARANCE_PERIODS = {
  HUNTER_FREE_MIN_DAYS: 3,
  HUNTER_PRO_DAYS: 0,
} as const;

export const DISPUTE_REASON_CATEGORIES = {
  NON_PAYMENT: [
    'PAYMENT_NOT_RECEIVED',
    'PAYMENT_INCORRECT_AMOUNT',
    'PAYMENT_DELAYED_BEYOND_TERMS',
    'PAYOUT_MARKED_BUT_NOT_RECEIVED',
  ],
  POST_QUALITY: [
    'POST_EDITED_AFTER_APPROVAL',
    'POST_REMOVED',
    'POST_QUALITY_BELOW_STANDARD',
    'POST_WRONG_PLATFORM',
    'POST_MISSING_REQUIRED_ELEMENTS',
  ],
  POST_NON_COMPLIANCE: [
    'POST_DELETED_AFTER_PAYMENT',
    'POST_EDITED_AFTER_PAYMENT',
    'DISCLOSURE_REMOVED',
    'COMPETITOR_CONTENT_ADDED',
    'TERMS_VIOLATED_AFTER_PAYMENT',
  ],
} as const;
