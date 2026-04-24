-- TradeSafe unified rail — schema foundation (plan.md Wave 1.4 / Phase 2).
--
-- Adds the persistence layer for ADR 0011 (TradeSafe unified inbound +
-- outbound rail). This migration is a no-op on any environment that already
-- has these objects (via a prior `db push` into the current schema.prisma).
--
-- Objects added:
--   enums: TradeSafeTransactionState, TradeSafeAllocationState
--   columns: users.tradeSafeTokenId (TEXT NULL, UNIQUE)
--   tables: tradesafe_transactions, tradesafe_allocations
--
-- Follow-up services (Wave 2.1 / 2.2):
--   * TradeSafeTokenService.ensureToken(user) writes users.tradeSafeTokenId.
--   * Phase 3 bounty-funding flow writes tradesafe_transactions +
--     tradesafe_allocations after a successful transactionCreate.
--
-- Financial Non-Negotiable safety:
--   #2 (idempotency) — tradesafe_transactions.tradeSafeTransactionId is
--      UNIQUE so webhook replays from TradeSafe cannot create duplicate rows.
--      Same for tradesafe_allocations.tradeSafeAllocationId. The ledger-group
--      idempotency key UNIQUE(referenceId, actionType) continues to apply to
--      any ledger entries posted from the TradeSafe domain handler (R34).
--   #4 (integer minor units) — totalValueCents + valueCents are BIGINT,
--      never DECIMAL. Conversion to TradeSafe's ZAR decimal happens at the
--      adapter boundary (toCents / toZar in tradesafe-graphql.operations.ts).
--   #8 (platform custody) — onDelete: Restrict on bountyId so financial rows
--      can never be silently cascaded. Allocations cascade-delete with their
--      parent transaction because the child state is meaningless without it.
--
-- Idempotency patterns (per batch 12B / batch 13A precedent):
--   * CREATE TYPE wrapped in DO $$ EXCEPTION WHEN duplicate_object
--   * ADD COLUMN IF NOT EXISTS
--   * CREATE TABLE IF NOT EXISTS
--   * CREATE [UNIQUE] INDEX IF NOT EXISTS
--   * FK ADD CONSTRAINT wrapped in DO $$ EXCEPTION WHEN duplicate_object

-- ─────────────────────────────────────
-- Enums
-- ─────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "TradeSafeTransactionState" AS ENUM (
    'CREATED',
    'FUNDS_RECEIVED',
    'INITIATED',
    'DELIVERED',
    'FUNDS_RELEASED',
    'DISPUTE',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TradeSafeAllocationState" AS ENUM (
    'CREATED',
    'FUNDS_RECEIVED',
    'INITIATED',
    'DELIVERED',
    'FUNDS_RELEASED',
    'DISPUTE',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────
-- users.tradeSafeTokenId
-- ─────────────────────────────────────

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "tradeSafeTokenId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_tradeSafeTokenId_key"
    ON "users" ("tradeSafeTokenId");

-- ─────────────────────────────────────
-- tradesafe_transactions
-- ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tradesafe_transactions" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "tradeSafeTransactionId" TEXT NOT NULL,
    "reference" TEXT,
    "state" "TradeSafeTransactionState" NOT NULL DEFAULT 'CREATED',
    "totalValueCents" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tradesafe_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tradesafe_transactions_bountyId_key"
    ON "tradesafe_transactions" ("bountyId");
CREATE UNIQUE INDEX IF NOT EXISTS "tradesafe_transactions_tradeSafeTransactionId_key"
    ON "tradesafe_transactions" ("tradeSafeTransactionId");
CREATE INDEX IF NOT EXISTS "tradesafe_transactions_state_idx"
    ON "tradesafe_transactions" ("state");

DO $$ BEGIN
  ALTER TABLE "tradesafe_transactions"
    ADD CONSTRAINT "tradesafe_transactions_bountyId_fkey"
    FOREIGN KEY ("bountyId") REFERENCES "bounties"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────
-- tradesafe_allocations
-- ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tradesafe_allocations" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "tradeSafeAllocationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "valueCents" BIGINT NOT NULL,
    "state" "TradeSafeAllocationState" NOT NULL DEFAULT 'CREATED',
    "daysToDeliver" INTEGER NOT NULL,
    "daysToInspect" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tradesafe_allocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tradesafe_allocations_tradeSafeAllocationId_key"
    ON "tradesafe_allocations" ("tradeSafeAllocationId");
CREATE INDEX IF NOT EXISTS "tradesafe_allocations_transactionId_idx"
    ON "tradesafe_allocations" ("transactionId");
CREATE INDEX IF NOT EXISTS "tradesafe_allocations_state_idx"
    ON "tradesafe_allocations" ("state");

DO $$ BEGIN
  ALTER TABLE "tradesafe_allocations"
    ADD CONSTRAINT "tradesafe_allocations_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "tradesafe_transactions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
