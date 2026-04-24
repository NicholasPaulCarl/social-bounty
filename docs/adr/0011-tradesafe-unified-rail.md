# ADR 0011 — TradeSafe Unified Inbound + Outbound Rail

**Status:** Accepted, 2026-04-24
**Supersedes:** ADR 0003 (TradeSafe Out of Scope — platform reserve as sole custody layer)
**Extends:** ADR 0008 (TradeSafe for Hunter Payouts — outbound only)
**Related:** ADR 0005 (ledger idempotency), ADR 0006 (kill-switch bypass scope), ADR 0009 (integration skeleton), `CLAUDE.md` Financial Non-Negotiables §4, `md-files/payment-gateway.md`, `md-files/financial-architecture.md`

## Context

ADR 0008 (2026-04-15) locked TradeSafe as the outbound hunter-payout rail while keeping Stitch Express as the inbound (brand-funding) rail. ADR 0009 (2026-04-15) scaffolded the TradeSafe integration shape — Option B peer tables, `PAYOUTS_PROVIDER` flag, Svix-equivalent webhook route — without committing to one rail or two.

Three things have changed since then:

1. **Stitch subscriptions are commercially blocked.** The Pro-tier card-consent flow was gated behind `SUBSCRIPTION_UPGRADE_ENABLED=false` in commit `8ca5c57` (2026-04-22) because Stitch's `recurring-consent` scope was not enabled on the sandbox tenant and the commercial enablement timeline is unclear. Live card-consent checkouts against `secure.stitch.money` returned `INVALID_SCOPE` on every attempt. We can fund one-off bounty payments today but cannot price a Pro subscription.
2. **TradeSafe's GraphQL API is live and verified against sandbox.** Commits `0687cb5` (Phase 1a — GraphQL client + OAuth client-credentials flow against `https://auth.tradesafe.co.za/oauth/token`) and `fee3571` (Phase 1b — mutation helpers + live sandbox smoke round-tripping `tokenCreate` → `transactionCreate` → `checkoutLink` → `allocationAcceptDelivery`) prove the rail works end-to-end. Hosted checkout returns a live URL the browser can redirect to for card / EFT / OZOW / SnapScan capture. Auto-payout to the SELLER fires on `allocationAcceptDelivery` without a separate outbound call.
3. **Per-bounty escrow maps cleanly to the bounty lifecycle.** TradeSafe's transaction model — one transaction per commercial arrangement, allocations for each payment slice, BUYER / SELLER / AGENT party roles — is a natural fit for "brand creates bounty, hunter delivers, platform takes a cut". The platform reserve abstraction (ADR 0003) becomes redundant: TradeSafe's own escrow is the custody layer.

The hybrid Stitch-inbound / TradeSafe-outbound posture from ADR 0008 was defensible when inbound was live and outbound was blocked on creds. It is no longer defensible when inbound would need to live alongside a TradeSafe rail that can already do the inbound flow (hosted checkout), and when the inbound rail's subscription path is gated on an unknown commercial timeline.

## Decision

Adopt TradeSafe as the **single payment rail** for Social Bounty. Stitch Express stays operational during the phased cutover (see §6) and is deleted in full once the TradeSafe inbound + outbound paths are green in production.

### 1. Party role mapping

TradeSafe's three party roles map onto Social Bounty's three actors:

| Social Bounty actor | TradeSafe role | Notes |
|---|---|---|
| Brand (bounty creator, funder) | `BUYER` | One TradeSafe token per brand user, cached on `User.tradeSafeTokenId` (see §4). Brand funds the bounty via hosted checkout. |
| Hunter (participant, deliverable submitter) | `SELLER` | One token per hunter. Banking details captured at first bounty apply so TradeSafe can auto-pay on delivery acceptance. |
| Platform (Social Bounty Pty Ltd) | `AGENT` | Single platform token obtained via `apiProfile.organizations[].token`, consumed on every bounty transaction. AGENT receives all platform-fee revenue. |

Parties are registered via `tokenCreate` (see `apps/api/src/modules/tradesafe/tradesafe-graphql.operations.ts:124-172`) and re-used across every bounty the user participates in. Tokens are nullable on the User row because brand-only users never need banking details; the SELLER token for a hunter is captured on the first bounty-apply flow.

### 2. Entity mapping

| Social Bounty entity | TradeSafe entity |
|---|---|
| `Bounty` | `Transaction` — one per bounty. `reference` field holds our `bountyId` for webhook correlation (echoed back on every callback). |
| Bounty reward (cash owed to hunter) | Transaction allocation — one allocation for the reward. Additional allocations model optional dispute reserves if Phase 3 fee modelling requires them. |
| Brand bounty-funding payment | Transaction `deposits[]` — populated once the brand completes hosted checkout. Deposit `processed: true` signals `FUNDS_RECEIVED` state. |
| Submission approval | `allocationAcceptDelivery(allocationId)` — transitions the allocation from `INITIATED`/`DELIVERED` to `FUNDS_RELEASED`. TradeSafe auto-pays the SELLER's registered bank account from escrow. No separate outbound call. |
| Submission rejection / refund | Allocation `CANCELLED` transition (exact path confirmed in Phase 3 alongside fee mapping — see §8 OQ-1). |

### 3. Amount handling

TradeSafe GraphQL uses ZAR decimal (`Float`, up to 2 d.p.) on allocation `value` and deposit `value` fields. Our ledger continues to store integer minor units (cents) per Financial Non-Negotiable #4. Conversion lives in **one place** at the adapter boundary: `toZar(cents: bigint): number` and `toCents(zar: number): bigint` at `apps/api/src/modules/tradesafe/tradesafe-graphql.operations.ts:20-30`. Both use `Math.round(zar * 100)` to guard float drift.

Ledger writers never see Float. TradeSafe clients never see bigint. If TradeSafe's API ever switches to minor units (unlikely but flagged as a live-smoke pre-check on every deploy), the two converters flip and no other code moves.

### 4. Fee structure

Platform revenue from every bounty is 40% of the brand-funded amount, composed of three streams:

- **20% hunter commission** — taken from the reward before the hunter is paid.
- **15% brand admin fee** — added to the brand's deposit total.
- **5% transaction fee** — added to the brand's deposit total.

The platform continues to price the brand-visible total as "reward + 20% + 5%" (i.e. brand pays `reward × 1.20 × 1.05` to see `reward × 0.80` land with the hunter). Internally the three streams are three ledger postings into `global_fee_revenue` / `platform_admin_fee` / `hunter_commission` per Financial Non-Negotiable #10.

The **open question** is how these three streams map to TradeSafe's AGENT party fee model (see §8 OQ-1). TradeSafe's `PartyInput` accepts a single `fee` + `feeType` + `feeAllocation` tuple, which is straightforward for a single platform cut but needs an explicit pattern (multi-allocation split, or compute-the-sum-and-post-three-ledger-entries-internally) for three streams. Phase 3 (inbound cutover) is gated on this question being resolved.

### 5. Inbound lifecycle

1. Brand clicks "Fund bounty" on `/business/bounties/[id]`.
2. API calls `TradeSafeGraphQLClient.transactionCreate(...)` with BUYER=brand token, SELLER=hunter token (or deferred if hunter not yet linked — see §8 OQ-3), AGENT=platform token, allocations=`[{ value: toZar(rewardCents), ... }]`.
3. API calls `TradeSafeGraphQLClient.checkoutLink(transactionId)` to get the hosted URL.
4. API responds with the hosted URL; frontend redirects the browser.
5. Brand completes payment on TradeSafe's hosted page.
6. TradeSafe POSTs a callback to our URL-path-secreted endpoint (see §5 Webhook strategy below).
7. Our handler re-fetches `getTransaction(transactionId)`, confirms `state=FUNDS_RECEIVED` + `deposits[0].processed=true`, posts the funding ledger group (double-entry, idempotent on `(transactionId, 'BOUNTY_FUNDED')`), flips `Bounty.paymentStatus=PAID`.

### 6. Outbound lifecycle

1. Brand reviews submission, clicks Approve.
2. API validates (RBAC + all URL scrapes `VERIFIED` per the Phase 1 verification gate).
3. API calls `TradeSafeGraphQLClient.allocationAcceptDelivery(allocationId)`.
4. TradeSafe transitions the allocation to `FUNDS_RELEASED` and auto-pays the SELLER's registered bank.
5. TradeSafe POSTs callback; our handler re-fetches, confirms `state=FUNDS_RELEASED`, posts the payout ledger group (idempotent on `(allocationId, 'SUBMISSION_APPROVED_PAYOUT')`).

The clearance window question flagged in ADR 0009 §7 collapses: TradeSafe's own escrow-to-disbursement window (typically same-business-day post-release) replaces our internal 72h hold. This is a **policy change** (we lose direct control of the chargeback-buffer window) and is flagged as §8 OQ-4 — the Finance team signs off before Phase 4 goes live.

## 3. Financial Non-Negotiable compliance

All ten Non-Negotiables from `CLAUDE.md §4` are honoured. The only architectural reinterpretation is #8 (platform custody), addressed explicitly below.

1. **Double-entry.** Every TradeSafe webhook-triggered ledger posting goes through `LedgerService.postTransactionGroup`; debits equal credits within each group. The bounty-funded group debits `tradesafe_escrow` (new account) and credits `bounty_reserved`. The payout group debits `bounty_reserved` and credits `hunter_paid` + `global_fee_revenue` + `platform_admin_fee` + `hunter_commission`.
2. **Idempotency.** `LedgerTransactionGroup.UNIQUE(referenceId, actionType)` is unchanged. New `actionType` values: `BOUNTY_FUNDED` (referenceId = TradeSafe `transactionId`), `SUBMISSION_APPROVED_PAYOUT` (referenceId = TradeSafe `allocationId`). The pattern from ADR 0005 (pre-check outside tx + safety-net catch inside) is preserved.
3. **Transaction group integrity.** All ledger writes per webhook receive commit or roll back together via `prisma.$transaction`. The webhook handler's pattern: `INSERT webhook_event (provider=TRADESAFE, externalEventId=...) → getTransaction(id) re-fetch → LedgerService.postTransactionGroup → AuditLog INSERT` — single transaction.
4. **Integer minor units.** Ledger continues in cents. `toZar` / `toCents` at the adapter boundary only. Zero Float on the ledger side.
5. **Append-only ledger.** Refunds (allocation `CANCELLED`) post compensating entries, never updates. No TradeSafe event mutates a prior `LedgerEntry` row.
6. **AuditLog entry.** Every TradeSafe-driven state change writes an `AuditLog` row inside the same transaction as the ledger posting. New audit actions: `TRADESAFE_BOUNTY_FUNDED`, `TRADESAFE_SUBMISSION_PAYOUT`, `TRADESAFE_ALLOCATION_CANCELLED`.
7. **Retry-safe.** Webhook replays no-op on the `UNIQUE(provider, externalEventId)` guard (unchanged from Stitch). `allocationAcceptDelivery` is idempotent-by-state on the TradeSafe side (a second call on an already-released allocation returns the same `FUNDS_RELEASED` state without double-paying). Our handler's guard is the ledger unique constraint.
8. **Platform custody — reinterpreted.** ADR 0003's original statement was "all funds flow through platform-controlled custody; no direct brand-to-hunter payments". This ADR reinterprets *platform-controlled* as *controlled by a custody layer the platform is the AGENT of*. TradeSafe's escrow is a registered SA escrow service holding funds on behalf of the platform-mediated transaction; the platform (as AGENT) controls release via `allocationAcceptDelivery`. Funds never move brand → hunter directly; they move brand → TradeSafe-held escrow → hunter with the platform gating every release. The intent of Non-Negotiable #8 (no rogue direct payments, platform controls every release) is preserved; only the identity of the custody account changes.
9. **Plan snapshot.** Tier (Free / Pro) is still snapshotted onto `LedgerTransactionGroup.planSnapshot` at posting time. TradeSafe has no opinion on our subscription tiers — the snapshot is purely internal. In-flight transactions are never re-priced on plan change.
10. **Global fee independence.** The 3.5% global platform fee (originally Stitch's processing cost pass-through) is **re-homed** as a conceptual platform fee under TradeSafe. TradeSafe's own processing fee is a separate concern (see §8 OQ-2). `global_fee_revenue` remains its own ledger account, calculated independently of the 20 / 15 / 5 splits, and shown as a separate line in all UI and reports. The exact 3.5% number may be revised pending clarification of TradeSafe's own fee pass-through — the **independence** property is what Non-Negotiable #10 requires, not the specific rate.

## 4. Webhook signature strategy

TradeSafe does **not** document a webhook signature scheme (no HMAC header, no Svix-style secret, no body-signing). Our inbound verification is defence-in-depth and resilient whether TradeSafe adds signing later or never does:

1. **URL-path secret.** The callback URL is `POST /api/v1/webhooks/tradesafe/:secret` where `:secret` is a 32-char random string stored in `TRADESAFE_CALLBACK_SECRET`. The full URL is registered with TradeSafe once at tenant-setup time. Constant-time compare (`crypto.timingSafeEqual`) against the env var; `401 Unauthorized` on mismatch. Rotating the secret rotates the URL.
2. **Authoritative GraphQL re-fetch.** The webhook body is treated as **untrusted**. On every valid callback the handler extracts only the `transactionId` (or `allocationId`) from the body, then calls `TradeSafeGraphQLClient.getTransaction(id)` to fetch canonical state directly from TradeSafe's authenticated GraphQL endpoint. All ledger / state-machine decisions are made from the re-fetched state, never from the callback body.
3. **Idempotency guard.** `WebhookEvent.UNIQUE(provider=TRADESAFE, externalEventId)` short-circuits replays. `externalEventId` is derived from `(transactionId, state)` since TradeSafe does not issue event ids — state-change tuples are naturally unique for a given transaction.

This design is robust in four adversarial cases:

- **TradeSafe adds HMAC signing later.** Additive: add the signature verifier above the re-fetch. URL-secret stays as extra depth.
- **Attacker guesses or exfiltrates the URL secret.** They can POST junk to our endpoint, but `getTransaction(id)` fails for unknown IDs, and known IDs return canonical TradeSafe state — an attacker can't forge a state transition by posting crafted JSON.
- **TradeSafe's callback replays.** Deduped at `WebhookEvent.UNIQUE(provider, externalEventId)` and again at the ledger's `UNIQUE(referenceId, actionType)`.
- **Our GraphQL re-fetch fails transiently.** Handler returns 5xx → TradeSafe retries per their delivery SLA. On eventual success, the idempotency guards mean the ledger posting is atomic-exactly-once.

The trade-off we accept: one extra round-trip per webhook (the GraphQL re-fetch). On sandbox this adds ~150-300ms to callback processing. We consider this acceptable cost for treating callback bodies as untrusted.

## 5. Kill switch + RBAC

Financial kill switch (`SystemSetting.financial.kill_switch.active`) continues to gate all outbound movement regardless of rail. The TradeSafe callback handler checks `LedgerService.isKillSwitchActive()` before invoking `allocationAcceptDelivery`-driven ledger postings, short-circuits with a `RecurringIssue` entry if active, and defers processing until the switch is cleared. Per ADR 0006, the TradeSafe handler is **not** on the compensating-entry-bypass list and must not be added to it.

RBAC is unchanged: the `PAYOUTS_ENABLED` operator flag remains the top-level gate on outbound. Only authenticated brand admins can fund a bounty (inbound); only authenticated brand admins can approve a submission (triggering outbound). All existing RBAC guards carry over.

## 6. Phased cutover plan

The cutover is deliberately staged so each phase lands on green reconciliation before the next begins. Stitch stays live across the full arc; deletion is the final step.

| Phase | Scope | Status | Gate |
|---|---|---|---|
| **1a** | GraphQL client + OAuth (`TradeSafeGraphQLClient`, token cache, retry) | Done (commit `0687cb5`, 2026-04-22) | — |
| **1b** | Mutation helpers + live sandbox smoke (`tokenCreate`, `transactionCreate`, `checkoutLink`, `allocationAcceptDelivery`) | Done (commit `fee3571`, 2026-04-23) | — |
| **1c** | This ADR | Done (this file, 2026-04-24) | — |
| **1d** | Webhook callback controller + domain handlers. URL-path secret, GraphQL re-fetch, `WebhookRouterService` dispatch arms for `transaction.*` / `allocation.*` / `deposit.*` events. Full 5-test matrix per `CLAUDE.md §5`. | Pending (next up) | — |
| **2** | Token lifecycle service. Prisma migration adding `User.tradeSafeTokenId`, `TradeSafeTransaction`, `TradeSafeAllocation` tables. `TradeSafeTokenService.ensureToken(user)` idempotent helper, fired fire-and-forget from signup; blocking on first bounty-apply. | Pending | 1d merged |
| **3** | Inbound cutover. Swap `StitchPaymentsService` → `TradeSafePaymentsService` on bounty-funding endpoint. Live reconciliation for 24h staging before production flip. | **Blocked** | Live TradeSafe creds (R24), AGENT fee mapping confirmed (§8 OQ-1), full integration test matrix green |
| **4** | Outbound cutover. Wire submission approval → `allocationAcceptDelivery`. Clearance-window policy decision (§8 OQ-4). | **Blocked** | Phase 3 green in production for 48h |
| **5** | Reconciliation engine update — `checkPayoutsVsLedger` extended to cover TradeSafe transactions + allocations. Stitch code deleted (services, routes, config, docs). `PAYOUTS_PROVIDER` flag removed. | **Blocked** | Phase 4 green in production for 7 days |

Phases 3–5 are gated on external commercial closures (live creds, TradeSafe fee-model clarification). Phases 1d + 2 land in the current session.

## 7. Alternatives considered

### (a) Keep Stitch + wait for subscriptions feature enablement

- Keep the hybrid Stitch-inbound / TradeSafe-outbound posture from ADR 0008.
- Wait for Stitch's `recurring-consent` scope to be enabled on our sandbox tenant.
- Rationale for rejection: commercial timeline on Stitch's side is unclear (weeks to months per the last support thread). The Pro subscription CTA is already gated behind `SUBSCRIPTION_UPGRADE_ENABLED=false` indefinitely. Two rails to maintain with no commercial payoff is net-negative. TradeSafe does not support recurring subscriptions either — so the subscription path is deferred regardless (see below).

### (b) Hybrid Stitch-inbound + TradeSafe-outbound (ADR 0008 as-is)

- Keep both rails in production permanently.
- Rationale for rejection: two providers to reconcile (two webhook handlers, two idempotency namespaces, two fee models, two credential bundles), no user-facing benefit, doubled operational surface. The only argument for it was "Stitch inbound is live today" — Phase 1a/1b demonstrated TradeSafe inbound is also live today.

### (c) Card-consents + manual renewal cron on Stitch for subscriptions

- Implement Pro subscriptions as a manual monthly cron that triggers a card-consent authorised charge per active Pro user.
- Rationale for rejection: still needs Stitch's `recurring-consent` scope, which is the gate we're currently behind. Buys nothing.

**Subscription implication of this decision:** TradeSafe has no recurring-subscription primitive — it's per-transaction escrow only. Pro tier stays gated behind `SUBSCRIPTION_UPGRADE_ENABLED=false` after this ADR ships; enabling Pro becomes a separate workstream that either (i) waits for Stitch subscriptions to unblock commercially and re-integrates them narrowly for subscription-only, or (ii) picks a subscription-capable PSP (Paystack, Stripe — both have SA coverage). Out of scope for this ADR.

## 8. Open questions

The following must be closed before Phases 3–5 proceed. Each has a concrete decision criterion.

**OQ-1 — Fee mapping to TradeSafe AGENT party.** How do the three platform fee streams (20% hunter commission, 15% brand admin fee, 5% transaction fee) map to TradeSafe's single `PartyInput.fee` / `feeType` / `feeAllocation` tuple on the AGENT party?

*Decision criterion:* sandbox-test the two candidate patterns — (i) single 40% AGENT fee with internal three-way ledger split, or (ii) three separate allocations with AGENT fee on each — against TradeSafe's checkout UI and settlement statement. The pattern that keeps the brand-visible invoice math clean (brand pays a single inclusive total, not three line-items they never see) wins. Owner: backend agent in Phase 3 kickoff.

**OQ-2 — TradeSafe's own processing fee.** Is the TradeSafe per-transaction fee passed through to the platform (reducing our net AGENT receipt) or included in TradeSafe's quoted fee structure? Affects whether `global_fee_revenue` stays at 3.5% or is revised.

*Decision criterion:* the first live sandbox settlement statement (first `FUNDS_RELEASED` with actual money movement) surfaces the TradeSafe fee line. Finance team compares against the quoted commercial rate, and we either (i) keep `global_fee_revenue` at 3.5% with the TradeSafe fee as a platform cost, or (ii) flow the TradeSafe fee through a new `tradesafe_processing_fee` ledger account and recalibrate `global_fee_revenue`. Owner: Finance team + backend agent in Phase 3.

**OQ-3 — Just-in-time hunter SELLER token.** The hunter's SELLER token requires banking details (`bank` + `accountNumber` + `accountType`). We can't capture those at brand signup. Candidate flows: (i) capture at first bounty-apply (blocks apply until banking complete), or (ii) capture asynchronously and fund the bounty with SELLER=null, patching it in before `allocationAcceptDelivery` fires.

*Decision criterion:* TradeSafe's `transactionCreate` behaviour when SELLER is missing — does it accept SELLER-less transactions with a later `partyAdd`, or does it reject the mutation? Resolved by sandbox test in Phase 2. If (ii) is viable, the UX friction at hunter signup stays low. Owner: backend agent in Phase 2.

**OQ-4 — Clearance window policy.** ADR 0009 §7 flagged two options: (a) keep our internal 72h clearance + TradeSafe-hold, or (b) rely on TradeSafe's default escrow dwell time as the hold window.

*Decision criterion:* Finance team confirms whether 72h chargeback-buffer ownership is a Stitch-specific control (cards can chargeback for months) or a general platform policy (TradeSafe's escrow-to-bank window already collapses the window naturally). If the former, option (a); if the latter, option (b). Target resolution: before Phase 4 goes live. Owner: Finance team.

**OQ-5 — Webhook signature scheme evolution.** TradeSafe does not sign webhooks today. If they introduce HMAC signing later, do we layer it over the URL-path-secret (defence-in-depth) or replace it?

*Decision criterion:* additive until proven otherwise. URL-path-secret costs almost nothing to keep. If TradeSafe signs, the handler verifies both; the signature becomes the primary guard and the URL secret becomes a second-factor. Only if keeping both introduces a real maintenance burden do we drop the URL secret. Owner: backend agent (when / if TradeSafe ships signing).

## 9. Consequences

**Positive.**

- Single payment rail. One webhook route, one idempotency namespace, one provider credential bundle, one reconciliation adapter.
- Hosted checkout works today — brand can fund a bounty end-to-end on the sandbox, no custom UI build required.
- Auto-payout on delivery acceptance — no separate outbound call, no separate outbound rail, no beneficiary synthetic-id workaround.
- Per-bounty escrow simplifies reconciliation: every bounty has exactly one TradeSafe `transactionId`, one `allocationId` per payment slice, and one canonical state machine — much simpler than aggregating reserves across many-to-many brand-to-bounty relationships.
- Registered SA escrow is a stronger compliance posture than direct reserve-to-bank rails for the SA regulatory context.
- Platform reserve goes away as a concept. `brand_reserve` account retires post-Phase-5.

**Negative.**

- GraphQL learning curve for anyone new to the codebase (TradeSafe's API uses nested input types, non-obvious enum casing, and `Email` / `Country` / `UniversalBranchCode` custom scalars).
- Per-bounty escrow means we cannot aggregate funds across brands (e.g. "pre-fund a spending cap"). Every bounty is its own escrow unit. Acceptable for the MVP product model; a future enterprise-tier "spending wallet" feature would need a separate aggregation abstraction.
- Token lifecycle adds signup friction: brand users need a TradeSafe BUYER token to fund; hunter users need a SELLER token with banking details to receive. We mitigate with lazy token creation (fire-and-forget from signup, blocking on first use) — see Wave 2 of the Phase 2 plan.
- Pro subscriptions stay blocked. This is not new (Stitch was also blocked) but this ADR makes "no subscriptions for now" an explicit architectural consequence rather than a temporary commercial workaround.
- Losing direct control of the clearance-buffer window (OQ-4) is a policy shift. Not a loss if Finance signs off that TradeSafe's escrow window is equivalent protection.

**Neutral.**

- Ledger stays provider-agnostic. `LedgerService.postTransactionGroup` does not know or care that the rail is TradeSafe rather than Stitch. The reconciliation engine's `checkPayoutsVsLedger` (already provider-aware via the `PayoutRail` enum from commit `0d141c2`) gains a TradeSafe branch mirroring the existing Stitch branch.
- AuditLog, kill switch, reconciliation engine, KB automation all continue to work unchanged. Only the audit-action names and the reconciliation data source change.
- Hard Rules 1-10 from `CLAUDE.md` all continue to apply. This ADR creates no exceptions.

## 10. References

**Implementation.**

- `apps/api/src/modules/tradesafe/tradesafe-graphql.client.ts` — transport layer, OAuth client-credentials, retry, mock mode.
- `apps/api/src/modules/tradesafe/tradesafe-graphql.operations.ts` — GraphQL mutations + queries + amount converters (`toZar` / `toCents`).
- `apps/api/src/modules/tradesafe/tradesafe.types.ts` — `TradeSafeApiError` + shared type exports.
- Commit `0687cb5` (2026-04-22) — Phase 1a: GraphQL client foundation + OAuth.
- Commit `fee3571` (2026-04-23) — Phase 1b: mutation helpers + live sandbox smoke.
- Commit `8ca5c57` (2026-04-22) — Stitch Pro-tier CTA gated behind `SUBSCRIPTION_UPGRADE_ENABLED=false` (context for this pivot).
- Commit `0d141c2` (2026-04-18) — `PayoutRail` enum + `StitchPayout.provider` column (R32 close; the reconciliation hook this ADR builds on).

**Prior ADRs.**

- ADR 0003 — TradeSafe Escrow Layer Out of Scope. **Superseded by this ADR.** The reinterpretation: TradeSafe is now the unified custody + rail layer, not an adjunct escrow layer alongside a platform reserve.
- ADR 0005 — Ledger idempotency via header table. Unchanged and applied to TradeSafe handlers.
- ADR 0006 — Compensating entries bypass kill switch. Scope preserved; TradeSafe handlers are not on the bypass list.
- ADR 0008 — TradeSafe for Hunter Payouts. **Extended by this ADR** from outbound-only to inbound + outbound.
- ADR 0009 — TradeSafe Integration Skeleton. Superseded on schema direction (Option B peer tables) in favour of the simpler `TradeSafeTransaction` + `TradeSafeAllocation` model described in §6 Phase 2. Referenced for the webhook / env-var / routing conventions, which this ADR inherits.
- ADR 0010 — Auto-refund on visibility failure. Unchanged; the auto-refund path will post compensating entries against TradeSafe-funded bounties the same way it does against Stitch-funded ones today.

**Canonical specs.**

- `CLAUDE.md` §4 — Financial Non-Negotiables. All ten honoured; see §3 of this ADR.
- `md-files/payment-gateway.md` — Stitch Express canonical spec. To be renamed / rewritten post-Phase-5 when Stitch is deleted. Use the historical document until then.
- `md-files/financial-architecture.md` — ledger mechanics + reconciliation engine. Provider-agnostic; unchanged.
- `md-files/knowledge-base.md` — KB schema + auto-flag rules. Unchanged; new TradeSafe-related recurrence categories (`tradesafe_webhook`, `tradesafe_token`) added as they surface.

**External.**

- TradeSafe GraphQL API — sandbox: `https://api-developer.tradesafe.dev/graphql`; production: `https://api.tradesafe.co.za/graphql`.
- TradeSafe OAuth — `https://auth.tradesafe.co.za/oauth/token` (client-credentials grant).
- TradeSafe docs — `https://docs.tradesafe.co.za/` (authoritative for API shape; webhook signature scheme is not documented — see §4).
