-- Migration: KYB hardening for R24 / TradeSafe pre-launch.
--
-- Context:
--   Pre-cutover the KYB capture flow was 60% complete: status enum
--   (NOT_STARTED|PENDING|APPROVED|REJECTED) plus submittedAt/approvedAt
--   columns on `organisations`, plus a working KybService with
--   submit/approve/reject. Everything else lived in AuditLog only —
--   the form payload (registeredName, registrationNumber, vatNumber,
--   country, contactEmail) wasn't persisted to the brand row, no
--   document uploads existed, no rejection reason was visible to the
--   brand admin, and admins had no review queue.
--
-- Scope of this migration:
--   1. Two new enum types: KybOrgType, KybDocumentType.
--   2. Persistent KYB columns on the `organisations` table (the model
--      is named Brand but the DB table stays `organisations` per the
--      preserved-rename pattern).
--   3. tradeSafeTokenId column — populated by KybService.approve calling
--      TradeSafeGraphQLClient.tokenCreate, then preferred by
--      TradeSafePaymentsService over the env-configured default token.
--   4. Index on (kybStatus, kybSubmittedAt) for the admin review queue.
--   5. New `kyb_documents` child table for KYB document uploads, with
--      its own `expiresAt` and FK back to organisations + uploader user.
--
-- Idempotency:
--   This migration MUST apply cleanly against (a) fresh local Postgres
--   and (b) staging/prod. Every CREATE / ALTER uses IF NOT EXISTS or
--   the DO $$ ... EXCEPTION pattern from batch 13A
--   (packages/prisma/migrations/20260415200000_reconcile_missing_enums).
--
-- Financial Non-Negotiables: no ledger rows touched, no audit logs
-- modified, no money moves. This is purely capture-state hardening so
-- the existing kyb gate in TradeSafePaymentsService finally has real
-- data behind it.

-- ─────────────────────────────────────
-- 1. New enum types (idempotent via DO $$ EXCEPTION pattern)
-- ─────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "KybOrgType" AS ENUM (
    'PRIVATE',
    'PUBLIC',
    'NGO',
    'GOVERNMENT',
    'SOLE_PROPRIETOR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "KybDocumentType" AS ENUM (
    'COR_14_3',
    'COR_15_1',
    'BANK_PROOF',
    'ID_DOC',
    'LETTER_OF_AUTHORITY',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────
-- 2. Persistent KYB columns on `organisations`
-- ─────────────────────────────────────
--
-- All nullable — existing rows are NOT_STARTED with no submission to
-- backfill. New submissions via KybService.submit populate them.

ALTER TABLE "organisations"
  ADD COLUMN IF NOT EXISTS "kybRegisteredName"     TEXT,
  ADD COLUMN IF NOT EXISTS "kybTradeName"          TEXT,
  ADD COLUMN IF NOT EXISTS "kybRegistrationNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "kybVatNumber"          TEXT,
  ADD COLUMN IF NOT EXISTS "kybTaxNumber"          TEXT,
  ADD COLUMN IF NOT EXISTS "kybCountry"            TEXT,
  ADD COLUMN IF NOT EXISTS "kybContactEmail"       TEXT,
  ADD COLUMN IF NOT EXISTS "kybRejectionReason"    VARCHAR(2000),
  ADD COLUMN IF NOT EXISTS "kybRejectedAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tradeSafeTokenId"      TEXT;

-- The org-type column references the new enum and needs a separate ALTER
-- because Postgres rejects an inline enum reference inside the same
-- statement that creates the type when wrapped in DO $$.
ALTER TABLE "organisations"
  ADD COLUMN IF NOT EXISTS "kybOrgType" "KybOrgType";

-- @unique constraint on tradeSafeTokenId. CONCURRENTLY would be ideal but
-- can't run inside the migration transaction Prisma wraps it in; the
-- table is small enough that a brief lock on insert is fine.
CREATE UNIQUE INDEX IF NOT EXISTS "organisations_tradeSafeTokenId_key"
  ON "organisations" ("tradeSafeTokenId");

-- Composite index for the admin KYB queue: list PENDING brands ordered
-- by kybSubmittedAt ASC (oldest first).
CREATE INDEX IF NOT EXISTS "organisations_kybStatus_kybSubmittedAt_idx"
  ON "organisations" ("kybStatus", "kybSubmittedAt");

-- ─────────────────────────────────────
-- 3. New `kyb_documents` child table
-- ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "kyb_documents" (
  "id"             TEXT              NOT NULL,
  "organisationId" TEXT              NOT NULL,
  "documentType"   "KybDocumentType" NOT NULL,
  "fileName"       TEXT              NOT NULL,
  "fileUrl"        TEXT              NOT NULL,
  "mimeType"       TEXT              NOT NULL,
  "fileSize"       INTEGER           NOT NULL,
  "uploadedById"   TEXT              NOT NULL,
  "uploadedAt"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"      TIMESTAMP(3),
  "notes"          VARCHAR(500),

  CONSTRAINT "kyb_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "kyb_documents_organisationId_idx"
  ON "kyb_documents" ("organisationId");

CREATE INDEX IF NOT EXISTS "kyb_documents_uploadedById_idx"
  ON "kyb_documents" ("uploadedById");

CREATE INDEX IF NOT EXISTS "kyb_documents_organisationId_documentType_idx"
  ON "kyb_documents" ("organisationId", "documentType");

-- FK: brand → organisations.id (CASCADE: deleting a brand drops its docs)
DO $$ BEGIN
  ALTER TABLE "kyb_documents"
    ADD CONSTRAINT "kyb_documents_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- FK: uploader → users.id (RESTRICT: don't let users get deleted while
-- their KYB doc rows still need an audit trail)
DO $$ BEGIN
  ALTER TABLE "kyb_documents"
    ADD CONSTRAINT "kyb_documents_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
