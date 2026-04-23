# `RedisService.set()`

> Single typed wrapper around `redis.set(key, value, 'EX', ttlSeconds)` used everywhere from Stitch token caching to scraper locks.

## What it does

`RedisService.set(key, value, ttlSeconds)` is a small typed wrapper that forwards to the underlying `ioredis` client's `SET` with an explicit TTL. It is the canonical write path for every Redis-backed invariant in the system: (1) Stitch OAuth access-token cache at `stitch:token:v1:{scope}` with a 14-minute TTL (per `stitch.client.ts`); (2) Svix webhook-replay guard — after a webhook verifies, its `externalEventId` is stamped with a ~5-minute TTL to short-circuit replay attacks; (3) Apify per-submission scrape locks at `apify:scrape-lock:submission:{id}` preventing duplicate cost under concurrent scrape triggers; (4) Scheduler pass-locks at `apify:scheduler-lock:visibility-recheck` and `apify:scheduler-lock:scrape-recovery` ensuring the Phase 2 cron jobs never overlap themselves; (5) Pre-verify-email OTP state keyed on user id.

## Why it exists

Every one of the invariants above is "cheap-to-check, expensive-to-violate" — catching a double webhook costs nothing, processing one twice corrupts the ledger. Centralising Redis writes through one typed method means: (a) key shape conventions are enforceable in review ("all locks must use the `apify:scheduler-lock:<name>` prefix"); (b) if we ever need to add instrumentation (DataDog timing, Sentry error capture), it's a one-file change; (c) the mock in jest (`redis-service.mock.ts`) only has to stub three methods — `.set`, `.get`, `.del`. The webhook-replay guard specifically satisfies the spirit of ADR 0005 (idempotency) at the Redis layer, ahead of the DB-level `UNIQUE(referenceId, actionType)` constraint.

## How it connects

- **`RedisService` (class)** — the enclosing singleton; `.set()`, `.get()`, `.del()` are its three public methods.
- **`StitchClient.tokenCache`** — stores OAuth access tokens via `redis.set(TOKEN_CACHE_KEY, value, TOKEN_TTL_SECONDS)`; lock pattern uses `SETNX`.
- **`SubmissionScraperService`** — per-submission scrape lock via `.set()` before triggering Apify, `.del()` after.
- **`SubmissionVisibilityScheduler`** — pass-lock to prevent overlapping cron runs (commit `f24bde6`).
- **`SubmissionScrapeRecoveryScheduler`** — second pass-lock pattern (commit `920e605`); 4-min TTL shorter than the 5-min cadence.
- **`WebhookEventService`** — writes the webhook-replay guard key here.
- **`.get()` sibling method** — the read complement; both must be used together for the lock/cache patterns to hold.

The degree of 23 reflects how many different invariants rely on this single write path.

---
**degree:** 23 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/redis/redis.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** Redis is a single point of failure for several production-critical flows (webhook replay guard, scraper locks). If Redis is down, Svix webhooks retry and DB constraints catch the duplicate; scheduler runs may overlap briefly; Stitch token cache misses force a re-fetch. None are data-loss paths. The fail-closed bias is deliberate.
