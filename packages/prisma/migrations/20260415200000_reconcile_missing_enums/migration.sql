-- R28 reconciliation (batch 12B) — pre-conditioning migration #1 of 3.
--
-- Context:
-- 12C's orphan-sweep review (`docs/reviews/2026-04-15-orphan-sweep.md#C1`) and
-- 12A's surprise diff revealed that schema.prisma and running code depend on
-- enums (and enum values) that no committed migration creates. A
-- `prisma migrate deploy` from an empty database would leave the schema
-- missing ~15 enums and two enum-value additions (the three drafts in
-- `packages/prisma/drafts/` are folded in here and in the companion
-- column/table migrations).
--
-- Fix strategy (mirrors R26 / R27):
-- - Do NOT edit any already-applied historical migration.
-- - Insert this idempotent pre-conditioning migration so every CREATE TYPE
--   and ALTER TYPE is guarded and re-runnable. On environments that already
--   have these enums (via `db push` into the current schema) every block is
--   a safe no-op.
-- - This migration is placed AFTER the current head (`20260415190000_*`) so
--   Prisma applies it on the next deploy without disturbing existing
--   migration checksums.
--
-- Drafts folded in here:
-- - packages/prisma/drafts/subscription_revenue_ledger/migration.sql
--     → ALTER TYPE "LedgerAccount" ADD VALUE 'subscription_revenue'
-- - packages/prisma/drafts/tradesafe_webhook_provider/migration.sql
--     → ALTER TYPE "WebhookProvider" ADD VALUE 'TRADESAFE'
-- (Both drafts will be deleted after R28 lands; see README in drafts/.)

-- ─────────────────────────────────────
-- New enums (all idempotent via DO $$ EXCEPTION wrappers)
-- ─────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "PayoutMethod" AS ENUM ('PAYPAL', 'BANK_TRANSFER', 'E_WALLET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "BountyAccessType" AS ENUM ('PUBLIC', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "BountyApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "BountyInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SocialPlatform" AS ENUM ('X', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SocialHandleStatus" AS ENUM ('PENDING_VALIDATION', 'VERIFIED', 'FAILED_VALIDATION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'SUBMISSION_APPROVED',
    'SUBMISSION_REJECTED',
    'SUBMISSION_NEEDS_MORE_INFO',
    'SUBMISSION_RECEIVED',
    'APPLICATION_RECEIVED',
    'APPLICATION_APPROVED',
    'APPLICATION_REJECTED',
    'INVITATION_RECEIVED',
    'INVITATION_ACCEPTED',
    'INVITATION_DECLINED',
    'BOUNTY_PUBLISHED',
    'BOUNTY_CLOSED',
    'NEW_MESSAGE',
    'PAYOUT_STATUS_CHANGED',
    'SYSTEM_ANNOUNCEMENT',
    'SUBSCRIPTION_ACTIVATED',
    'SUBSCRIPTION_CANCELLED',
    'SUBSCRIPTION_EXPIRING',
    'SUBSCRIPTION_EXPIRED',
    'SUBSCRIPTION_PAYMENT_FAILED',
    'SUBSCRIPTION_RENEWED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ConversationContext" AS ENUM (
    'BOUNTY', 'APPLICATION', 'SUBMISSION', 'INVITATION', 'SUPPORT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTxType" AS ENUM ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'CORRECTION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM (
    'DRAFT', 'OPEN', 'UNDER_REVIEW', 'AWAITING_RESPONSE',
    'ESCALATED', 'RESOLVED', 'CLOSED', 'WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeCategory" AS ENUM ('NON_PAYMENT', 'POST_QUALITY', 'POST_NON_COMPLIANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeReason" AS ENUM (
    'PAYMENT_NOT_RECEIVED',
    'PAYMENT_INCORRECT_AMOUNT',
    'PAYMENT_DELAYED_BEYOND_TERMS',
    'PAYOUT_MARKED_BUT_NOT_RECEIVED',
    'POST_EDITED_AFTER_APPROVAL',
    'POST_REMOVED',
    'POST_QUALITY_BELOW_STANDARD',
    'POST_WRONG_PLATFORM',
    'POST_MISSING_REQUIRED_ELEMENTS',
    'POST_DELETED_AFTER_PAYMENT',
    'POST_EDITED_AFTER_PAYMENT',
    'DISCLOSURE_REMOVED',
    'COMPETITOR_CONTENT_ADDED',
    'TERMS_VIOLATED_AFTER_PAYMENT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeResolution" AS ENUM (
    'PAYMENT_APPROVED',
    'PAYMENT_ADJUSTED',
    'PAYMENT_DENIED',
    'SUBMISSION_REVOKED',
    'RESUBMISSION_REQUIRED',
    'CONTENT_CORRECTION_REQUIRED',
    'REFUND_REQUESTED',
    'NO_ACTION',
    'MUTUAL_AGREEMENT',
    'DISMISSED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "DisputeMessageType" AS ENUM (
    'COMMENT', 'EVIDENCE', 'INTERNAL_NOTE', 'SYSTEM', 'RESOLUTION_PROPOSAL'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EvidenceType" AS ENUM ('SCREENSHOT', 'LINK', 'DOCUMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────
-- Enum-value additions (idempotent via IF NOT EXISTS)
-- ─────────────────────────────────────

-- drafts/subscription_revenue_ledger — promoted
ALTER TYPE "LedgerAccount" ADD VALUE IF NOT EXISTS 'subscription_revenue';

-- drafts/tradesafe_webhook_provider — promoted
ALTER TYPE "WebhookProvider" ADD VALUE IF NOT EXISTS 'TRADESAFE';
