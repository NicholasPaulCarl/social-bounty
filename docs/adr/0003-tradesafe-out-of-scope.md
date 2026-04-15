# ADR 0003 — TradeSafe Escrow Layer Out of Scope

**Status:** Accepted
**Date:** 2026-04-15

## Context

`payment-gateway-review.docx` (2026-04-09) recommended pairing Stitch Money with TradeSafe (a registered SA escrow service) as a second layer of chargeback protection. Evaluated whether TradeSafe should ship with Phases 1–3 or be deferred.

## Decision

**TradeSafe is out of scope for the MVP Stitch implementation.** Social Bounty's wallet pre-funding architecture (brand funds reserve before bounty goes live; payouts from reserve, not direct card-to-hunter) already fundamentally changes the chargeback risk profile. The ledger's `brand_reserve` account *is* the platform's escrow layer.

If a compliance, banking, or risk requirement later mandates registered escrow, TradeSafe is added as a separate project with its own ADR:
- New clearing accounts (`tradesafe_clearing`, `tradesafe_reserve`).
- New provider adapter alongside `StitchClient`.
- Ledger recipes extend; core model unchanged.

## Consequences

- Faster time-to-ship.
- No third-party escrow fees.
- If a specific brand contract requires registered escrow, we cannot serve them in MVP — this is the known limitation.
