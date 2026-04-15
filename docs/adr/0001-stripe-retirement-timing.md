# ADR 0001 — Stripe Retirement Timing

**Status:** Accepted
**Date:** 2026-04-15

## Context

`apps/api/src/modules/payments/payments.service.ts` currently integrates Stripe for brand bounty funding. The canonical payment spec (`md-files/payment-gateway.md`) mandates Stitch Express. Paystack was declined 2026-04-09 (see `payment-gateway-review.docx`). The plan approved in `.claude/plans/modular-skipping-teapot.md` replaces Stripe with Stitch rather than running hybrid.

## Decision

Stripe is replaced, not run alongside Stitch.

1. **Phase 0–1**: Stripe code stays compiled and reachable behind the `PAYMENTS_PROVIDER` flag. Default flips to `stitch_sandbox` in dev/staging.
2. **Phase 1 cutover (staging)**: new bounty funding endpoint is Stitch-only (`POST /bounties/:id/fund`). Old Stripe endpoint `POST /bounties/:id/payment-intent` is deleted; `PaymentDialog.tsx` is replaced by a redirect to Stitch's hosted checkout.
3. **Phase 3 cleanup**: once production reconciliation has been green for 14 consecutive days, the Stripe client, webhook handler, and all `STRIPE_*` env vars are removed entirely.

## Consequences

- No Strategy-pattern abstraction layer. Simpler code.
- If Stitch suffers a sustained outage post-Phase-1, the rollback is `PAYMENTS_PROVIDER=none` + Kill Switch, not a fallback to Stripe.
- Historical Stripe PaymentIntents remain visible via the existing Bounty.stripePaymentIntentId column; it is not removed until the 14-day cleanup window.
