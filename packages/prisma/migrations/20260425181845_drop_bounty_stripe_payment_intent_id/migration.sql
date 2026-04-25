-- Drop the dead stripePaymentIntentId column on bounties.
-- Stripe runtime code was purged in the ADR 0011 single-rail TradeSafe cutover; the npm
-- package was removed in PR #57. This drops the residual column. Idempotent — safe to
-- re-apply if migration history diverges.
ALTER TABLE "bounties" DROP COLUMN IF EXISTS "stripePaymentIntentId";
