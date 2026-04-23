# ADR 0008 — TradeSafe for Hunter Payouts

> The supersede-in-place decision that moved outbound payouts from Peach (ADR 0007) to TradeSafe and retained Stitch for inbound.

## What it does

ADR 0008 is the architectural decision that names TradeSafe as the outbound payout rail for hunter payouts, supersedes ADR 0007 (Peach Payments) and partially supersedes ADR 0003 (TradeSafe Out of Scope — now back in scope, but as the payout rail rather than a separate escrow layer). The platform remains a **hybrid model**: inbound (brand → platform reserve) stays on Stitch Express hosted checkout (shipped and live-tested); outbound (platform reserve → hunter) is TradeSafe. The ADR enumerates the non-negotiable constraints on the integration: double-entry via `LedgerService.postTransactionGroup`, idempotency via `UNIQUE(referenceId, actionType)` + webhook `UNIQUE(provider, externalEventId)`, `WebhookProvider.TRADESAFE` enum addition, canonical accounts unchanged (`hunter_available`, `payout_in_transit`, `hunter_paid`, `payout_fee_recovery`, `bank_charges`).

## Why it exists

The Peach pivot happened earlier the same day as this ADR (2026-04-15) when commercial reality intervened — TradeSafe's registered-escrow posture gives the platform a stronger compliance story than direct-to-bank rails, and the multi-recipient disbursement surface matches the bounty-reward-to-many-hunters flow. Superseding ADR 0007 keeps the decision record clean — Peach is not "deleted", it is marked superseded with an explicit rationale. The ADR is cited from `claude.md` and from every TradeSafe-adjacent code comment (search `ADR 0008` returns the 8 TODO markers that were once `PEACH MIGRATION` and are now `TRADESAFE MIGRATION`).

## How it connects

- **`claude.md`** — the project charter; cites ADR 0008 as the active outbound-rail decision.
- **ADR 0007 — Peach Payments for Hunter Payouts** — superseded by this ADR (same-day).
- **ADR 0003 — TradeSafe Out of Scope** — partially superseded; TradeSafe is back in scope but as the payout rail, not a separate escrow.
- **ADR 0009 — TradeSafe Integration Skeleton** — the implementation-plan ADR that sits downstream of 0008.
- **R18 — TradeSafe provider vacuum** — the risk this ADR scopes; closes half the risk (engineering side) and leaves the commercial-creds side (R24) open.
- **`PayoutsService` / `TradeSafeWebhookHandler` / `TradeSafeCallbackController`** — the code paths that implement this ADR.
- **`WebhookRouterService.dispatch` tradesafe arms** — the routing logic for `tradesafe.beneficiary.linked` / `.payout.settled` / `.payout.failed` events.

---
**degree:** 17 • **community:** "Project charter & ADRs" (ID 3) • **source:** `docs/adr/0008-tradesafe-for-hunter-payouts.md`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the supersede-in-place pattern (ADR 0008 supersedes 0007, same-day) is the rare case worth noting. The git history shows the exact rationale for the change within a one-day window; future readers can trace the decision chain without guessing at the context.
