# ADR 0008 — TradeSafe for Hunter Payouts (Supersedes ADR 0007)

**Status:** Accepted
**Date:** 2026-04-15
**Supersedes:** ADR 0007 (Peach Payments for Hunter Payouts)

## Context

ADR 0007 (earlier today) locked Peach Payments as the outbound rail for hunter payouts because Stitch Express has no multi-recipient payout surface. That decision has been revised.

**TradeSafe** is now the chosen outbound rail. TradeSafe is South Africa's longest-running digital escrow service, explicitly recommended as a second layer in `payment-gateway-review.docx` (2026-04-09) but originally deferred by ADR 0003 (TradeSafe Out of Scope). The plan has moved on: TradeSafe gives us a registered-escrow payout rail with multi-recipient disbursement and a stronger compliance posture than direct-to-bank bank rails.

## Decision

**Use TradeSafe for outbound hunter payouts.** Stitch Express remains the inbound rail for brand bounty funding (unchanged).

This supersedes:
- ADR 0003 (TradeSafe Out of Scope) — now superseded; TradeSafe is back in scope but as the payout rail, not a separate escrow layer.
- ADR 0007 (Peach Payments for Hunter Payouts) — now superseded; Peach is no longer being integrated.

This remains a **hybrid model**:
- **Inbound (brand → platform reserve):** Stitch Express hosted checkout. Shipped and live-tested.
- **Outbound (platform reserve → hunter):** TradeSafe. To be integrated in a dedicated workstream. Out of scope for this current Stitch work.

## Constraints on the integration (when it happens)

Same non-negotiables apply as would have for Peach:

1. Double-entry via `LedgerService.postTransactionGroup`. Canonical accounts unchanged (`hunter_available`, `payout_in_transit`, `hunter_paid`, `payout_fee_recovery`, `bank_charges`).
2. Idempotency via `LedgerTransactionGroup.UNIQUE(referenceId, actionType)` and `WebhookEvent.UNIQUE(provider, externalEventId)`.
3. `WebhookProvider` enum gets a new `TRADESAFE` value (not `PEACH`). Webhook router gains a `/webhooks/tradesafe` route.
4. `StitchPayout` and `StitchBeneficiary` tables get TradeSafe-aware peers (or renamed provider-agnostic — the integration ADR decides).
5. `TRADESAFE_*` env vars replace the would-have-been `PEACH_*` vars.
6. RBAC + audit log + Kill Switch enforcement are unchanged — they live at `LedgerService`.
7. TradeSafe's escrow semantics may reshape the clearance window (funds are already escrow-held; clearance may collapse into a TradeSafe "release to beneficiary" call rather than a 72h wait). The integration ADR addresses this explicitly.

## What we ship in the meantime

- The Stitch-side workarounds already in place (synthetic `local:…` beneficiary ids, disabled `PAYOUTS_ENABLED` flag, BeneficiaryService live-mode guard) all stand. The integration will replace these paths.
- `// PEACH MIGRATION:` comment markers across payout call sites are rewritten to `// TRADESAFE MIGRATION:` — see batch 6 backend agent.
- The Phase 2 live-test recipe at `docs/reviews/2026-04-15-phase-2-live-test.md` is updated in batch 6 to reference TradeSafe instead of Peach.
- ADR 0003 is marked superseded in its status line so the record stays consistent.

## Out of scope for this ADR

- TradeSafe commercial onboarding (merchant agreement, KYB, API credentials).
- Concrete integration plan — a separate ADR + workstream.
- Whether TradeSafe also provides an escrow layer alongside payout (it might — the integration ADR decides).

## Consequences

- **No code shipped today moves.** Inbound is still Stitch, ledger is provider-agnostic, finance admin dashboard + reconciliation + KB automation are all untouched.
- **The labeling of the outbound rail changes in comments, docs, and enum value names when integration begins.** That's it.
- **ADR 0003 is now mixed:** TradeSafe was "out of scope" for escrow; it is now "in scope" for payout. The distinction matters — if escrow-layer TradeSafe is also wanted later, a separate ADR covers that.
- **The Peach relationship is unwound.** No Peach sandbox or commercial work has been started under ADR 0007, so the unwind is a documentation-only change.

## Action items (closed under this ADR)

- [x] This ADR written.
- [ ] Flip `// PEACH MIGRATION:` → `// TRADESAFE MIGRATION:` on all 8 call sites — covered in batch 6 backend.
- [ ] Update Phase 2 live-test recipe note — covered in batch 6 QA.
- [ ] Mark ADR 0003 and ADR 0007 as superseded — covered in batch 6 architect.
- [ ] Integration workstream ADR — out of scope here.
