-- DRAFT MIGRATION — NOT YET APPLIED
--
-- Adds `TRADESAFE` to the WebhookProvider enum so that the
-- POST /webhooks/tradesafe controller can persist inbound TradeSafe webhook
-- events into WebhookEvent with `provider = 'TRADESAFE'`. Required by the
-- ADR 0009 scaffold; the enum change is additive and backwards-compatible
-- (no existing rows are rewritten).
--
-- Review before running `prisma migrate deploy` — the directory name
-- intentionally omits the timestamp prefix that Prisma uses so this migration
-- is NOT picked up automatically. Rename to a timestamped folder (e.g.
-- 20260416120000_tradesafe_webhook_provider) when ready to apply.
--
-- Idempotency: `ADD VALUE IF NOT EXISTS` so re-running is safe.

-- AlterEnum
ALTER TYPE "WebhookProvider" ADD VALUE IF NOT EXISTS 'TRADESAFE';
