-- R28 reconciliation (batch 12B) — pre-conditioning migration #3 of 3.
--
-- Creates tables, indexes, and foreign keys declared in schema.prisma but
-- not yet produced by any committed migration. Every CREATE TABLE uses
-- `IF NOT EXISTS`, every CREATE [UNIQUE] INDEX uses `IF NOT EXISTS`, and
-- every FK is wrapped in a `DO $$ … EXCEPTION WHEN duplicate_object` block
-- so environments that already have these objects no-op cleanly.
--
-- Tables added:
--   refresh_token_audits
--   disputes, dispute_messages, dispute_evidence, dispute_status_history
--   social_links
--   wallets, wallet_transactions, withdrawals
--   bounty_applications
--   bounty_invitations
--   user_social_handles
--   notifications
--   conversations, conversation_participants, messages
--
-- All reference `users`, `organisations`, `bounties`, `submissions` — those
-- tables already exist from `20260207124607_init` /
-- `20260207143037_add_bounty_redesign_fields`, so FK resolution is safe.

-- ═════════════════════════════════════
-- refresh_token_audits
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "refresh_token_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "refresh_token_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "refresh_token_audits_userId_idx" ON "refresh_token_audits"("userId");
CREATE INDEX IF NOT EXISTS "refresh_token_audits_jti_idx" ON "refresh_token_audits"("jti");

DO $$ BEGIN
  ALTER TABLE "refresh_token_audits"
    ADD CONSTRAINT "refresh_token_audits_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- disputes + child tables
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT NOT NULL,
    "disputeNumber" TEXT NOT NULL,
    "category" "DisputeCategory" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" "DisputeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "desiredOutcome" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "openedByUserId" TEXT NOT NULL,
    "openedByRole" "UserRole" NOT NULL,
    "organisationId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "resolutionType" "DisputeResolution",
    "resolutionSummary" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "relatedDisputeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "disputes_disputeNumber_key" ON "disputes"("disputeNumber");
CREATE INDEX IF NOT EXISTS "disputes_submissionId_idx" ON "disputes"("submissionId");
CREATE INDEX IF NOT EXISTS "disputes_bountyId_idx" ON "disputes"("bountyId");
CREATE INDEX IF NOT EXISTS "disputes_openedByUserId_idx" ON "disputes"("openedByUserId");
CREATE INDEX IF NOT EXISTS "disputes_organisationId_idx" ON "disputes"("organisationId");
CREATE INDEX IF NOT EXISTS "disputes_assignedToUserId_idx" ON "disputes"("assignedToUserId");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");
CREATE INDEX IF NOT EXISTS "disputes_category_idx" ON "disputes"("category");
CREATE INDEX IF NOT EXISTS "disputes_status_createdAt_idx" ON "disputes"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "disputes_createdAt_idx" ON "disputes"("createdAt");
CREATE INDEX IF NOT EXISTS "disputes_resolvedByUserId_idx" ON "disputes"("resolvedByUserId");
CREATE INDEX IF NOT EXISTS "disputes_relatedDisputeId_idx" ON "disputes"("relatedDisputeId");

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_submissionId_fkey"
    FOREIGN KEY ("submissionId") REFERENCES "submissions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_openedByUserId_fkey"
    FOREIGN KEY ("openedByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolvedByUserId_fkey"
    FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "disputes" ADD CONSTRAINT "disputes_relatedDisputeId_fkey"
    FOREIGN KEY ("relatedDisputeId") REFERENCES "disputes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- dispute_messages
CREATE TABLE IF NOT EXISTS "dispute_messages" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorRole" "UserRole" NOT NULL,
    "messageType" "DisputeMessageType" NOT NULL DEFAULT 'COMMENT',
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dispute_messages_disputeId_idx" ON "dispute_messages"("disputeId");
CREATE INDEX IF NOT EXISTS "dispute_messages_authorUserId_idx" ON "dispute_messages"("authorUserId");
CREATE INDEX IF NOT EXISTS "dispute_messages_createdAt_idx" ON "dispute_messages"("createdAt");

DO $$ BEGIN
  ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_disputeId_fkey"
    FOREIGN KEY ("disputeId") REFERENCES "disputes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- dispute_evidence
CREATE TABLE IF NOT EXISTS "dispute_evidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "fileUrl" TEXT,
    "url" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dispute_evidence_disputeId_idx" ON "dispute_evidence"("disputeId");
CREATE INDEX IF NOT EXISTS "dispute_evidence_uploadedByUserId_idx" ON "dispute_evidence"("uploadedByUserId");

DO $$ BEGIN
  ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_disputeId_fkey"
    FOREIGN KEY ("disputeId") REFERENCES "disputes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- dispute_status_history
CREATE TABLE IF NOT EXISTS "dispute_status_history" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "fromStatus" "DisputeStatus",
    "toStatus" "DisputeStatus" NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByRole" "UserRole" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "dispute_status_history_disputeId_idx" ON "dispute_status_history"("disputeId");
CREATE INDEX IF NOT EXISTS "dispute_status_history_createdAt_idx" ON "dispute_status_history"("createdAt");
CREATE INDEX IF NOT EXISTS "dispute_status_history_changedByUserId_idx" ON "dispute_status_history"("changedByUserId");

DO $$ BEGIN
  ALTER TABLE "dispute_status_history" ADD CONSTRAINT "dispute_status_history_disputeId_fkey"
    FOREIGN KEY ("disputeId") REFERENCES "disputes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "dispute_status_history" ADD CONSTRAINT "dispute_status_history_changedByUserId_fkey"
    FOREIGN KEY ("changedByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- social_links
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "social_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialChannel" NOT NULL,
    "url" TEXT NOT NULL,
    "handle" TEXT,
    "followerCount" INTEGER,
    "postCount" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "social_links_userId_idx" ON "social_links"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "social_links_userId_platform_key" ON "social_links"("userId", "platform");

DO $$ BEGIN
  ALTER TABLE "social_links" ADD CONSTRAINT "social_links_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- wallets + wallet_transactions + withdrawals
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wallets_userId_key" ON "wallets"("userId");
CREATE INDEX IF NOT EXISTS "wallets_userId_idx" ON "wallets"("userId");

DO $$ BEGIN
  ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_referenceType_referenceId_idx"
    ON "wallet_transactions"("referenceType", "referenceId");
CREATE INDEX IF NOT EXISTS "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");

DO $$ BEGIN
  ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "withdrawals" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "method" "PayoutMethod" NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "destination" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "withdrawals_walletId_idx" ON "withdrawals"("walletId");
CREATE INDEX IF NOT EXISTS "withdrawals_userId_idx" ON "withdrawals"("userId");
CREATE INDEX IF NOT EXISTS "withdrawals_status_idx" ON "withdrawals"("status");
CREATE INDEX IF NOT EXISTS "withdrawals_createdAt_idx" ON "withdrawals"("createdAt");

DO $$ BEGIN
  ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "wallets"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- bounty_applications + bounty_invitations
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "bounty_applications" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BountyApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "bounty_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bounty_applications_bountyId_idx" ON "bounty_applications"("bountyId");
CREATE INDEX IF NOT EXISTS "bounty_applications_userId_idx" ON "bounty_applications"("userId");
CREATE INDEX IF NOT EXISTS "bounty_applications_status_idx" ON "bounty_applications"("status");
CREATE INDEX IF NOT EXISTS "bounty_applications_reviewedBy_idx" ON "bounty_applications"("reviewedBy");
CREATE UNIQUE INDEX IF NOT EXISTS "bounty_applications_bountyId_userId_key"
    ON "bounty_applications"("bountyId", "userId");

DO $$ BEGIN
  ALTER TABLE "bounty_applications" ADD CONSTRAINT "bounty_applications_bountyId_fkey"
    FOREIGN KEY ("bountyId") REFERENCES "bounties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "bounty_applications" ADD CONSTRAINT "bounty_applications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "bounty_applications" ADD CONSTRAINT "bounty_applications_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "bounty_invitations" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "userId" TEXT,
    "socialPlatform" "SocialPlatform" NOT NULL,
    "socialHandle" TEXT NOT NULL,
    "status" "BountyInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "bounty_invitations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bounty_invitations_bountyId_idx" ON "bounty_invitations"("bountyId");
CREATE INDEX IF NOT EXISTS "bounty_invitations_userId_idx" ON "bounty_invitations"("userId");
CREATE INDEX IF NOT EXISTS "bounty_invitations_status_idx" ON "bounty_invitations"("status");
CREATE INDEX IF NOT EXISTS "bounty_invitations_invitedBy_idx" ON "bounty_invitations"("invitedBy");
CREATE UNIQUE INDEX IF NOT EXISTS "bounty_invitations_bountyId_socialPlatform_socialHandle_key"
    ON "bounty_invitations"("bountyId", "socialPlatform", "socialHandle");

DO $$ BEGIN
  ALTER TABLE "bounty_invitations" ADD CONSTRAINT "bounty_invitations_bountyId_fkey"
    FOREIGN KEY ("bountyId") REFERENCES "bounties"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "bounty_invitations" ADD CONSTRAINT "bounty_invitations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "bounty_invitations" ADD CONSTRAINT "bounty_invitations_invitedBy_fkey"
    FOREIGN KEY ("invitedBy") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- user_social_handles
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "user_social_handles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "normalizedHandle" TEXT NOT NULL,
    "profileUrl" TEXT,
    "profileImageUrl" TEXT,
    "displayName" TEXT,
    "followerCount" INTEGER,
    "status" "SocialHandleStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "lastValidatedAt" TIMESTAMP(3),
    "validationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_social_handles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_social_handles_userId_idx" ON "user_social_handles"("userId");
CREATE INDEX IF NOT EXISTS "user_social_handles_platform_normalizedHandle_idx"
    ON "user_social_handles"("platform", "normalizedHandle");
CREATE UNIQUE INDEX IF NOT EXISTS "user_social_handles_userId_platform_key"
    ON "user_social_handles"("userId", "platform");
CREATE UNIQUE INDEX IF NOT EXISTS "user_social_handles_platform_normalizedHandle_key"
    ON "user_social_handles"("platform", "normalizedHandle");

DO $$ BEGIN
  ALTER TABLE "user_social_handles" ADD CONSTRAINT "user_social_handles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- notifications
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═════════════════════════════════════
-- conversations + conversation_participants + messages
-- ═════════════════════════════════════

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "context" "ConversationContext" NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "subject" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "conversations_referenceType_referenceId_idx"
    ON "conversations"("referenceType", "referenceId");
CREATE INDEX IF NOT EXISTS "conversations_createdAt_idx" ON "conversations"("createdAt");
CREATE INDEX IF NOT EXISTS "conversations_createdBy_idx" ON "conversations"("createdBy");
CREATE INDEX IF NOT EXISTS "conversations_isPriority_updatedAt_idx"
    ON "conversations"("isPriority", "updatedAt");

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "conversation_participants_userId_idx"
    ON "conversation_participants"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "conversation_participants_conversationId_userId_key"
    ON "conversation_participants"("conversationId", "userId");

DO $$ BEGIN
  ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "isSystemMessage" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx"
    ON "messages"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages"("senderId");

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
