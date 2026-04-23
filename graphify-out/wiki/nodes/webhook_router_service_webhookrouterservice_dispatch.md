# `WebhookRouterService.dispatch()`

> The central fan-out that routes a verified webhook event to the right domain handler based on provider and event type.

## What it does

`WebhookRouterService.dispatch(event, payload)` takes a `WebhookEvent` row (already verified by the inbound Svix signature check, already stored with `UNIQUE(provider, externalEventId)` idempotency) and a parsed payload, then branches on `event.provider`. For `STITCH`: routes `(type, status)` tuples — `LINK+SETTLED` → `BrandFundingHandler.onPaymentSettled`, `WITHDRAWAL+SETTLED` → `PayoutsService.onPayoutSettled`, `REFUND+PROCESSED` → `RefundsService.onRefundProcessed`, `SUBSCRIPTION+AUTHORISED` → `UpgradeService.onSubscriptionAuthorised` or `.onSubscriptionCharged` depending on the stitch-event subtype. For `TRADESAFE` (added R34, 2026-04-18): routes event-name strings — `tradesafe.beneficiary.linked`, `tradesafe.payout.settled`, `tradesafe.payout.failed` — each to a `TradeSafeWebhookHandler` method. Uses `ModuleRef` to resolve handlers lazily so the webhook module doesn't take a compile-time dependency on every payment-adjacent module.

## Why it exists

A single router means: one place to apply Financial Non-Negotiables #7 (retry-safe under replay) — handler paths are all `LedgerService.postTransactionGroup` writers guarded by `UNIQUE(referenceId, actionType)`; one place to apply ADR 0005 (idempotency); one place to apply the kill-switch bypass policy (the router never sets `allowDuringKillSwitch: true` — that flag only ever flows from a SUPER_ADMIN compensating entry per ADR 0006). The `TODO(R34)` comment in the file flags that the exact TradeSafe event-name strings (`tradesafe.<resource>.<action>`) are speculative until sandbox docs arrive — the arm is wired but the string may need one tweak.

## How it connects

- **`BrandFundingHandler`** — handles `LINK+SETTLED` inbound; writes `brand_reserve` leg pair via `LedgerService.postTransactionGroup`.
- **`RefundsService`** — handles `REFUND+PROCESSED` inbound; writes compensating entry pairs.
- **`PayoutsService`** — handles `WITHDRAWAL+SETTLED` outbound (will fire once `PAYOUTS_ENABLED=true`).
- **`UpgradeService`** — handles subscription event subtypes (`.onSubscriptionAuthorised`, `.onSubscriptionCharged`) for Free→Pro upgrade flows.
- **`TradeSafeWebhookHandler`** — R34 addition; three handler methods (`beneficiary.linked`, `payout.settled`, `payout.failed`) with the full 5-test matrix.
- **`WebhookEvent` (Prisma)** — the already-persisted event row this method dispatches on.
- **`ModuleRef`** — lazy DI resolution so handlers don't chain-pull at boot.
- **`.run()` sibling method** — the retry runner that calls `.dispatch()` for in-flight retries.

---
**degree:** 23 • **community:** "Webhook handlers & triggers" (ID 12) • **source:** `apps/api/src/modules/webhooks/webhook-router.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `(type, status)` tuple dispatch for Stitch vs. event-name-string dispatch for TradeSafe is asymmetric by design — the two vendors publish different shapes. If a third vendor appears, adding a third arm will be trivial but will grow this method's cyclomatic complexity; a handler-registry pattern (map of `provider.eventName → handler`) could flatten it, at the cost of losing the exhaustive-switch type safety Nest prefers.
