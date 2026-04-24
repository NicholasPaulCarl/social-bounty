# Plan: Delete Stitch + Stripe + Peach, ship TradeSafe Phase 3 inbound cutover

**Request:** Remove all non-TradeSafe payment gateway code. Fix the bug where clicking "go live" on a draft bounty redirects to Stitch (which has declined our account). Route bounty funding through TradeSafe instead.

**Reality check confirmed:** Stitch declined the merchant account — we will never use Stitch. Three dead providers in the codebase: Stitch (active but rejected), Stripe (legacy per ADR 0001), Peach Payments (superseded per ADR 0007). All three get deleted.

**TradeSafe status:** Production OAuth creds not yet issued (R24 open). Code will run in TradeSafe mock mode in prod until creds arrive. User accepts this tradeoff in exchange for killing all Stitch code.

**Lead:** dev-team-lead (senior dev / architect / PO / PM)

---

## 1. Inventory (from fast scan)

**Stitch surface:** 3,099 matches across 219 files. Active code in:
- `apps/api/src/modules/stitch/` (entire module)
- `apps/api/src/modules/payments/stitch-payments.service.{ts,spec.ts}`
- `apps/api/src/modules/payments/payments.controller.ts` (lines 31-68 Stitch, 70-94 Stripe legacy)
- `apps/api/src/modules/webhooks/stitch-webhook.controller.{ts,spec.ts}` + `stitch-webhook.replay-rbac.spec.ts`
- `apps/api/src/modules/webhooks/svix.verifier.{ts,spec.ts}` (only Stitch uses Svix)
- `apps/api/src/modules/subscriptions/upgrade.service.{ts,spec.ts}` (Stitch-only)
- `apps/api/src/modules/payouts/stitch-payout.adapter.{ts,spec.ts}`
- `apps/api/src/modules/reconciliation/` — `checkStitchVsLedger` + Stitch-specific checks
- `apps/api/src/modules/refunds/` — 33 Stitch refs in `refunds.service.ts`
- `apps/api/src/modules/webhooks/webhook-router.service.ts` + `webhook-router.upgrade.spec.ts`
- Prisma: `StitchPaymentLink`, `StitchPayout`, `StitchBeneficiary`, `StitchSubscription` models + related enums
- Frontend: `apps/web/src/lib/utils/redirect-to-hosted-checkout.ts` (explicitly Stitch-named), `lib/api/bounties.ts`, `lib/api/subscriptions.ts`, `hooks/useSubscription.ts`, subscription upgrade UI in `/business/brands/subscription` and `/settings/subscription`
- Env: `STITCH_*` vars in `env.validation.ts`, `render.yaml`, `.env.example`
- Docs: `md-files/payment-gateway.md` (canonical Stitch spec), `docs/STITCH-IMPLEMENTATION-STATUS.md`, `docs/deployment/stitch-express-live-readiness.md`, ADRs 0004, 0007, 0010

**Stripe surface:** smaller but present:
- `apps/api/src/modules/payments/payments.service.ts` + `.spec.ts` (Stripe-only service)
- `apps/api/src/modules/payments/payments.controller.ts:70-94` (`createPaymentIntent` + `handleWebhook`)
- Frontend: link-validator util has Stripe URL pattern (keep — generic URL validation)
- ADR 0001 "Stripe Retirement Timing"

**Peach Payments surface:** already mostly dead:
- ADR 0007 "Peach Payments for Hunter Payouts" (superseded by 0008/0011)
- Historical comments only in source (8 sites: `TRADESAFE MIGRATION (ADR 0008)`)

**TradeSafe Phase 1-2 (already built):**
- `apps/api/src/modules/tradesafe/tradesafe-graphql.client.ts` — OAuth + `transactionCreate` + `checkoutLink` + `allocation*` methods
- `apps/api/src/modules/tradesafe/tradesafe-token.service.ts` — idempotent user-level token provisioning
- `apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts` — handles `beneficiary.linked`, `payout.settled`, `payout.failed` (needs extension for `FUNDS_RECEIVED`)
- `apps/api/src/modules/tradesafe/tradesafe-transaction-callback.controller.ts` — URL-path-secret webhook
- `apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts` — Svix-style legacy route (evaluate for deletion)
- Prisma: `TradeSafeTransaction`, `TradeSafeAllocation` models; migration `20260424152555_tradesafe_schema`
- Env: `TRADESAFE_*` vars validated in `env.validation.ts`

**Other providers to verify don't exist:** Paystack, PayFast, Ozow — scan returned 3 files but all are legit TradeSafe payment-method references, not standalone integrations.

**Existing subagent types:** `Explore`, `general-purpose`, `Plan`. Project convention (CLAUDE.md Hard Rule #8) is tool-level `general-purpose` agents briefed with `md-files/agents/` playbooks + `DevTradeSafe` skill for domain context.

**Isolation:** Every wave-1 agent runs in a separate git worktree so deletions + scaffolding don't conflict on shared module files. Cherry-pick pattern from Phase 2 follow-ups.

---

## 2. Scope

### Goals (this session)

- **G1.** Delete the entire Stitch integration — client, payments service, webhook controller, Svix verifier, subscription upgrade service, payout adapter, Prisma models, env vars, docs, tests. Zero Stitch references in `apps/`, `packages/`, or `.env*`.
- **G2.** Delete Stripe legacy — `PaymentsService`, `createPaymentIntent` endpoint, `handleWebhook` endpoint, associated tests. Keep generic Stripe-URL recognition in link-validator (Stripe URLs are still valid target URLs for social-handle links; that's unrelated to us accepting Stripe payments).
- **G3.** Delete Peach Payments references — archive ADR 0007, clean up `TRADESAFE MIGRATION (ADR 0008)` comments.
- **G4.** Build TradeSafe Phase 3 inbound cutover — new `TradeSafePaymentsService` with `fundBounty` method that creates a TradeSafe transaction, allocates per ADR 0011 fee mapping (20% hunter commission / 15% brand admin fee / 5% transaction fee), returns `checkoutLink` hosted URL. Wire into `payments.controller.ts`.
- **G5.** Extend TradeSafe webhook handler to process `FUNDS_RECEIVED` events — posts the `bounty_funded` ledger group (idempotent via existing `UNIQUE(referenceId, actionType)`), flips `Bounty.status: DRAFT → LIVE` and `paymentStatus: PENDING → PAID`.
- **G6.** Replace frontend Stitch bits — rename `redirect-to-hosted-checkout.ts` to `redirect-to-tradesafe-checkout.ts` (or drop provider branding entirely), update session-storage key from `stitchFundingBountyId` to `tradesafeFundingBountyId`, update `/business/bounties/funded` return page to read TradeSafe return params.
- **G7.** Subscription upgrade UI stays as "coming soon" placeholder (no change to user-facing message), but the backend upgrade service gets deleted. Tier lifecycle (cancel, downgrade, grace period) stays — it's provider-agnostic.
- **G8.** Prisma destructive migration — drop `stitch_payment_links`, `stitch_payouts`, `stitch_beneficiaries`, `stitch_subscriptions` tables + related enums. Idempotent via `IF EXISTS` guards per batch 13A pattern.
- **G9.** Config sweep — drop `STITCH_*` + `SUBSCRIPTION_UPGRADE_ENABLED` + `PAYMENTS_PROVIDER` env vars everywhere (`env.validation.ts`, `render.yaml`, `.env.example`). TradeSafe becomes the sole rail, no feature flag needed.
- **G10.** Docs sweep — delete `md-files/payment-gateway.md` (Stitch-canonical, superseded by ADR 0011), delete `docs/STITCH-IMPLEMENTATION-STATUS.md`, delete `docs/deployment/stitch-express-live-readiness.md`, update `CLAUDE.md` references, mark ADRs 0001/0004/0007 as "Superseded by 0011", refresh `md-files/financial-architecture.md`.

### Non-goals (explicitly deferred)

- **Phase 4 outbound cutover** — hooking submission approval into `allocationAcceptDelivery`. The TradeSafe payout adapter already exists (`payouts/tradesafe-payout.adapter.ts`) and the `payout-provider.factory.ts` can route outbound through it. Actual cutover (delete `stitch-payout.adapter.ts`, make TradeSafe the only adapter) happens in this session **as part of G1** (Stitch adapter deletion). The submission-approval → auto-release trigger wiring stays a future session.
- **Reconciliation engine extensions** — the existing reconciliation service covers both rails per R32 (closed). No new checks needed; just drop Stitch-side ones.
- **Dispute flow migration** — disputes module references Stitch for dispute evidence. Leave until disputes come up in a real flow.
- **Real TradeSafe prod smoke test** — we ship the code; we cannot smoke-test without TradeSafe issuing prod OAuth creds (R24 still open). Mock-mode sandbox smoke is the acceptance bar for this session.
- **Rebuild subscription upgrade on another rail** — the "coming soon" UI stays. If we want Pro subscriptions eventually, we'll pick a rail (Paystack? Yoco? Peach has subscriptions but their API is a museum piece) and build fresh. Not in this session.

### Acceptance criteria

- [ ] `grep -rni "stitch" apps/ packages/ docs/ md-files/ 2>/dev/null | grep -v "graphify-out\|node_modules\|archive" | wc -l` returns **0** (excluding the `.claude/skills/DevStitchPayments` skill, which is an Anthropic-side skill definition, and archived docs).
- [ ] `grep -rni "stripe" apps/ packages/ 2>/dev/null | grep -v "stripe\.com\|checkout\.stripe\|paystack\|graphify-out\|node_modules" | wc -l` returns **0** (generic Stripe-URL regex in link-validator is the only allowed match).
- [ ] `apps/api/src/modules/payments/payments.controller.ts` has exactly two endpoints: `POST bounties/:id/fund` (TradeSafe) and `GET payments/funding-status` (TradeSafe). No `stripe`, no `stitch` in imports.
- [ ] `TradeSafePaymentsService.createBountyFunding` exists at `apps/api/src/modules/tradesafe/tradesafe-payments.service.ts`, has ≥5 tests (happy path, KYB gate, kill-switch abort, existing link resumption, idempotency). Uses `TradeSafeGraphQLClient.transactionCreate` + `.checkoutLink`.
- [ ] TradeSafe webhook handler (`tradesafe-webhook.handler.ts`) has a `handleFundsReceived(payload)` method that posts the `bounty_funded` ledger group. 5-test matrix per ADR 0011 §Webhooks: happy path × retry idempotent × partial rollback × replay × concurrent writer = 5 tests minimum.
- [ ] Prisma migration `20260424XXXXXX_drop_stitch_tables/migration.sql` exists, idempotent (`DROP TABLE IF EXISTS`), applied cleanly to a fresh Postgres.
- [ ] `.env.example` has no `STITCH_*`, no `STRIPE_*`, no `PAYMENTS_PROVIDER`, no `SUBSCRIPTION_UPGRADE_ENABLED` keys. `render.yaml` matches.
- [ ] Clicking "Go live" on a DRAFT bounty in the UI redirects to a URL on a TradeSafe domain (mock mode: `http://mock-tradesafe.local/checkout/...` sandbox URL; real mode: `https://sandbox.tradesafe.co.za/...` or equivalent). No `stitch.money` in the redirect target.
- [ ] `npm test --workspace=apps/api && npm test --workspace=apps/web` green. Any test that was purely Stitch-driven is deleted, not stub-retained. Hard Rule #4 (100% test pass).
- [ ] `CLAUDE.md` `Current Implementation Status` section updated: Stitch marked as removed, TradeSafe inbound Phase 3 shipped, R24 remains open (no prod creds).

---

## 3. Plan (waves)

### Wave 1 — Parallel (5 agents, each on an isolated git worktree)

Every item is dispatched in a single tool-use block. Each agent clones the repo into its own worktree so deletions + new files don't conflict. Integration happens in serial cherry-pick after all return.

#### 1A — Backend swap (big agent)

**Subagent:** `general-purpose`
**Isolation:** worktree
**Effort:** L
**Inputs:**
- Full repo read access
- `DevTradeSafe` skill for TradeSafe API reference
- `md-files/agents/agent-backend.md` playbook
- `docs/adr/0011-tradesafe-unified-rail.md` for fee mapping
- `apps/api/src/modules/payments/stitch-payments.service.ts` as the template for what TradeSafe payments service must do (mirror the KYB gate, kill-switch check, existing-link resumption, idempotency logic)

**Deletions:**
- `apps/api/src/modules/stitch/` (entire directory)
- `apps/api/src/modules/payments/stitch-payments.service.{ts,spec.ts}`
- `apps/api/src/modules/payments/payments.service.{ts,spec.ts}` (Stripe legacy)
- `apps/api/src/modules/webhooks/stitch-webhook.controller.{ts,spec.ts}`
- `apps/api/src/modules/webhooks/stitch-webhook.replay-rbac.spec.ts`
- `apps/api/src/modules/webhooks/svix.verifier.{ts,spec.ts}`
- `apps/api/src/modules/webhooks/webhook-router.upgrade.spec.ts`
- `apps/api/src/modules/subscriptions/upgrade.service.{ts,spec.ts}`
- `apps/api/src/modules/payouts/stitch-payout.adapter.{ts,spec.ts}`
- Update `webhooks.module.ts`, `payments.module.ts`, `subscriptions.module.ts`, `payouts.module.ts`, `app.module.ts` to drop deleted providers

**Additions:**
- `apps/api/src/modules/tradesafe/tradesafe-payments.service.ts` — mirrors `StitchPaymentsService` shape but uses `TradeSafeGraphQLClient.transactionCreate` + `.checkoutLink`. Fee allocation per ADR 0011 (hunter 80% after 20% commission, brand admin 15%, platform transaction fee 5%). Returns `{ hostedUrl, transactionId, amountCents, ... }`.
- `apps/api/src/modules/tradesafe/tradesafe-payments.service.spec.ts` — 5 tests minimum (happy path, KYB gate rejection, kill-switch abort, existing-transaction resumption, idempotency on retry).
- Extend `apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts` with `handleFundsReceived(payload)` method. Posts `bounty_funded` ledger group via `LedgerService.postTransactionGroup`. Uses existing `UNIQUE(referenceId, actionType)` idempotency. 5-test matrix added to `tradesafe-webhook.handler.funds-received.spec.ts`.
- Update `apps/api/src/modules/payments/payments.controller.ts` — single `fundBounty` endpoint calls `TradeSafePaymentsService`; drop all Stripe endpoints.
- Update `apps/api/src/modules/reconciliation/reconciliation.service.ts` — drop `checkStitchVsLedger`, rename `checkPayoutsVsLedger` accordingly (may already be done per R32).
- Update `apps/api/src/modules/refunds/refunds.service.ts` — swap Stitch refund calls to TradeSafe `transactionCancel` or equivalent. (Refund flow may already be decoupled via ledger compensating entries — check `refund-after-payout.spec.ts` before rewriting.)

**Acceptance check:**
- `rg -i "stitch|svix" apps/api/src/` returns 0 lines
- `rg -i "stripe" apps/api/src/ | grep -v "stripe\.com"` returns 0 lines
- `npm test --workspace=apps/api` green (expected count: ~1300 tests, down from 1651 after deleting Stitch specs)
- `TradeSafePaymentsService.createBountyFunding` exists + spec has ≥5 tests
- Webhook handler spec for `handleFundsReceived` has 5-test matrix

---

#### 1B — Schema migration

**Subagent:** `general-purpose`
**Isolation:** worktree
**Effort:** S
**Inputs:**
- `packages/prisma/schema.prisma` (delete Stitch models + enums)
- `packages/prisma/migrations/20260415143053_stitch_express/migration.sql` as reference for what objects exist
- Batch 13A migration pattern (idempotent `IF EXISTS` / `IF NOT EXISTS`)

**Outputs:**
- `packages/prisma/migrations/20260424XXXXXX_drop_stitch_tables/migration.sql` — drops `stitch_payment_links`, `stitch_payouts`, `stitch_beneficiaries`, `stitch_subscriptions` tables, related enums (`StitchPaymentLinkStatus`, `StitchPayoutStatus`, etc.), and the `PayoutRail.STITCH` enum value (keep enum but drop value).
- Updated `packages/prisma/schema.prisma` with Stitch models removed, relation fields on User/Bounty/SubscriptionPayment cleaned up.

**Acceptance check:**
- `prisma migrate deploy` against a fresh Postgres completes cleanly
- `prisma validate` green
- No relation errors after schema regeneration (i.e., `Bounty.stitchPaymentLinks[]` etc. are removed, nothing still references the dropped models)

---

#### 1C — Frontend swap

**Subagent:** `general-purpose`
**Isolation:** worktree
**Effort:** M
**Inputs:**
- `md-files/agents/agent-frontend.md` playbook
- `apps/web/src/styles/design-system/` for DS compliance on any UI touches

**Edits:**
- Rename `apps/web/src/lib/utils/redirect-to-hosted-checkout.ts` → `redirect-to-checkout.ts` (drop provider branding entirely).
- Change `sessionStorage.setItem('stitchFundingBountyId', ...)` → `'fundingBountyId'`.
- Remove all Stitch references from comments + imports.
- Update `apps/web/src/app/business/bounties/funded/page.tsx` — drop `stitchPaymentId` query-param parsing; TradeSafe return flow uses `bountyId` query or sessionStorage only.
- Update `apps/web/src/lib/api/bounties.ts` — `fundBounty()` unchanged signature, but response shape uses TradeSafe field names (`hostedUrl`, `transactionId`).
- Delete `apps/web/src/lib/api/subscriptions.ts` `upgrade()` function (dead call).
- Update `apps/web/src/hooks/useSubscription.ts` — drop any upgrade-specific hooks.
- Update `apps/web/src/app/business/brands/subscription/page.tsx` + `apps/web/src/app/(participant)/settings/subscription/page.tsx` — already have `LIVE_UPGRADE_ENABLED=false` "coming soon" placeholder; ensure the code path doesn't import deleted `upgrade.service` types.
- Delete `apps/web/src/lib/api/__tests__/subscriptions-upgrade.test.ts`.
- Update `apps/web/src/hooks/useFinanceAdmin.ts`, `useAdmin.ts`, `useBounties.ts`, `usePayouts.ts` — drop Stitch-named fields from DTO types.

**Acceptance check:**
- `rg -i "stitch" apps/web/src/` returns 0 lines
- `rg -i "stripe" apps/web/src/ | grep -v "stripe\.com"` returns 0 lines
- `npm test --workspace=apps/web` green (expect 304 → ~280 after deleting upgrade tests)
- `next build --no-lint` clean

---

#### 1D — Config + deployment cleanup

**Subagent:** `general-purpose`
**Isolation:** worktree
**Effort:** S
**Inputs:**
- `apps/api/src/common/config/env.validation.ts`
- `render.yaml`
- `.env.example`

**Edits:**
- `env.validation.ts` — delete all `STITCH_*` validators, `STRIPE_*` (if any), `SUBSCRIPTION_UPGRADE_ENABLED`, `PAYMENTS_PROVIDER`. `TRADESAFE_MOCK` default becomes `false` (real mode). `TRADESAFE_CLIENT_ID` / `CLIENT_SECRET` become required when `PAYOUTS_ENABLED=true` OR general boot (decide based on whether inbound can gracefully mock without creds — yes it can, so keep `@IsOptional()` + mock fallback).
- `env.validation.spec.ts` — update tests to match.
- `render.yaml` — delete Stitch env var entries, delete `SUBSCRIPTION_UPGRADE_ENABLED`, delete `PAYMENTS_PROVIDER`. Keep TradeSafe entries, flip `TRADESAFE_MOCK: "true"` until prod creds arrive (makes mock mode explicit in prod until R24 closes).
- `.env.example` — mirror `render.yaml` changes; delete Stitch section, add note near TradeSafe section: "Set TRADESAFE_CLIENT_ID + SECRET once TradeSafe issues prod OAuth creds; until then TRADESAFE_MOCK=true keeps the adapter in mock mode."

**Acceptance check:**
- `grep -i "stitch\|stripe\|PAYMENTS_PROVIDER\|SUBSCRIPTION_UPGRADE_ENABLED" render.yaml .env.example apps/api/src/common/config/` returns 0 lines
- `npm test -- env.validation` green

---

#### 1E — Docs sweep

**Subagent:** `general-purpose`
**Isolation:** worktree
**Effort:** M
**Inputs:**
- All `docs/` and `md-files/`
- `CLAUDE.md`

**Deletions:**
- `md-files/payment-gateway.md` (Stitch-canonical spec; superseded by ADR 0011)
- `docs/STITCH-IMPLEMENTATION-STATUS.md`
- `docs/deployment/stitch-express-live-readiness.md`

**Edits:**
- `CLAUDE.md` — "Current Implementation Status" section: strike Stitch references, add "**Stitch + Stripe + Peach removed (YYYY-MM-DD)** — single-rail TradeSafe architecture. Bounty funding routes through `TradeSafePaymentsService.createBountyFunding`. R24 (prod OAuth creds) remains the only blocker to real-money flow."
- `CLAUDE.md` "Financial Non-Negotiables" — change "Payment provider: **Stitch Express**" to "Payment provider: **TradeSafe** (inbound + outbound unified rail per ADR 0011)". Update the reference to `md-files/payment-gateway.md` (now deleted) → point to ADR 0011.
- `md-files/financial-architecture.md` — find-replace Stitch-specific mechanics with TradeSafe equivalents (webhook verification via URL-path secret, not Svix HMAC).
- `md-files/implementation-phases.md`, `md-files/SPRINT-PLAN.md`, `md-files/admin-dashboard.md`, `md-files/knowledge-base.md` — s/Stitch/TradeSafe/ where current-state, leave historical where it describes past decisions.
- Archive old ADRs with superseded markers (do NOT delete the ADR files; the history matters):
  - ADR 0001 (Stripe Retirement) — add banner "**Superseded 2026-04-24 by actual deletion of Stripe code.**"
  - ADR 0004 (Feature Flag Inventory for Stitch Rollout) — add banner "**Superseded 2026-04-24 — Stitch removed entirely; all Stitch flags deleted.**"
  - ADR 0007 (Peach Payments for Hunter Payouts) — was already superseded by 0008.
  - ADR 0002, 0003, 0005, 0006 — keep as-is, they're provider-agnostic or already accurate.
- Update `docs/deployment/go-live-checklist.md` + `docs/deployment/render-deploy.md` + `docs/deployment/tradesafe-live-readiness.md` to reflect the single-rail state.
- Update `docs/INCIDENT-RESPONSE.md` — Stitch payment-provider contact refs swap to TradeSafe.
- Update `docs/architecture/sitemap.md`, `docs/adr/` index — cross-references.

**Acceptance check:**
- `rg -ni "stitch" docs/ md-files/ CLAUDE.md | grep -v "archive\|Superseded\|historical"` returns 0 lines
- `rg -ni "stripe" docs/ md-files/ | grep -v "ADR 0001\|Superseded\|historical"` returns 0 lines
- `CLAUDE.md` no longer says "Payment provider: **Stitch Express**"

---

### Wave 2 — Integration + verification (serial, after all Wave 1 agents return)

**Me (main agent):**
1. Cherry-pick the 5 worktree branches onto main in the order: 1B (schema) → 1D (config) → 1A (backend) → 1C (frontend) → 1E (docs). This order resolves any staged import ordering issues naturally (schema exists before backend types reference it, config before validation fails).
2. Resolve merge conflicts — expected surfaces: module files (`payments.module.ts`, `webhooks.module.ts`) where 1A + some 1C hooks might overlap, and `CLAUDE.md` where 1D + 1E both edit.
3. Run `npm test --workspaces` — expected count drops from 1651 to ~1280 (–371 Stitch/Stripe tests). Hard Rule #4 holds: 100% pass of remaining suites.
4. Run `next build --no-lint` in `apps/web/` — must be green.
5. Run `prisma migrate deploy` against a fresh local Postgres — must apply cleanly.
6. Restart local API + web, manually click "Go Live" on a DRAFT bounty, confirm redirect goes to a TradeSafe URL (mock mode: fake-checkout URL; real mode: sandbox.tradesafe.co.za). Confirm session-storage uses `fundingBountyId`, not `stitchFundingBountyId`.
7. Trigger a mock `FUNDS_RECEIVED` callback via curl against `/api/v1/webhooks/tradesafe/:secret`, confirm the bounty flips to `LIVE` + `PAID` and the ledger group posts.
8. Graphify refresh — the rebuild is automatic via post-commit hook, but run `graphify update .` once manually since 5 commits' worth of file deletions/moves may shift god-node rankings.
9. Commit as a single feature branch, open a PR.

**Acceptance check:** all boxes in §2 checked.

---

## 4. Risk / open questions

### Risks

- **TradeSafe prod creds unresolved (R24).** Mock-mode funding returns fake checkout URLs until creds arrive. No real payment can flow for the gap window. User has accepted this tradeoff.
- **Subscription upgrade permanently removed.** If we want Pro subscriptions later, we'll rebuild on a new rail. The "coming soon" placeholder ships with no backend wired.
- **Destructive migration on prod.** Dropping 4 Stitch tables. Per CLAUDE.md there are no real Stitch transactions in prod (the account was rejected), so data loss is nominal. Still: migration must be idempotent (`IF EXISTS`) so retries are safe, and we verify on staging Supabase first.
- **Refund flow coupling.** `refunds.service.ts` has 33 Stitch refs. Need to verify during 1A whether refund logic is purely ledger-driven (compensating entries per ADR 0005/0006) or if it actually calls Stitch API. If it's ledger-only, the Stitch refs are cosmetic string labels — easy sweep. If it calls Stitch API endpoints, 1A has more work (port to TradeSafe `transactionCancel`).
- **Svix verifier deletion.** If any other webhook integration uses Svix, we can't delete it. Scan says no — only Stitch uses Svix. Double-check in 1A.
- **Docker build breakage.** The Dockerfile references `prisma migrate deploy`. Destructive migration still runs cleanly, but Render's `preDeployCommand` must complete before serving traffic. Verified in Wave 2 step 5.

### Open questions (ask before dispatch if any answer surprises)

1. **KYB gate on TradeSafe.** The current `StitchPaymentsService.createBountyFunding` has a KYB check (line ~100). Does TradeSafe verify seller KYB on its side (meaning our code can drop the check), or do we still gate client-side? Default assumption: keep the gate, mirror the Stitch logic. If TradeSafe does its own verification, we can simplify — but that's a minor refactor, not a session blocker.
2. **`PayoutRail.STITCH` enum value.** Migration `20260418010000_add_payout_provider_rail` introduced this. If we remove the enum VALUE but keep existing rows that reference it, they break. Default: delete the value + do a conversion (`UPDATE stitch_payouts SET provider = 'TRADESAFE'` is moot because we're dropping the whole table anyway). Leave enum in place with only `TRADESAFE` value.
3. **Graphify enrichments.** Deleting ~30 spec files + 4 service files will shift the top-50 node degree rankings. The wiki files under `graphify-out/wiki/nodes/` may now reference deleted nodes. Not a blocker — they'll regenerate on next rebuild, just with different top-50 set.

---

## 5. Dispatch plan (when approved)

Single tool-use block with 5 parallel `Agent` calls, all `isolation: "worktree"`. Each gets:
- Its goal + acceptance criteria (verbatim from §3)
- Specific file paths to edit
- Reference to `DevTradeSafe` skill for domain
- Reference to `md-files/agents/agent-*.md` playbook for role
- Explicit reminder: "Do NOT drive-by refactor outside the item. Stay in scope."

Then integration happens in Wave 2 (me, main agent).

Expected end state: one feature branch, one PR, ~30 file deletions + 10 new/renamed files, ~5000 LOC removed, ~600 LOC added. Test count ~1280 / ~60 suites (down from 1651 / 97).

**Time budget:** Wave 1 runs ~30 min in parallel, Wave 2 integration ~30 min. Total ~1 hour.

---

## Approval gate

**This plan is the contract.** Before I dispatch any agents:

1. Reality check — does my scope match your intent? Specifically:
   - Are you OK with subscription-upgrade backend being fully deleted (not just gated)?
   - Are you OK with all Stripe legacy endpoints being deleted?
   - Are you OK running TradeSafe in mock mode in prod until creds arrive?
2. Any scope to cut? I flagged Phase 4 outbound cutover as out-of-scope; is that still what you want?
3. `plan.md` stays at repo root during execution, gets archived to `docs/planning/2026-04-24-stitch-deletion-tradesafe-phase-3.md` after merge (same pattern as the Phase 1c–2 plan).

Reply **"go"** to dispatch Wave 1, or point out what needs to change.
