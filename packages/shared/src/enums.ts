// ─────────────────────────────────────
// Enums - matching Prisma schema exactly
// ─────────────────────────────────────

export enum UserRole {
  PARTICIPANT = 'PARTICIPANT',
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrgStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrgMemberRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export enum BountyStatus {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum RewardType {
  CASH = 'CASH',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  NEEDS_MORE_INFO = 'NEEDS_MORE_INFO',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PayoutStatus {
  NOT_PAID = 'NOT_PAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum SocialChannel {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
}

export enum PostFormat {
  STORY = 'STORY',
  REEL = 'REEL',
  FEED_POST = 'FEED_POST',
  VIDEO_POST = 'VIDEO_POST',
}

export enum PostVisibilityRule {
  MUST_NOT_REMOVE = 'MUST_NOT_REMOVE',
  MINIMUM_DURATION = 'MINIMUM_DURATION',
}

export enum DurationUnit {
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
}

export enum Currency {
  ZAR = 'ZAR',
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}
