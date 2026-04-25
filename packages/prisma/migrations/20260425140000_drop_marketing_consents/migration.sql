-- Drop MarketingConsent surface — service-comms repositioning.
-- See ADR (forthcoming) and the legal-opt-in branch history: SMS + email
-- are now classified as service communications (POPIA-exempt transactional
-- messages), not direct-marketing channels, so per-channel consent rows are
-- no longer collected. User.termsAccepted* columns are KEPT — ToS gate is
-- still required at signup.
--
-- Idempotent: safe to re-apply against any schema state.

DROP TABLE IF EXISTS "marketing_consents";
DROP TYPE IF EXISTS "MarketingChannel";
DROP TYPE IF EXISTS "MarketingConsentSource";
