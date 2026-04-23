# `StitchClient`

> The typed client adapter around Stitch Express's OAuth, payment-links, subscriptions, and payouts REST surface.

## What it does

`StitchClient` wraps every outbound call to Stitch Express. `.isEnabled()` checks the `STITCH_CLIENT_ID` env and the `PAYMENTS_PROVIDER` config. `.probeToken()` fetches an OAuth access token and times the round trip (used by `PaymentsHealthController`). `.authedRequest(method, path, body)` is the inner request executor with Redis-cached token (`stitch:token:v1:{scope}` with 840-second TTL — 14 of the 15 Stitch token life), distributed lock on the cache-refresh path (`SETNX stitch:token:lock:v1` with 10-second TTL to collapse thundering herds), 10-second timeout, 3-attempt retry with exponential backoff. Domain methods: `.createPaymentLink({ amountCents, merchantReference, payerName, payerEmailAddress, expiresAt, metadata })` (Stitch inbound hosted-checkout), `.createPayout({ amountCents, speed, beneficiaryId, merchantReference })` (Stitch outbound — deprecated in favour of TradeSafe per ADR 0008), `.createSubscription({ amountCents, recurrence, startDate, endDate, initialAmountCents, payerFullName, payerEmail, payerId, merchantReference })` (hosted card-consent for the Free→Pro upgrade).

## Why it exists

Centralising every Stitch call in one file means: (1) auth-token caching, locking, and retry logic is implemented once; (2) credentials never leak past this client — no other module sees `STITCH_CLIENT_SECRET`; (3) mocking Stitch in tests is a one-file stub (`stitch.client.mock.ts`). The token-cache TTL is deliberately 14 minutes — 1 minute shorter than Stitch's 15-minute token life — so we're never calling with an already-expired token. The distributed lock on refresh (Redis `SETNX`) collapses concurrent refresh attempts into one, matching the Stitch Express API docs' recommendation.

## How it connects

- **`StitchClient` (class)** — the public API surface.
- **`.authedRequest()` method** — the inner request plumbing; used by every domain method.
- **`RedisService.set` / `.get`** — the token cache and refresh lock storage.
- **`ConfigService`** — source for `STITCH_API_BASE`, `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`.
- **`PaymentsHealthController`** — consumes `.isEnabled()` and `.probeToken()` for the operator dashboard.
- **`BrandFundingHandler`** / **`UpgradeService`** — produce Stitch payment-links and subscriptions respectively.
- **`PayoutsService`** — was the outbound-rail consumer until ADR 0008 moved that responsibility to TradeSafe; the `createPayout` method remains but is gated by `PAYOUT_PROVIDER`.
- **ADR 0008 — TradeSafe for Hunter Payouts** — the ADR that deprecated Stitch outbound in favour of TradeSafe.

---
**degree:** 17 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/stitch/stitch.client.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `TOKEN_CACHE_KEY` scope suffix is non-obvious but load-bearing: tokens obtained for `client_paymentrequest` scope must not collide with tokens obtained for `client_subscriptionsrequest` scope. A single cache key would silently use the wrong scope and break one of the two flows. If adding a third Stitch product, add a new scope suffix — don't re-use an existing one.
