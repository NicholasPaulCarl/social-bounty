# ADR 0013 — Multi-Claim Bounty Escrow Model

**Status:** Proposed, 2026-04-28
**Extends:** ADR 0011 (TradeSafe Unified Rail — canonical payment spec)
**Related:** ADR 0005 (ledger idempotency), ADR 0006 (kill-switch bypass scope), `CLAUDE.md` Financial Non-Negotiables §4, `md-files/financial-architecture.md`

## Context

A `Bounty` row carries a `maxSubmissions` field that caps the number of hunters who can be approved against it. The intent is plural: "10 hunters can each complete this and earn the reward." The current TradeSafe escrow formula at funding time, however, is `sum(bounty.rewards[i].monetaryValue)` — the sum of one reward row, not multiplied by `maxSubmissions`. See `apps/api/src/modules/tradesafe/tradesafe-payments.service.ts:296-307` (`computeFaceValueCents`), single call site at `:143`.

The mismatch surfaces immediately in the payout path. `apps/api/src/modules/ledger/approval-ledger.service.ts:131-147` debits `brand_reserve` for `bounty.faceValueCents` per approved submission. A bounty funded at `faceValueCents = R100` with `maxSubmissions = 10` can satisfy exactly **one** payout before the reserve hits zero; submission #2 creates a negative reserve and trips reconciliation `checkReserveVsBounty` (`apps/api/src/modules/reconciliation/reconciliation.service.ts:212-287`). The brand UI in `apps/web/src/components/bounty-form/useCreateBountyForm.ts:446-449` displays `totalRewardValue = sum(rewards)`, which agrees with the funded amount but misrepresents the bounty's real capacity to the brand.

The brand-facing creation flow refinement (planning doc 2026-04-28) wants the displayed total to honour the multiple-claim intent. Two paths surfaced:

1. **Display-only fix** — keep escrow at `sum(rewards)`, surface "Per-claim · Total escrowed · Hunters who can claim" as three separate lines. Honest but ships a product where `maxSubmissions > 1` is a UI-only fiction.
2. **Multiplied-escrow fix** — escrow `sum(rewards) × maxSubmissions` so the platform can actually pay every approved submission up to the cap.

The platform is currently `TRADESAFE_MOCK=true` (R24 — prod OAuth creds — is the only blocker to live money flow). No real escrow has moved. This is the cheapest possible window in which to land a corrective rule.

## Decision

Adopt the **multiplied-escrow model**. The four sub-decisions below are forced by ledger integrity once the multiplier is in scope.

### 1. Funding formula

At funding time:

```
Bounty.faceValueCents = sum(bounty.rewards[i].monetaryValue) × bounty.maxSubmissions
```

`computeFaceValueCents` is rewritten to take both `rewards` and `maxSubmissions`, asserts both are present, and returns the multiplied bigint. The single call site in `createBountyFunding` is updated. No separate `totalValueCents` field semantics change — `Bounty.faceValueCents` was already the canonical funded amount per `md-files/financial-architecture.md` line 118; this ADR clarifies its definition.

### 2. `maxSubmissions` required at funding

`bounties.service.ts` validates `maxSubmissions` as a positive integer at create time (line 700-703) but accepts `null`. Funding is decoupled — `createBountyFunding` is called against any DRAFT bounty and does not check capacity.

This ADR adds a precondition in `createBountyFunding`: if `bounty.maxSubmissions == null`, throw `BadRequestException('maxSubmissions required before funding')`. The frontend wizard (Wave B) requires the field on the Claim & Rewards step so the brand cannot reach the fund button without it.

### 3. `maxSubmissions` immutable post-funding

`maxSubmissions` is removed from `LIVE_EDITABLE_FIELDS` (`apps/api/src/modules/bounties/bounties.service.ts:47-52`). After `paymentStatus = PAID`, the field is frozen.

Rationale: keeping it editable creates immediate ledger drift on every capacity change. Reducing 10 → 5 leaves R500 over-funded; the reserve no longer matches `faceValueCents` (re-derived) and `checkReserveVsBounty` raises `reserve-drift` warnings. Increasing 5 → 10 leaves R500 under-funded; submission #6 onward would fail at payout. Either path either rots the alert signal (warning floods) or breaks payouts (under-funding). Freezing the field is the only path that preserves Financial Non-Negotiable #1 (double-entry) and #8 (platform custody) without building a top-up rail.

The four remaining `LIVE_EDITABLE_FIELDS` (`eligibilityRules`, `proofRequirements`, `endDate`) are unchanged. `endDate` extension on a LIVE bounty does not change the escrow.

### 4. Capacity change via refund + recreate

To change `maxSubmissions` on a funded bounty, the brand uses the existing pre-approval refund flow (`apps/api/src/modules/refunds/refunds.service.ts:79-130`) to cancel the current bounty and creates a new one with the desired capacity. This:

- Re-uses an audited rail (compensating entries, AuditLog, kill-switch respect per ADR 0006).
- Adds zero new endpoints, zero new ledger groups, zero new TradeSafe operations.
- Is a hard UX cliff for brands who want to top up a partially-claimed bounty. **Accepted MVP friction.**

A top-up flow (post-fund TradeSafe transaction that increases the existing bounty's escrow) is a deliberate non-goal of this ADR. If commercial demand surfaces, it becomes a separate ADR with its own ledger group (`BOUNTY_TOPPED_UP`), separate webhook handling, and reconciliation rule.

### 5. Forward-only cutover

The new formula applies at funding time only. Existing `Bounty` rows are not migrated; their `faceValueCents` continues to reflect what was actually escrowed under the old formula. Each row is self-consistent: ledger `brand_reserve` balance equals row `faceValueCents` for every PAID bounty regardless of which formula era it was funded under. `checkReserveVsBounty` continues to pass.

The existing demo bounties under `TRADESAFE_MOCK=true` are dev/staging data with no real money behind them; if any are PAID with `maxSubmissions > 1`, they remain so under their original (under-funded) face value. No data migration. No `_count` recompute. No ledger replay.

If the rule had to ship after R24 (live money flowing), this ADR would carry a §6 with a guarded migration sweep and Finance sign-off. That section does not exist because there is no real money to protect.

### 6. Allocation cardinality

One TradeSafe `Transaction` per bounty (unchanged from ADR 0011 §2). One allocation per transaction with `value = toZar(faceValueCents)` where `faceValueCents` is the multiplied amount. The allocation is **not** replicated per claim slot.

Rationale: TradeSafe's `allocationAcceptDelivery` releases the full allocation to the SELLER. Multi-allocation modelling would require dynamic allocation creation per approved submission and a corresponding `transactionUpdate` on every approval — heavy, and unnecessary because our internal ledger already tracks per-submission payouts via `approval-ledger.service.ts:131-147`. The TradeSafe transaction holds the gross escrow; our ledger debits `brand_reserve` per approved submission and TradeSafe sees one final `allocationAcceptDelivery` call when the full bounty closes out. This preserves the 1:1 transaction:bounty model that ADR 0011 §2 is built on.

§8 OQ-3 in ADR 0011 (deferred SELLER token resolution) is unaffected. SELLER token still resolves on first hunter linkage; the allocation still has one SELLER.

### 7. Fee model unchanged

The 20% hunter commission / 15% brand admin fee / 5% transaction fee from ADR 0011 §4 are computed on the multiplied face value as the base. Brand-visible total becomes `(reward × maxSubmissions) × 1.20 × 1.05` instead of `reward × 1.20 × 1.05`. Internal three-stream ledger postings (`global_fee_revenue` / `platform_admin_fee` / `hunter_commission`) scale proportionally without code change — the existing `fees.forBrandFunding(faceValueCents)` math takes the new larger face value as input.

Open question OQ-1 in ADR 0011 §8 (AGENT party fee mapping) is unaffected.

## Financial Non-Negotiable compliance

All ten from `CLAUDE.md §4` continue to hold. Only #1 and #2 are surfaced explicitly because the formula change touches their codepath.

1. **Double-entry.** `bounty_funded` ledger group (`apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts:120-164`) debits `brand_cash_received` and credits `brand_reserve` + `admin_fee_revenue` + `global_fee_revenue`. All four amounts scale together with the multiplied face value; the group remains balanced.
2. **Idempotency.** `LedgerTransactionGroup.UNIQUE(referenceId, actionType)` unchanged. `referenceId` is still the TradeSafe `transactionId`; `actionType` still `BOUNTY_FUNDED_VIA_TRADESAFE`. The amount stored in the group's debits/credits changes, but the dedupe key does not.
3. **Transaction group integrity.** No path change. Funding still posts a single ledger group inside one `prisma.$transaction`.
4. **Integer minor units.** `computeFaceValueCents` returns `bigint` cents. The multiplier (`number`, positive integer, validated at create) is safe as a numeric multiplicand because `maxSubmissions` is bounded by the `MAX_SUBMISSIONS_LIMIT` shared constant and bigint multiplication accepts a `number` for the right operand.
5. **Append-only ledger.** No mutation of prior entries. Refund continues via compensating entries.
6. **AuditLog entry.** No new audit action. Existing `TRADESAFE_BOUNTY_FUNDED` covers the funding event.
7. **Retry-safe.** Webhook replay still no-ops on `UNIQUE(provider, externalEventId)` and the ledger unique constraint.
8. **Platform custody.** Unchanged from ADR 0011 §3.8.
9. **Plan snapshot.** `LedgerTransactionGroup.planSnapshot` continues to capture tier at posting time.
10. **Global fee independence.** Global fee continues to be its own ledger account, calculated independently and shown as a separate line. Its absolute value scales with the new face value; the independence property is preserved.

## Implementation surface (Wave D)

Backend:

- `apps/api/src/modules/tradesafe/tradesafe-payments.service.ts:296-307` — rewrite `computeFaceValueCents` signature.
- `apps/api/src/modules/tradesafe/tradesafe-payments.service.ts:142` — single call site update.
- `apps/api/src/modules/tradesafe/tradesafe-payments.service.ts` — add `maxSubmissions != null` precondition before face-value computation; throw `BadRequestException` if missing.
- `apps/api/src/modules/bounties/bounties.service.ts:47-52` — drop `'maxSubmissions'` from `LIVE_EDITABLE_FIELDS`.

Tests:

- `apps/api/src/modules/tradesafe/tradesafe-webhook.handler.funds-received.spec.ts` — update the 5-test matrix (happy path, idempotent retry, partial rollback, replay, concurrent writer) for new amount expectations.
- `apps/api/src/modules/tradesafe/tradesafe-payments.service.spec.ts` — update the existing `faceValueCents` assertions; add a multiplier scenario and a `maxSubmissions=null` rejection scenario.
- `apps/api/src/modules/bounties/__tests__/update-bounty.service.spec.ts:243-258` — invert the existing "should allow updating maxSubmissions on LIVE" test to assert the change is now rejected.

Frontend:

- `apps/web/src/components/bounty-form/useCreateBountyForm.ts:446-449` — export both `perClaimRewardValue` (`sum(rewards)`) and `totalRewardValue` (`sum(rewards) × maxSubmissions`). Wizard renders both.
- `apps/web/src/components/bounty-form/FormSummaryFooter.tsx`, `RewardLinesSection.tsx`, `apps/web/src/app/business/bounties/[id]/page.tsx`, `apps/web/src/app/(participant)/bounties/[id]/page.tsx` — update display to use the new total contract.

Docs:

- ADR 0011 §2 (entity mapping, line 43) — add a footnote pointing here for multi-claim allocation semantics.
- `md-files/financial-architecture.md` — append a section under Reserve-vs-Bounty referencing this ADR for the new face-value definition.

## Open questions

None. All architectural questions are resolved within this ADR. Operational follow-ups (top-up flow, tightening fee model) are out of scope and would be separate ADRs.

## Risks

1. **Brand-facing total inflation.** A R100 reward × 10 claims now displays as R1000 + fees. Existing brands accustomed to "I see R100 on the form, I get billed ~R125" will see materially different numbers. The wizard's Claim & Rewards step (Wave B) renders both `perClaimRewardValue` and `totalRewardValue` clearly to defuse the surprise. Marketing copy and FAQ on `/payment` may need an update; that's a Wave E follow-up, not blocking.
2. **Capacity-change friction.** Brands cannot top up a running bounty. Refund + recreate is the only path. Accepted MVP friction; revisit if commercial signal emerges.
3. **Forward-only cutover discrepancy.** Old PAID bounties with `maxSubmissions > 1` remain under-funded under their original era. Reconciliation continues to pass because each row is self-consistent. If any such bounty advances to a 2nd approved submission post-cutover, the existing under-funding-bug behaviour persists for that single row. Acceptable because there are no live-money rows in this state today.
