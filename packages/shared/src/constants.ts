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

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
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

export const FIELD_LIMITS = {
  FIRST_NAME_MAX: 100,
  LAST_NAME_MAX: 100,
  ORG_NAME_MAX: 200,
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
  SIGNUP: { limit: 5, ttl: 60 },
  LOGIN: { limit: 10, ttl: 60 },
  FORGOT_PASSWORD: { limit: 3, ttl: 60 },
  RESET_PASSWORD: { limit: 5, ttl: 60 },
  RESEND_VERIFICATION: { limit: 3, ttl: 60 },
  DEFAULT: { limit: 100, ttl: 60 },
};

export const JWT_CONFIG = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
};

export const AUDIT_ACTIONS = {
  USER_PASSWORD_CHANGE: 'user.password_change',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_STATUS_CHANGE: 'user.status_change',
  USER_FORCE_PASSWORD_RESET: 'user.force_password_reset',
  ORGANISATION_CREATE: 'organisation.create',
  ORGANISATION_UPDATE: 'organisation.update',
  ORGANISATION_STATUS_CHANGE: 'organisation.status_change',
  ORGANISATION_MEMBER_ADD: 'organisation.member_add',
  ORGANISATION_MEMBER_REMOVE: 'organisation.member_remove',
  BOUNTY_CREATE: 'bounty.create',
  BOUNTY_UPDATE: 'bounty.update',
  BOUNTY_STATUS_CHANGE: 'bounty.status_change',
  BOUNTY_DELETE: 'bounty.delete',
  BOUNTY_OVERRIDE: 'bounty.override',
  SUBMISSION_CREATE: 'submission.create',
  SUBMISSION_UPDATE: 'submission.update',
  SUBMISSION_REVIEW: 'submission.review',
  SUBMISSION_PAYOUT_CHANGE: 'submission.payout_change',
  SUBMISSION_OVERRIDE: 'submission.override',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export const ENTITY_TYPES = {
  USER: 'User',
  ORGANISATION: 'Organisation',
  BOUNTY: 'Bounty',
  SUBMISSION: 'Submission',
  SETTINGS: 'Settings',
} as const;
