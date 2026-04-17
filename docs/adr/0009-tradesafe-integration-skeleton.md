# ADR 0009 — TradeSafe Integration Skeleton

**Status:** Proposed (2026-04-15)
**Implements:** ADR 0008 (TradeSafe for Hunter Payouts)
**Relates to:** ADR 0003 (TradeSafe Out of Scope — partially superseded)
**Type:** Skeleton / blueprint ADR — not an implementation plan

> This ADR is the architectural blueprint for a **future** TradeSafe integration
> workstream. It is not the integration itself. The user (and Team Lead) will
> accept, redirect, or shelve this proposal before any implementation ADR
> (ADR 0010) is written and before any code is written.

---

## 1. Context

ADR 0008 (2026-04-15) locked the decision that **TradeSafe**, South Africa's
longest-running digital escrow service, becomes the outbound hunter-payout rail
for Social Bounty. Stitch Express remains the inbound rail for brand bounty
funding. The driver for the switch away from Stitch-only was the
no-beneficiary-endpoint finding during Phase 2 live testing: Stitch Express
exposes no multi-recipient payout surface that fits the platform's reserve →
hunter flow, which forced `// TRADESAFE MIGRATION (ADR 0008):` markers onto
eight call sites in `apps/api/src/modules/payouts/` and the synthetic
`local:…` beneficiary-id workaround in `BeneficiaryService`. The workarounds
stand until the integration lands.

ADR 0008 deliberately left the *how* open. This ADR is the architectural
skeleton for that *how*: a minimum surface area of schema, env vars, routing,
auth, redirect, and webhook shape so an implementation agent can begin as soon
as TradeSafe sandbox credentials are issued. It does **not** attempt to
enumerate TradeSafe's API endpoints (because the sandbox docs are not yet
available to us) and it does **not** cover commercial onboarding. The purpose
here is to lock the *shape* of the integration so that downstream work —
ADR 0010 (concrete integration plan), the implementation PRs, and the Phase 2
live-test refresh — can slot in without re-litigating foundational choices.

---

## 2. Scope

### Proposes (in scope for this ADR)

- Schema direction for TradeSafe-side models (Option A vs Option B, with a
  recommendation and migration considerations).
- New environment variables the API and the frontend will read.
- New webhook and OAuth-callback route paths on the API.
- Frontend redirect page contract at `/settings/payouts`.
- Webhook-provider enum extension and router dispatch pattern.
- Clearance-window policy question (escrow vs our own 72h hold).
- Open questions list that blocks ADR 0010.
- Explicit list of things that do **not** change.
- Phase rollout skeleton (three phases).

### Defers (explicitly out of scope — belongs in ADR 0010 or later)

- **Commercial onboarding.** KYB, merchant agreement, bank-account verification
  with TradeSafe, and the legal contract review. That is a business track, not
  an engineering track.
- **Actual API endpoint catalogue.** We don't have sandbox credentials yet.
  Endpoint names, request/response shapes, OAuth flow details, idempotency-key
  header conventions, and error-code taxonomy will be captured in ADR 0010 once
  the sandbox lands.
- **Escrow-vs-release semantics.** TradeSafe's escrow model may collapse or
  extend our clearance window. This ADR flags the policy question; ADR 0010
  chooses.
- **Retry and reconciliation recipes for TradeSafe events.** The ledger
  recipes in `financial-architecture.md` are provider-agnostic; the TradeSafe
  event → ledger mapping is deferred to ADR 0010.
- **Fee recovery math.** Whether TradeSafe charges per-transaction, whether
  we recover that fee from the hunter, or whether it comes out of
  `global_fee_revenue`, is a finance policy call — deferred.

---

## 3. Schema changes

Two options were considered. Both preserve the ledger's provider-agnostic
stance (`LedgerEntry` does not care which provider moved the money).

### Option A — Peer tables (clean break)

Add new models alongside the existing ones:

- `TradeSafePayout` — TradeSafe's outbound leg.
- `TradeSafeBeneficiary` — TradeSafe-side hunter beneficiary record.

The existing `StitchPayout` and `StitchBeneficiary` tables are marked
**retired** (no new rows, data kept for history).

**Pros**

- No data migration. Zero risk to live Stitch inbound data.
- Provider-specific columns (TradeSafe may expose escrow-release ids, beneficiary
  KYC states, sub-account refs) are native first-class fields.
- Type safety: `Prisma.TradeSafePayoutCreateInput` is distinct from Stitch.

**Cons**

- Two models with ~80% overlapping fields. Any new provider (the third)
  triples the table count.
- The `StitchPayout` table holds no real data today (feature flag is off),
  so keeping it purely for "history" is dead weight.
- Call sites like `BeneficiaryService.findActiveForUser()` have to know which
  provider table to read, which pushes provider awareness up the stack.

### Option B — Provider-agnostic rename with discriminator (recommended)

Rename and generalise:

- `StitchPayout` → `ProviderPayout`, add `provider` discriminator column
  (enum: `STITCH`, `TRADESAFE`).
- `StitchBeneficiary` → `ProviderBeneficiary`, add `provider` discriminator
  column.
- Provider-specific external ids stored in existing columns
  (`externalPayoutId`, `externalBeneficiaryId`) — they are already opaque
  strings.
- Provider-specific optional fields (e.g. TradeSafe escrow-release id) stored
  in the existing `metadata Json?` column, with a shared Zod schema per
  provider.

**Pros**

- One table, clean provider discriminator. Matches the ledger's
  provider-agnostic shape.
- Third provider (if ever) costs zero new tables.
- `BeneficiaryService` takes `provider` as a parameter, rest of the code is
  uniform.
- `@@unique([provider, externalPayoutId])` gives correct idempotency across
  providers.

**Cons**

- Requires a migration against the existing `stitch_payouts` and
  `stitch_beneficiaries` tables. On current data volume (Phase 2 is not live;
  `PAYOUTS_ENABLED=false`) this is effectively cosmetic — near-zero production
  rows — but it is still a schema rename with `@@map` changes.
- Loses the synthetic-id workaround's current co-location with the
  Stitch-named model. The synthetic `local:…` beneficiaries move over as
  `provider=STITCH, externalBeneficiaryId="local:…"` rows, which is
  semantically cleaner anyway.
- Application code that reads `StitchPayout`/`StitchBeneficiary` by name
  (including the 8 `// TRADESAFE MIGRATION (ADR 0008):` call sites) has to be
  updated to the new model name.

### Recommendation

**Option B.** Provider-agnostic modelling matches the ledger's stance and
avoids the second provider's table doubling. The migration cost is small
because `PAYOUTS_ENABLED=false` means production has no real payout rows to
migrate. ADR 0010 can confirm the recommendation stands once sandbox
credentials surface any provider-specific columns we had not anticipated.

### Migration considerations (Option B)

- Rename `stitch_payouts` → `provider_payouts`, `stitch_beneficiaries` →
  `provider_beneficiaries` via Prisma migration.
- Backfill `provider = 'STITCH'` on all existing rows.
- Replace `StitchPayoutStatus` enum with `ProviderPayoutStatus`
  (value set unchanged initially; TradeSafe-specific states like
  `ESCROW_HELD` / `ESCROW_RELEASED` added as needed).
- Drop the Stitch-specific unique constraint on `externalPayoutId` (now
  `stitchPayoutId` column), replace with `@@unique([provider,
  externalPayoutId])`.
- Update the 8 `// TRADESAFE MIGRATION (ADR 0008):` call sites to reference
  the new model names — tracked as a bulk rename PR in the integration
  workstream.
- Keep the Prisma relation name `stitchBeneficiary` on `User` in a
  backwards-compat sense for one migration window, then rename to
  `providerBeneficiary` in a follow-up PR.

---

## 4. Environment variables

New variables, all with `TRADESAFE_` prefix, all added to `.env.example` (API
and web as relevant). All required in `ConfigService` schema; missing values
fail boot when `PAYOUTS_PROVIDER=TRADESAFE`.

| Variable | Purpose | Scope |
|---|---|---|
| `TRADESAFE_API_BASE` | Base URL for TradeSafe REST API (sandbox vs prod) | API |
| `TRADESAFE_CLIENT_ID` | OAuth/client credentials — client identifier | API |
| `TRADESAFE_CLIENT_SECRET` | OAuth/client credentials — secret | API |
| `TRADESAFE_WEBHOOK_SECRET` | HMAC/Svix-equivalent signing secret for inbound webhooks | API |
| `TRADESAFE_OAUTH_REDIRECT_URL` | Absolute URL for the OAuth callback route on this API | API |
| `TRADESAFE_SUCCESS_URL` | Frontend redirect on successful payout-account linking | API + web |
| `TRADESAFE_FAILURE_URL` | Frontend redirect on failed / cancelled linking | API + web |

Operational notes:

- Values must be different per environment (local / staging / production).
  Config-drift between environments is a Section 6 failure pattern — CI
  validates that all three are populated in the staging deploy plan before
  the rollout flag can flip.
- Secrets (`TRADESAFE_CLIENT_SECRET`, `TRADESAFE_WEBHOOK_SECRET`) are never
  committed, never logged, never surfaced to the frontend. Only
  `TRADESAFE_SUCCESS_URL` and `TRADESAFE_FAILURE_URL` cross the API/web
  boundary.
- A new `PAYOUTS_PROVIDER` flag (values: `STITCH` | `TRADESAFE`) gates which
  provider is active. During cutover, staging runs `TRADESAFE` while
  production stays on `STITCH` (disabled) until green reconciliation.

---

## 5. Routing

The API gains two new paths and the frontend gains a redirect-target page.
All three paths already exist in some form in the app — the integration wires
handlers, not new routes.

### API routes

- **`POST /api/v1/webhooks/tradesafe`** — Svix-equivalent webhook receiver.
  Validates signature header with `TRADESAFE_WEBHOOK_SECRET`, persists raw
  event to `WebhookEvent`, dispatches via `WebhookRouterService`. Returns
  `202 Accepted` on persistence, not on processing (idempotency + retry
  safety — Non-Negotiable #7).
- **`GET /api/v1/auth/tradesafe/callback`** — OAuth / account-linking
  callback. Exchanges the one-time code for a token, stores the token
  reference on the `ProviderBeneficiary` (Option B) or a new side table,
  audit-logs the link event, and 302-redirects to `TRADESAFE_SUCCESS_URL` or
  `TRADESAFE_FAILURE_URL`.

### Frontend redirect target

- **`/settings/payouts?status=success|error&reason=<code>`** — the page is
  the existing payout-account settings page. It reads `status` from the query
  string, shows a confirmation toast (success) or an error message
  (error + reason code), and refreshes the beneficiary state from the API.
  No new page is created; the page already exists and handles the current
  Stitch workflow, so the work is additive.

### Why these paths already exist

- `/api/v1/webhooks/{provider}` is a pattern — `stitch` handler lives
  there today, `tradesafe` is a sibling.
- `/api/v1/auth/{provider}/callback` matches the project's OAuth callback
  convention.
- `/settings/payouts` is the current beneficiary-management UI.

No new route conventions are introduced — only new provider instances of
existing conventions.

---

## 6. Webhook enum and router dispatch

### Enum extension

```
enum WebhookProvider {
  STITCH
  STRIPE     // legacy, retired — see ADR 0001
  TRADESAFE  // added by this ADR
}
```

Prisma migration is the enum-value addition only. `WebhookEvent.UNIQUE(provider,
externalEventId)` continues to enforce idempotency cross-provider — a TradeSafe
event id collision with a Stitch event id is impossible because they are
namespaced by the `provider` column.

### Router dispatch

`WebhookRouterService` gains a dispatch arm for `tradesafe.*` event types.
Shape TBD until sandbox docs are available, but the plausible minimum set is:

| Event family (TBD) | Likely ledger effect |
|---|---|
| `tradesafe.payout.created` | No ledger effect — confirms we sent it |
| `tradesafe.payout.escrow_held` | Mirror of our `payout_in_transit` posting |
| `tradesafe.payout.released` | Trigger release → `hunter_paid` |
| `tradesafe.payout.failed` | Compensating entry, retry path |
| `tradesafe.beneficiary.verified` | KYC status update on `ProviderBeneficiary` |

All event names, field shapes, and idempotency behaviour are **speculative**
until sandbox. ADR 0010 locks them.

### Signature verification

TradeSafe's signature scheme is unknown at time of writing. If Svix is used
(as Stitch does), the same `svix/webhooks` package is reused and the
`TRADESAFE_WEBHOOK_SECRET` is just another secret key. If TradeSafe uses a
proprietary HMAC scheme, a new verifier module is added under
`apps/api/src/modules/webhooks/verifiers/tradesafe.verifier.ts`. Either way
the `WebhookRouterService` interface is unchanged.

---

## 7. Clearance window impact (policy question)

**Current behaviour (Stitch model, Free tier):** ledger posts
`hunter_available → payout_in_transit` immediately on approval, then a 72h
clearance period elapses (chargeback buffer) before the money is actually
released to the hunter via the outbound rail. The 72h wait is a policy choice
in our ledger, not a gateway constraint.

**TradeSafe model:** funds move into TradeSafe-held escrow at the moment the
payout instruction is created. TradeSafe holds the funds until we (the
platform) call the release endpoint, at which point TradeSafe disburses to the
hunter's bank account. That release call is ours to trigger.

This creates two valid policy options, and this ADR does **not** pick one —
it flags the question.

### Option (a) — Keep 72h clearance in our ledger; release from escrow at the mark

- Post `hunter_available → payout_in_transit` on approval.
- Call TradeSafe `initiate escrow` at the same moment (funds leave reserve
  into TradeSafe's float).
- After 72h, call TradeSafe `release to beneficiary` — ledger posts
  `payout_in_transit → hunter_paid`.
- Pro: Our chargeback buffer policy is unchanged. The ledger and the business
  rule stay decoupled from the provider's semantics.
- Con: Money is in TradeSafe's float for 72h — the ledger must reflect this
  as an external asset (possibly a `tradesafe_escrow` account, see
  ADR 0003 shape) rather than pretending it is still in `brand_reserve`.

### Option (b) — Skip our clearance, rely on TradeSafe's escrow for the hold

- Post and initiate at the same moment.
- `release to beneficiary` is called immediately; TradeSafe's own escrow
  mechanism provides the hold window.
- Pro: Simpler ledger. Fewer moving parts. TradeSafe's escrow is the hold.
- Con: The 72h buffer is a policy-shaped chargeback-risk control that Stitch
  does not have and TradeSafe's default escrow window may not match. Losing
  control of the window is a regulatory and finance-team conversation.

**Recommendation:** defer. This is a finance-policy decision, not an
architecture decision. It depends on TradeSafe's default escrow dwell time,
its release SLAs, and the Finance team's stance on chargeback-buffer
ownership. ADR 0010 makes the call after sandbox testing.

---

## 8. Open questions

These block ADR 0010 from being written. They are the pre-sandbox unknowns.

1. **Commercial onboarding timeline.** KYB turnaround, merchant-agreement
   review time, sandbox credential ETA. Owned by business, not engineering,
   but engineering sequencing depends on it.
2. **API surface documentation.** We need the full TradeSafe API reference to
   write ADR 0010. Current understanding is inferential from the
   `md-files/payment-gateway-review.docx` summary.
3. **Per-transaction escrow release semantics.** Does TradeSafe require an
   explicit `release` call per transaction, or can we batch releases? Per-
   transaction changes the scheduler loop shape. Batch changes reconciliation.
4. **Dispute-resolution flow.** TradeSafe is escrow. Disputes likely have an
   additional layer beyond our internal review flow — a TradeSafe-mediated
   freeze, a sub-account the funds sit in, and a resolution webhook. This
   interacts with our existing `SubmissionStatus` state machine and needs
   explicit mapping.
5. **Reporting endpoint for reconciliation matching.** Our reconciliation
   engine (see `financial-architecture.md`) matches provider records against
   our ledger daily. TradeSafe must expose a settlements / transactions
   report endpoint with filter-by-date-range; confirmation needed.
6. **Sandbox credentials.** Who issues, how long the sandbox account lives,
   whether it supports multi-beneficiary testing, and whether test bank
   accounts are stubbed or require real SA bank details.
7. **Fee model.** TradeSafe's per-transaction fee, any monthly minimum, and
   how the platform fee recovery interacts with our 3.5% global fee
   (Non-Negotiable #10). This is a finance question that feeds back into the
   schema — if fees are on every payout, we need a `providerFeeCents` column.
8. **Webhook delivery guarantees.** At-least-once vs exactly-once, retry
   cadence, dead-letter behaviour, signature scheme (Svix-style or custom
   HMAC). Determines whether we can reuse the Stitch webhook verifier.

---

## 9. What does NOT change

The provider-agnostic core of the platform is unaffected. Specifically:

- **LedgerService.** `postTransactionGroup` is provider-unaware. All existing
  ledger recipes (brand funding → reserve, reserve → available, available →
  in-transit, in-transit → paid) continue to work untouched.
- **AuditLog.** Every payout mutation still hits the audit log (Hard Rule #3,
  Non-Negotiable #6). No schema change.
- **Kill Switch.** `PAYOUTS_ENABLED=false` still halts all outbound movement
  regardless of provider. `FinancialKillSwitch` is a top-level guard, not a
  provider-level one.
- **Reconciliation engine.** The engine matches ledger entries to provider
  settlement records; TradeSafe becomes another settlement source. No
  structural change, only a new adapter.
- **KB automation.** Auto-entry triggers (Section 9 of CLAUDE.md) fire on
  ledger-imbalance and reconciliation-mismatch regardless of the provider
  that caused it.
- **Canonical accounts.** `hunter_available`, `payout_in_transit`,
  `hunter_paid`, `payout_fee_recovery`, `bank_charges`,
  `global_fee_revenue` are all unchanged. A new account
  `tradesafe_escrow` may be added (depending on Section 7's resolution); that
  is the only expected additive change.
- **Fees recipe.** Tier admin fee, tier commission, and the 3.5% global
  platform fee (Non-Negotiable #10) are unchanged. `global_fee_revenue` is
  still calculated independently.
- **Hard Rules 1–10.** All 10 financial non-negotiables continue to apply.
  This ADR creates no exceptions.
- **Inbound (Stitch Express) path.** Brand → hosted checkout → platform
  reserve flow is untouched. It is live, tested, and remains so.
- **User-facing submission / review / approval flow.** Participants and
  Business Admins see no change until payouts are enabled in production.

---

## 10. Rollout plan (skeleton)

Three phases, gated, no concurrent work with existing Stitch inbound.

### Phase 1 — ADR 0010 (concrete integration plan)

- **Trigger:** TradeSafe sandbox credentials issued.
- **Output:** ADR 0010 with: API endpoint catalogue, webhook event shapes,
  clearance-window policy decision (Section 7), ledger-recipe updates,
  Option B migration SQL, revised state diagram.
- **Not code.** Purely architecture lock-in based on the sandbox reality.
- **Gate to Phase 2:** Team Lead acceptance of ADR 0010.

### Phase 2 — Implementation workstream

- **Duration estimate:** 5–7 working days (architect + backend + QA).
- **Work blocks:**
  - Day 1: Option B migration, `WebhookProvider.TRADESAFE` enum, env var
    wiring, config schema.
  - Day 2: TradeSafeClient service, OAuth callback route, webhook route
    skeleton, signature verifier.
  - Day 3: `BeneficiaryService` generalisation, the 8 `// TRADESAFE
    MIGRATION (ADR 0008):` sites updated, synthetic-id workaround removed.
  - Day 4: Payout scheduler extension (release-to-beneficiary step per
    Section 7's chosen option), ledger recipe updates.
  - Day 5: Unit tests (happy path, duplicate retry, partial-failure rollback,
    webhook replay — Section 5 of CLAUDE.md).
  - Day 6–7: Integration tests, reconciliation adapter, staging deploy,
    sandbox live-fire test (real escrow, test beneficiaries).
- **Gate to Phase 3:** Staging reconciliation runs green for 24h.

### Phase 3 — Cutover

- **Trigger:** Phase 2 gate met + 2 consecutive green reconciliation runs in
  staging.
- **Steps:**
  - Enable `PAYOUTS_PROVIDER=TRADESAFE` in production config.
  - Flip `PAYOUTS_ENABLED=true` via the Kill Switch admin panel (audit-logged).
  - Monitor first 48h of production payouts at 1-per-hour rate-limited rollout.
  - Full throughput only after 48h green.
- **Rollback:** `PAYOUTS_ENABLED=false` instantly halts outbound. Kill Switch
  covers this case — no TradeSafe-specific rollback mechanism is needed.

---

## References

- ADR 0003 (TradeSafe Out of Scope) — partially superseded by ADR 0008;
  the "out of scope" status applies only to the escrow-layer-beside-Stitch
  interpretation, which remains deferred.
- ADR 0008 (TradeSafe for Hunter Payouts) — the decision this ADR implements.
- `md-files/payment-gateway.md` — canonical Stitch Express spec. Unchanged.
- `md-files/financial-architecture.md` — ledger mechanics, idempotency
  patterns, reconciliation engine. Unchanged.
- `md-files/knowledge-base.md` — KB entry template, failure-pattern library.
- `md-files/implementation-phases.md` — Phase 1–4 delivery plan; this ADR
  slots into the Phase 2→3 boundary as a bolt-on workstream.
- `md-files/payment-gateway-review.docx` (2026-04-09) — original TradeSafe
  recommendation.
- TradeSafe public materials — to be catalogued in ADR 0010.
