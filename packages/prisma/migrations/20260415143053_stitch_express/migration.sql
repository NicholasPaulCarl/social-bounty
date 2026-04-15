-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('brand_cash_received', 'brand_reserve', 'brand_refundable', 'hunter_pending', 'hunter_clearing', 'hunter_available', 'hunter_paid', 'hunter_net_payable', 'commission_revenue', 'admin_fee_revenue', 'global_fee_revenue', 'processing_expense', 'payout_fee_recovery', 'bank_charges', 'gateway_clearing', 'payout_in_transit');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'COMPLETED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('STITCH', 'STRIPE');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "StitchPaymentLinkStatus" AS ENUM ('CREATED', 'INITIATED', 'CAPTURED', 'SETTLED', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "StitchPayoutStatus" AS ENUM ('CREATED', 'INITIATED', 'SETTLED', 'FAILED', 'RETRY_PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'HALTED');

-- CreateEnum
CREATE TYPE "RefundState" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "RefundScenario" AS ENUM ('BEFORE_APPROVAL', 'AFTER_APPROVAL', 'AFTER_PAYOUT');

-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "bounties" ADD COLUMN     "brandAdminFeeRateBps" INTEGER,
ADD COLUMN     "faceValueCents" BIGINT,
ADD COLUMN     "globalFeeRateBps" INTEGER,
ADD COLUMN     "planSnapshotBrand" "SubscriptionTier";

-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "kybApprovedAt" TIMESTAMP(3),
ADD COLUMN     "kybStatus" "KybStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "kybSubmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "clearanceReleaseAt" TIMESTAMP(3),
ADD COLUMN     "commissionRateBps" INTEGER,
ADD COLUMN     "hunterNetCents" BIGINT,
ADD COLUMN     "planSnapshotHunter" "SubscriptionTier",
ADD COLUMN     "transactionGroupIdApproval" TEXT;

-- CreateTable
CREATE TABLE "ledger_transaction_groups" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "auditLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transaction_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transactionGroupId" TEXT NOT NULL,
    "userId" TEXT,
    "brandId" TEXT,
    "bountyId" TEXT,
    "submissionId" TEXT,
    "account" "LedgerAccount" NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'COMPLETED',
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "externalReference" TEXT,
    "parentEntryId" TEXT,
    "clearanceReleaseAt" TIMESTAMP(3),
    "metadata" JSONB,
    "postedBy" TEXT NOT NULL,
    "auditLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "signatureHeader" TEXT,
    "svixTimestamp" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stitch_payment_links" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "stitchPaymentLinkId" TEXT NOT NULL,
    "stitchPaymentId" TEXT,
    "hostedUrl" TEXT NOT NULL,
    "merchantReference" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "status" "StitchPaymentLinkStatus" NOT NULL DEFAULT 'CREATED',
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stitch_payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stitch_beneficiaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stitchBeneficiaryId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumberEnc" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stitch_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stitch_payouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "stitchPayoutId" TEXT,
    "merchantReference" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "speed" TEXT NOT NULL DEFAULT 'DEFAULT',
    "status" "StitchPayoutStatus" NOT NULL DEFAULT 'CREATED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stitch_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "JobRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "itemsSeen" INTEGER NOT NULL DEFAULT 0,
    "itemsOk" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "error" TEXT,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "submissionId" TEXT,
    "scenario" "RefundScenario" NOT NULL,
    "state" "RefundState" NOT NULL DEFAULT 'REQUESTED',
    "amountCents" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvalNote" TEXT,
    "dualApprovalByUserId" TEXT,
    "kbEntryId" TEXT,
    "stitchRefundId" TEXT,
    "transactionGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_issues" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "openedBy" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "mitigation" TEXT,
    "kbEntryRef" TEXT,
    "metadata" JSONB,

    CONSTRAINT "recurring_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_transaction_groups_createdAt_idx" ON "ledger_transaction_groups"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transaction_groups_referenceId_actionType_key" ON "ledger_transaction_groups"("referenceId", "actionType");

-- CreateIndex
CREATE INDEX "ledger_entries_transactionGroupId_idx" ON "ledger_entries"("transactionGroupId");

-- CreateIndex
CREATE INDEX "ledger_entries_userId_account_status_idx" ON "ledger_entries"("userId", "account", "status");

-- CreateIndex
CREATE INDEX "ledger_entries_account_createdAt_idx" ON "ledger_entries"("account", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_externalReference_idx" ON "ledger_entries"("externalReference");

-- CreateIndex
CREATE INDEX "ledger_entries_bountyId_idx" ON "ledger_entries"("bountyId");

-- CreateIndex
CREATE INDEX "ledger_entries_submissionId_idx" ON "ledger_entries"("submissionId");

-- CreateIndex
CREATE INDEX "ledger_entries_clearanceReleaseAt_account_status_idx" ON "ledger_entries"("clearanceReleaseAt", "account", "status");

-- CreateIndex
CREATE INDEX "webhook_events_provider_eventType_receivedAt_idx" ON "webhook_events"("provider", "eventType", "receivedAt");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_externalEventId_key" ON "webhook_events"("provider", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_payment_links_stitchPaymentLinkId_key" ON "stitch_payment_links"("stitchPaymentLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_payment_links_stitchPaymentId_key" ON "stitch_payment_links"("stitchPaymentId");

-- CreateIndex
CREATE INDEX "stitch_payment_links_bountyId_idx" ON "stitch_payment_links"("bountyId");

-- CreateIndex
CREATE INDEX "stitch_payment_links_status_idx" ON "stitch_payment_links"("status");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_beneficiaries_userId_key" ON "stitch_beneficiaries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_beneficiaries_stitchBeneficiaryId_key" ON "stitch_beneficiaries"("stitchBeneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_payouts_stitchPayoutId_key" ON "stitch_payouts"("stitchPayoutId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_payouts_idempotencyKey_key" ON "stitch_payouts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "stitch_payouts_userId_idx" ON "stitch_payouts"("userId");

-- CreateIndex
CREATE INDEX "stitch_payouts_status_nextRetryAt_idx" ON "stitch_payouts"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "job_runs_jobName_startedAt_idx" ON "job_runs"("jobName", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_stitchRefundId_key" ON "refunds"("stitchRefundId");

-- CreateIndex
CREATE INDEX "refunds_bountyId_idx" ON "refunds"("bountyId");

-- CreateIndex
CREATE INDEX "refunds_state_idx" ON "refunds"("state");

-- CreateIndex
CREATE INDEX "refunds_scenario_idx" ON "refunds"("scenario");

-- CreateIndex
CREATE INDEX "recurring_issues_resolved_lastSeenAt_idx" ON "recurring_issues"("resolved", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_issues_category_signature_key" ON "recurring_issues"("category", "signature");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionGroupId_fkey" FOREIGN KEY ("transactionGroupId") REFERENCES "ledger_transaction_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_parentEntryId_fkey" FOREIGN KEY ("parentEntryId") REFERENCES "ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stitch_payment_links" ADD CONSTRAINT "stitch_payment_links_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stitch_beneficiaries" ADD CONSTRAINT "stitch_beneficiaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stitch_payouts" ADD CONSTRAINT "stitch_payouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stitch_payouts" ADD CONSTRAINT "stitch_payouts_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "stitch_beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_dualApprovalByUserId_fkey" FOREIGN KEY ("dualApprovalByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

