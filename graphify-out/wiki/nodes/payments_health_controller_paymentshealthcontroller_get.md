# `PaymentsHealthController.get()`

> SUPER_ADMIN-gated health probe covering Stitch token probe, last webhook received, kill-switch state, and credential hashes.

## What it does

`PaymentsHealthController.get()` serves `GET /admin/payments-health`, returning a `PaymentsHealthResponse` with four pieces of live signal: (1) the currently-configured `PAYMENTS_PROVIDER` env value; (2) a `stitchTokenProbe` result — a latency-instrumented round-trip against Stitch's OAuth token endpoint, only when `StitchClient.isEnabled()` is true; (3) the most-recent `WebhookEvent` received from Stitch (event type, timestamp, status, external id) resolved via `WebhookEventService.lastReceivedByProvider(STITCH)`; (4) the financial kill-switch row from `SystemSetting.financial.kill_switch.active`; and (5) hashes of the three credentials (`STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`, `STITCH_WEBHOOK_SECRET`) via `createHash('sha256')` so operators can verify env sync across environments without exposing the values themselves.

## Why it exists

This is the operator's single pane of glass for "is the payment rail alive?" — a dashboard page at `/admin/payments-health` polls this endpoint and renders the four signals. It exists because Stitch has no vendor-side health endpoint exposed to us; the token probe is our proxy for "is the API reachable with our creds right now", and the last-webhook-received field answers "are they calling us back?" The credential-hash line exists to catch config-drift incidents (R12 in the risk register, closed) — before it existed, discovering that staging had stale webhook secrets required decrypting `.env` files by hand. Part of the Phase 3 finance-admin surface (see `md-files/implementation-phases.md`).

## How it connects

- **`StitchClient`** — provides `isEnabled()` and `probeToken()`; the probe call is how this controller answers the "is Stitch reachable?" question.
- **`WebhookEventService.lastReceivedByProvider(STITCH)`** — queries `WebhookEvent` ordered by `receivedAt DESC LIMIT 1`; surfaces webhook connectivity.
- **`PrismaService.systemSetting`** — reads `financial.kill_switch.active` so the dashboard can flag when payouts are paused.
- **`ConfigService`** — sources env-driven fields (`PAYMENTS_PROVIDER`) and the raw creds that get hashed.
- **`@Roles(UserRole.SUPER_ADMIN)`** — controller-level decorator; PARTICIPANT and BUSINESS_ADMIN never hit this endpoint.
- **`/admin/payments-health` page.tsx (web)** — the frontend consumer rendering this response as stat cards.

The extremely high degree (73) is partly artifact — this is one of several `.get()`-named methods that the graph's semantic-similarity pass linked to peers — but the controller's real reach into `StitchClient`, `WebhookEventService`, `PrismaService`, and the finance-admin module is substantial on its own.

---
**degree:** 73 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/modules/finance/payments-health.controller.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the credential-hash pattern is worth copying if/when TradeSafe lands — it trivially answers "did we deploy the right creds?" without a second ops handshake. The R25 (webhook signing) and R30 (token cache staleness) risks are closed partly because this probe gives operators fast feedback.
