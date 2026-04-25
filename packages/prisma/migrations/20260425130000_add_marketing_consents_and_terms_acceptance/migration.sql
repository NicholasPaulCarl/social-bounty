-- Marketing consent + Terms of Service acceptance
-- Idempotent: safe to re-apply (matches batch 13A pattern).

-- Enums
DO $$ BEGIN
    CREATE TYPE "MarketingChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MarketingConsentSource" AS ENUM ('SIGNUP_FORM_V1', 'SETTINGS_PAGE', 'IMPORT_BACKFILL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Terms of Service acceptance columns on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAcceptedVersion" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAcceptedTextHash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAcceptedIp" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAcceptedUserAgent" TEXT;

-- MarketingConsent table
CREATE TABLE IF NOT EXISTS "marketing_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "source" "MarketingConsentSource" NOT NULL,
    "textVersion" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_consents_userId_channel_key" ON "marketing_consents"("userId", "channel");
CREATE INDEX IF NOT EXISTS "marketing_consents_userId_idx" ON "marketing_consents"("userId");

DO $$ BEGIN
    ALTER TABLE "marketing_consents" ADD CONSTRAINT "marketing_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
