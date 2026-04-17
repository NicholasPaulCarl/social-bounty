-- Live Stitch recurring subscription (card-consent) mandate.
-- One-to-one with `subscriptions`. Stitch drives the hosted consent URL
-- then recurring charges via webhook. See md-files/payment-gateway.md §12.
-- Financial Non-Negotiable #2: idempotent on (referenceId, actionType)
--   — enforced at LedgerTransactionGroup, with referenceId=stitchPaymentId.

-- CreateEnum
CREATE TYPE "StitchSubscriptionMandateStatus" AS ENUM (
    'PENDING',
    'AUTHORISED',
    'UNAUTHORISED',
    'FAILED',
    'EXPIRED',
    'CANCELLED'
);

-- CreateTable
CREATE TABLE "stitch_subscriptions" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stitchSubscriptionId" TEXT NOT NULL,
    "stitchPaymentAuthorizationId" TEXT,
    "hostedConsentUrl" TEXT NOT NULL,
    "merchantReference" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ZAR',
    "tierSnapshot" "SubscriptionTier" NOT NULL,
    "mandateStatus" "StitchSubscriptionMandateStatus" NOT NULL DEFAULT 'PENDING',
    "lastErrorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stitch_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stitch_subscriptions_subscriptionId_key"
    ON "stitch_subscriptions"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_subscriptions_stitchSubscriptionId_key"
    ON "stitch_subscriptions"("stitchSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "stitch_subscriptions_stitchPaymentAuthorizationId_key"
    ON "stitch_subscriptions"("stitchPaymentAuthorizationId");

-- CreateIndex
CREATE INDEX "stitch_subscriptions_mandateStatus_idx"
    ON "stitch_subscriptions"("mandateStatus");

-- AddForeignKey
ALTER TABLE "stitch_subscriptions"
    ADD CONSTRAINT "stitch_subscriptions_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add UNIQUE on SubscriptionPayment.providerPaymentId so (referenceId, actionType)
-- collapses cleanly when Stitch re-delivers a webhook for the same paymentId.
CREATE UNIQUE INDEX "subscription_payments_providerPaymentId_key"
    ON "subscription_payments"("providerPaymentId");
