# ADR 0003 — TradeSafe Escrow Layer Out of Scope

> **Fully superseded 2026-04-24 by ADR 0011 (single-rail TradeSafe).** TradeSafe's escrow is now the platform's custody layer; the `brand_reserve` abstraction retires post-Phase-5. Historical references below describe the pre-2026-04-24 posture.

**Status:** Partially superseded by ADR 0008 (2026-04-15). Fully superseded by ADR 0011 (2026-04-24) — TradeSafe is now the sole payment rail.
**Date:** 2026-04-15

## Context

Historical — `md-files/payment-gateway-review.docx` (2026-04-09) recommended pairing Stitch Money with TradeSafe (a registered SA escrow service) as a second layer of chargeback protection. Evaluated whether TradeSafe should ship with Phases 1–3 or be deferred. <!-- historical -->

## Decision

Historical — **TradeSafe was marked out of scope for the MVP Stitch implementation.** Social Bounty's wallet pre-funding architecture (brand funds reserve before bounty goes live; payouts from reserve, not direct card-to-hunter) was judged to already fundamentally change the chargeback risk profile. The ledger's `brand_reserve` account was the platform's escrow layer. ADR 0011 reverses this decision: TradeSafe's escrow is now the custody layer. <!-- historical -->

Historical — if a compliance, banking, or risk requirement later mandates registered escrow, TradeSafe is added as a separate project with its own ADR: <!-- historical -->
- New clearing accounts (`tradesafe_clearing`, `tradesafe_reserve`).
- New provider adapter alongside `StitchClient` <!-- historical -->.
- Ledger recipes extend; core model unchanged.

## Consequences

- Faster time-to-ship.
- No third-party escrow fees.
- If a specific brand contract requires registered escrow, we cannot serve them in MVP — this is the known limitation.
