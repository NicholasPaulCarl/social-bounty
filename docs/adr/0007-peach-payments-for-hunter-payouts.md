# ADR 0007 — Peach Payments for Hunter Payouts (Outbound Rail) <!-- historical -->

> **Superseded** — by ADR 0008 (Jan 2026) and further expanded by ADR 0011 (single-rail TradeSafe). Retained for historical context.

**Status:** Superseded by ADR 0008 (2026-04-15). TradeSafe replaces Peach as the outbound rail; no Peach integration work was started, so unwind is documentation-only.
**Date:** 2026-04-15
**Supersedes (in part):** ADR 0001 implicitly, by introducing a second provider for the outbound leg.

## Context

The Phase 2 live-test agent (2026-04-15) discovered that Stitch Express does not expose a beneficiary / payee / payment-instrument endpoint at all. Twelve candidate paths were probed against the live sandbox; all returned 404. `POST /api/v1/withdrawal` only pays to the merchant's single verified bank account and accepts no `beneficiaryId` field. <!-- historical -->

This means **multi-recipient payouts are not possible** on Stitch Express. The platform-custody payout flow described in `md-files/payment-gateway.md` §8 cannot be completed against this product. <!-- historical -->

The consultant review at `md-files/payment-gateway-review.docx` (2026-04-09) had flagged Peach Payments as the other strong fit for SA marketplace platforms, with explicit "Marketplaces" vertical, real-time payouts to SA bank accounts, zero payout fees, and transparent pricing (2.85% + R0.99 per collection). <!-- historical -->

## Decision

**Use Peach Payments for outbound hunter payouts.** Stitch Express remains the inbound rail (brand bounty funding) — that path works correctly and is live-tested. <!-- historical -->

This is a **hybrid model**:
- **Inbound (brand → platform reserve):** Stitch Express via hosted checkout (`POST /api/v1/payment-links`) — already shipped. <!-- historical -->
- **Outbound (platform reserve → hunter bank):** Peach Payments — to be integrated in a dedicated future workstream. <!-- historical -->

## Constraints on the integration (when it happens)

When Peach is integrated, it must satisfy the same Financial Non-Negotiables (`claude.md` §4) that Stitch does: <!-- historical -->

1. Double-entry on every leg through the existing `LedgerService.postTransactionGroup`. Account names stay canonical (`hunter_available`, `payout_in_transit`, `hunter_paid`, `payout_fee_recovery`, `bank_charges`).
2. Idempotency — Peach beneficiary creation, payout requests, and webhook processing must all carry stable idempotency keys via the existing `WebhookEvent.UNIQUE(provider, externalEventId)` and `LedgerTransactionGroup.UNIQUE(referenceId, actionType)` constraints. <!-- historical -->
3. Plan snapshot already captured at submission approval — Peach changes nothing here. <!-- historical -->
4. `WebhookProvider` enum gets a new `PEACH` value. Webhook router gains a `/webhooks/peach` route paralleling `/webhooks/stitch`. <!-- historical -->
5. `StitchPayout` table is renamed `ProviderPayout` (or paired with `PeachPayout`) — the schema decision lives in the integration ADR. <!-- historical -->
6. The `STITCH_PAYOUT_SPEED`, `STITCH_MIN_PAYOUT_CENTS` env vars get Peach equivalents. <!-- historical -->
7. RBAC + audit log + Kill Switch enforcement all already live at the `LedgerService` layer — Peach doesn't change them. <!-- historical -->

## What we ship in the meantime

- The current `StitchClient.createBeneficiary` workaround (mints a `local:<slug>:<rand>` id) stays in place but gets a `// PEACH MIGRATION:` comment marker on the methods that will be replaced. <!-- historical -->
- `PayoutsService.runBatch` is gated behind `PAYOUTS_ENABLED` (currently `false` in `.env`). It stays disabled in dev/staging/prod until Peach lands. <!-- historical -->
- `PayoutsScheduler.execute` early-returns when `PAYOUTS_ENABLED !== 'true'`. No accidental Stitch payout calls. <!-- historical -->
- The `dev/seed-payable` endpoint still works for testing the clearance + ledger half of the flow without the outbound provider in play.
- The Phase 2 live-test recipe at `docs/reviews/2026-04-15-phase-2-live-test.md` is updated with a "Peach pending" note for the payout step. <!-- historical -->

## Out of scope for this ADR

- Peach commercial onboarding (KYB, merchant agreement, settlement bank). <!-- historical -->
- Concrete API integration plan — that is a separate ADR + implementation workstream.
- Whether to keep TradeSafe escrow as a future option (ADR 0003 leaves it out of scope; that stands).

## Consequences

- **Inbound is unblocked and shipped.** Brands can fund bounties end to end via Stitch Express and the ledger reflects the full brand-funding recipe. <!-- historical -->
- **Outbound is paused, not abandoned.** All upstream Phase 2 work (approval → earnings split → clearance → hunter_net_payable → hunter_available) still ships and is tested. The cut point is the moment a payout would call out to a provider; today the call goes to Stitch and would silently misroute, so the gate stays closed. <!-- historical -->
- **Schema is provider-agnostic enough** that the move from `StitchPayout`/`StitchBeneficiary` to a Peach-aware variant is a contained refactor — the `LedgerEntry` shape, `WebhookEvent` shape, and `JobRun` audit pattern are all unchanged. <!-- historical -->
- **Reconciliation will keep flagging** the orphan `payout_in_transit` debits if anyone enables payouts before Peach lands. That's the correct behaviour — the ledger drift surfaces immediately on the dashboard. <!-- historical -->

## Action items (closed under this ADR)

- [x] Document decision (this file).
- [ ] Add `// PEACH MIGRATION:` markers on the Stitch payout call sites — covered in batch 4 backend agent. <!-- historical -->
- [ ] Update Phase 2 live-test recipe with the Peach-pending note — covered in batch 4 QA agent. <!-- historical -->
- [ ] Spawn a dedicated workstream for Peach integration — out of scope here. <!-- historical -->
