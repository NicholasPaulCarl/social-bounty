# R18 — TradeSafe provider vacuum

> Risk-register entry tracking the absence of a production-ready outbound payout rail before TradeSafe creds land.

## What it does

`R18 TradeSafe provider vacuum` is a risk-register concept node carrying a single architectural fact: until TradeSafe commercial onboarding completes, the monorepo has no functioning outbound payout rail. The code path exists end-to-end (adapter scaffolded per ADR 0009, env validation in place per R35, OAuth callback controller at `GET /api/v1/auth/tradesafe/callback`, webhook handlers for `tradesafe.beneficiary.linked` / `.payout.settled` / `.payout.failed` live per R34), but `PAYOUTS_ENABLED=false` keeps every one of those paths inert. R18 represents the commercial-side gap that no engineering work alone can close — TradeSafe sandbox credentials are the external blocker.

## Why it exists

R-numbered entries in the charter's "Open risks" list are the graph-side representation of what would otherwise be scattered TODO markers. Explicitly naming the risk means ADR 0008 (TradeSafe for Hunter Payouts) can reference it, the webhook router's TODO comments can reference it, and every audit can cross-check that the risk hasn't silently become an incident. The downstream risks R24 (TradeSafe creds — external blocker), R31 (dispute-reserve liquidity), R36 (no auto-retry after kill-switch-blocked inbound), and R37 (multi-recipient TradeSafe API shape unverified) are all consequences of R18 not yet being resolved. `PAYOUTS_ENABLED=false` is the literal gate.

## How it connects

- **ADR 0008 — TradeSafe for Hunter Payouts** — the decision that created the TradeSafe dependency R18 tracks.
- **ADR 0009 — TradeSafe Integration Skeleton** — the skeleton-first ADR that is executing while R18 remains open.
- **`PAYOUTS_ENABLED=false`** — the env flag that keeps the risk contained.
- **`WebhookRouterService.dispatch` tradesafe arms** — the code path gated by this risk; exists but never fires in production until creds land.
- **`TradeSafeWebhookHandler`** — the R34 handler module whose test coverage closed half the risk, leaving the commercial-side half open.
- **`PayoutsService`** — the outbound service that will invoke TradeSafe once R18 is closed.
- **`BeneficiaryService`** — KYB-linked beneficiary management; requires `BENEFICIARY_ENC_KEY` env (R29, closed) which R35 now gates via `ValidateIf(PAYOUTS_ENABLED === 'true')`.

The degree of 26 reflects how many code and doc nodes participate in the TradeSafe integration.

---
**degree:** 26 • **community:** "Roadmap & risk concepts" (ID 10) • **source:** `claude.md` (definition)

> **Architectural note:** R18 is the definitive example of "gated-ready" — engineering is complete, credentials are not, and no code change can close it. Once TradeSafe sandbox creds arrive, the `PAYOUTS_ENABLED=true` flip is a config-only deployment. The R32/R33/R34/R35 closures (2026-04-18) were the engineering-side remediation; R18 itself can only close with commercial progress.
