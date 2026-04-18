# TradeSafe — Live Production Readiness Package

**Owner:** Team Lead (approval gate) + Backend Lead + DevOps
**Status:** Not ready — pending commercial onboarding (R24)
**Last refreshed:** 2026-04-18
**Reading order:** `docs/adr/0008-tradesafe-for-hunter-payouts.md` → `docs/adr/0009-tradesafe-integration-skeleton.md` → this document → `docs/deployment/go-live-checklist.md` §0.6.

---

## 1. Executive summary

TradeSafe is the **outbound hunter-payout rail** for Social Bounty (per [ADR 0008](../adr/0008-tradesafe-for-hunter-payouts.md)). Stitch Express remains the inbound rail for brand bounty funding; TradeSafe disburses those funds to hunters from platform custody. The integration is currently **scaffolded, not live**: adapter, webhook controller, env-var slots, module wiring and 1 235 passing tests exist, but every call path is gated by `PAYOUTS_ENABLED=false` and `TradeSafeClient` defaults to mock mode until creds are configured (`apps/api/src/modules/tradesafe/tradesafe.client.ts:41-65`). Flipping to live is blocked on **R24** — TradeSafe commercial onboarding (merchant agreement, KYB, API credentials) — and on a one-time cryptographic setup (`BENEFICIARY_ENC_KEY`) that must be generated and vaulted before `PAYOUTS_ENABLED=true` can ever be set, or the app will refuse to boot (`apps/api/src/modules/payouts/beneficiary.service.ts:41-45`).

This document is a pre-flight checklist for that flip. It is not an implementation plan — ADR 0010 covers the endpoint catalogue once sandbox credentials land. Every blocker flagged here is actionable; items that cannot be verified from code alone are marked **VERIFY WITH TRADESAFE**.

---

## 2. Commercial prerequisites (R24 — external blocker)

Engineering is unblocked the moment every row below is signed off. Until then, `PAYOUTS_ENABLED=false` stays.

| # | Gate | Owner | Evidence |
|---|---|---|---|
| 2.1 | Signed TradeSafe merchant / escrow-agent commercial agreement | Commercial | Countersigned PDF in vault, reviewed by Legal |
| 2.2 | KYB (Know-Your-Business) complete on TradeSafe's platform for Social Bounty (Pty) Ltd | Commercial / Legal | TradeSafe issues a customer identifier once cleared |
| 2.3 | Live API credentials provisioned — Client ID, Client Secret, Webhook Secret | Commercial (receives), DevOps (vaults) | `TRADESAFE_CLIENT_ID`, `TRADESAFE_CLIENT_SECRET`, `TRADESAFE_WEBHOOK_SECRET` vault entries referenced from the prod secret manager |
| 2.4 | Dedicated beneficiary encryption key generated (≥32 chars random, AES-256 key material, NOT derived from `JWT_SECRET`) — see §5 below | DevOps / Security | `BENEFICIARY_ENC_KEY` vault entry + rotation runbook entry acknowledging "first-generation — never to be rotated silently" |
| 2.5 | TradeSafe dashboard access for ≥2 team members (active directory groups or equivalent) — no single-person dependency | Commercial / IT | TradeSafe-side admin invite + screenshot of member list |
| 2.6 | SLA + incident escalation contacts documented (24/7 phone, out-of-hours email, severity matrix) | Commercial / DevOps | Added to `docs/INCIDENT-RESPONSE.md` + on-call runbook |
| 2.7 | Bank account verification: confirm the ZAR business account that receives platform-held escrow residue matches the Stitch inbound receiving account | Commercial / Finance | Bank confirmation letter + TradeSafe-side settlement account screenshot |
| 2.8 | Multi-recipient payout API shape confirmed against adapter expectations | Backend / Commercial | See §11 — walk every open question from ADR 0009 §8 to resolution |
| 2.9 | Ledger account audit: confirm `tradesafe_escrow` account is added or explicitly declined in ADR 0010 (ADR 0009 §7 flags this as a clearance-policy decision) | Architect / Finance | ADR 0010 "Accepted" + migration adding the `LedgerAccount` enum value if in scope |

Until 2.1–2.4 land, any PR that would touch live TradeSafe code must be rejected.

### 2.10 Walk-through of ADR 0009 §8 open questions (must answer each before live)

Each question below must resolve to either **(a)** "answered, cite TradeSafe docs" OR **(b)** "does not apply — superseded by ADR 0010". An unanswered question is a hard blocker for 2.8 above.

| # | Open question (ADR 0009 §8) | Status at 2026-04-18 | Owner |
|---|---|---|---|
| 8.1 | KYB / merchant-agreement / sandbox-credential ETA | Open — R24 | Commercial |
| 8.2 | Full TradeSafe API reference documentation | Open — no sandbox docs on file | Backend |
| 8.3 | Per-transaction vs batch release semantics (affects scheduler loop shape) | Open — affects `PayoutsService.runBatch` / `retryBatch` — `apps/api/src/modules/payouts/payouts.service.ts:65-137, 271-323` | Backend |
| 8.4 | Dispute-resolution flow interaction with `SubmissionStatus` state machine | Open — no design in code today | Backend + Architect |
| 8.5 | Reporting / settlements endpoint for reconciliation matching | Open — reconciliation `checkStitchVsLedger` currently only scans Stitch tables (`apps/api/src/modules/reconciliation/reconciliation.service.ts:590-660`). TradeSafe-specific check missing — see §11 | Backend |
| 8.6 | Sandbox credential terms (lifetime, test bank details) | Open — R24 dependency | Commercial |
| 8.7 | Fee model (per-transaction, monthly minimum, interaction with 3.5% global fee) | Open — possible schema addition (`providerFeeCents` column) | Finance + Backend |
| 8.8 | Webhook delivery guarantees + signature scheme (Svix vs proprietary HMAC) | Partially answered in code: `TradeSafeWebhookController` assumes Svix-compatible headers (`apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts:62-89`). **VERIFY WITH TRADESAFE** — if proprietary HMAC, a sibling verifier module is required before the controller can be trusted | Backend |

---

## 3. Environment variables — full list

All values must be configured in the prod secret manager and unique per environment. Boot-time validation lives in `apps/api/src/common/config/env.validation.ts`. **Missing or malformed values cause the NestJS app to throw at startup** (intentional; silent config drift is a Section 6 failure pattern).

| Variable | Required for live? | Validated in `env.validation.ts` | Where it flows | Gotcha |
|---|---|---|---|---|
| `PAYOUT_PROVIDER` | Yes — set to `tradesafe` | Yes, line 80-82 (`PayoutProvider` enum: `stitch \| tradesafe \| mock`) | `PayoutProviderFactory` constructor, `apps/api/src/modules/payouts/payout-provider.factory.ts:33-48` | Default is `stitch` — selecting `tradesafe` here does NOT enable payouts; `PAYOUTS_ENABLED` is a separate gate (factory comment lines 24-27). Unknown values throw at boot. |
| `PAYOUTS_ENABLED` | Yes — `true` | Yes, line 132-134 (`@IsBooleanString`) | `PayoutsScheduler.enabled()`, `ClearanceScheduler` (line 17), `ExpiredBountyScheduler` (line 27), `BeneficiaryService` constructor (line 39) | Default `false`. **No code path auto-flips this** (verified §7). Must be a deliberate env change + deploy. |
| `TRADESAFE_API_BASE` | Yes | Yes, line 85-86 (`@IsUrl`) | `TradeSafeClient` constructor, `apps/api/src/modules/tradesafe/tradesafe.client.ts:45-48` | Defaults to `https://api.tradesafe.co.za` in code. **VERIFY WITH TRADESAFE** — confirm the live and sandbox URLs; ADR 0009 §8 flags this is currently speculative (R24 in batch 10 audit report). Do NOT guess. |
| `TRADESAFE_CLIENT_ID` | Yes | Yes, line 88-90 (`@IsOptional @IsString`) | `TradeSafeClient` constructor line 49 | Optional in validation (so dev envs don't need it), but the client's mock-mode guard (lines 51-59) switches to live mode only when both CLIENT_ID + CLIENT_SECRET are set AND `TRADESAFE_MOCK != 'true'`. |
| `TRADESAFE_CLIENT_SECRET` | Yes | Yes, line 92-94 | `TradeSafeClient` constructor line 50 | Secret. Never logged; never surfaced to the frontend. |
| `TRADESAFE_WEBHOOK_SECRET` | Yes | Yes, line 96-98 | `TradeSafeWebhookController.receive`, `apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts:75` | Used by `SvixVerifier.verify` — controller currently assumes Svix-compatible shape. If TradeSafe signs differently, controller changes before going live (see §4.3 + §11). |
| `TRADESAFE_MOCK` | No (recommend `false` in prod) | Yes, line 100-102 (`@IsBooleanString`) | `TradeSafeClient` constructor lines 51-59 | Must be `'false'` (or unset with both creds present) in prod. If left `'true'` by accident, every call short-circuits to in-memory fixtures — no network calls — and `PAYOUTS_ENABLED=true` would appear healthy while moving no real money. **Operational landmine.** |
| `TRADESAFE_OAUTH_REDIRECT_URL` | Yes (per ADR 0009 §4) | **NO — gap** | Referenced in ADR 0009 only; no code path reads it yet | **Gap** — env.validation.ts does not validate this. Either add validation when `PAYOUT_PROVIDER=tradesafe`, or confirm it's not needed (sandbox may not require OAuth callback). Blocks ADR 0010. |
| `TRADESAFE_SUCCESS_URL` | Yes (per ADR 0009 §4) | **NO — gap** | ADR 0009 only; intended for frontend beneficiary-link success redirect | **Gap** — add to env.validation.ts + `.env.example`. |
| `TRADESAFE_FAILURE_URL` | Yes (per ADR 0009 §4) | **NO — gap** | ADR 0009 only; intended for frontend beneficiary-link failure redirect | **Gap** — add to env.validation.ts + `.env.example`. |
| `BENEFICIARY_ENC_KEY` | Yes — **≥32 chars** when `PAYOUTS_ENABLED=true` | Yes, line 170-176 (`@ValidateIf + @MinLength(32)`) PLUS defence-in-depth throw in `BeneficiaryService` constructor line 41-45 | `BeneficiaryService` constructor | Security-critical. See §5 below for the full treatment. **Flipping `PAYOUTS_ENABLED=true` without this key crashes the app at NestJS module init — this is intentional.** |
| `STITCH_SYSTEM_ACTOR_ID` | Yes (inherited) | Yes, line 153-155 | `PayoutsService.systemActorId()`, `ReconciliationService.systemActorId()`, `RefundsService` (via `user.sub` for audit logging) | UUID of a real `users` table row. Audit-log FK enforces. Already required pre-TradeSafe — nothing changes. |

### 3.1 Gap summary (§3 items flagged "NO — gap")

Three variables referenced by ADR 0009 §4 (`TRADESAFE_OAUTH_REDIRECT_URL`, `TRADESAFE_SUCCESS_URL`, `TRADESAFE_FAILURE_URL`) are **NOT** in `env.validation.ts` and **NOT** in `.env.example`. These must be added before cutover. Minimum acceptable shape: `@ValidateIf((o) => o.PAYOUT_PROVIDER === PayoutProvider.TRADESAFE)` gate so dev remains ergonomic. ADR 0010 owns the final decision on whether all three are mandatory — sandbox may only need some of them. Tracked as **ADR 0009 §4 implementation gap — follow up in ADR 0010**.

---

## 4. Webhook configuration

### 4.1 Registration in the TradeSafe dashboard

1. Log into TradeSafe admin (see 2.5 for access list).
2. Navigate to **Webhooks** (exact label **VERIFY WITH TRADESAFE**).
3. Register a new webhook endpoint:
   - **URL:** `https://api.socialbounty.cash/api/v1/webhooks/tradesafe` (adjust prod FQDN — do not use staging).
   - **Signing secret:** generate via TradeSafe-side, copy it into the prod secret manager as `TRADESAFE_WEBHOOK_SECRET` (NOT the same value as `TRADESAFE_CLIENT_SECRET`).
   - **Enabled events:** minimum set from §4.4 below.
4. TradeSafe should send a test event. Confirm a row lands in `webhook_events` with `provider='TRADESAFE'` and `isDuplicate=false`, then on re-send `isDuplicate=true` (replay-guard verification).

### 4.2 Endpoint — exact shape

Fully-qualified production endpoint:

```
POST https://<prod-host>/api/v1/webhooks/tradesafe
```

Handler: `TradeSafeWebhookController.receive` at `apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts:53-149`. Controller decorator is `@Controller('webhooks')` + `@Post('tradesafe')`. The app's global prefix `/api/v1` is concatenated externally.

Returns:
- `200 {received: true, duplicate: false}` on first receipt
- `200 {received: true, duplicate: true}` on replay (the event id already exists in `webhook_events`)
- `400 BadRequest` on malformed body / missing Svix headers
- `401 Unauthorized` on signature-verification failure

### 4.3 Signing mechanism

**Current code assumes Svix-compatible HMAC-SHA256** headers:

- `svix-id` (unique event id — becomes `WebhookEvent.externalEventId`)
- `svix-timestamp` (Unix epoch seconds — verified ≤5 min skew, `SvixVerifier.assertTimestampFresh`, `apps/api/src/modules/webhooks/svix.verifier.ts:64-73`)
- `svix-signature` (space-separated `v1,<base64-sig>` entries)

Verifier: `SvixVerifier.verify`, `apps/api/src/modules/webhooks/svix.verifier.ts:27-62`. Secret is `TRADESAFE_WEBHOOK_SECRET`, passed through `decodeSecret` which strips an optional `whsec_` prefix and base64-decodes.

**VERIFY WITH TRADESAFE DOCS** that TradeSafe signs webhooks with this scheme. ADR 0009 §6 flags this as open question #8. If TradeSafe uses proprietary HMAC (e.g. raw SHA-256 with a different header naming convention), a sibling verifier module at `apps/api/src/modules/webhooks/verifiers/tradesafe.verifier.ts` must be added BEFORE going live. Controller's public shape does not change; only the injected verifier.

### 4.4 Minimum event subscription

The router does not yet dispatch any `tradesafe.*` events. `WebhookRouterService.dispatch` at `apps/api/src/modules/webhooks/webhook-router.service.ts:24-90` handles only `LINK` / `WITHDRAWAL` / `REFUND` / `CONSENT` / `SUBSCRIPTION` (all Stitch-side). **This is a gap that ADR 0010 + a backend PR must close before live.**

Likely minimum subscription (from ADR 0009 §6 table — **VERIFY WITH TRADESAFE** once docs are available):

| Event family (speculative) | Purpose | Ledger effect |
|---|---|---|
| `tradesafe.payout.created` | Confirms we sent it | None — logging only |
| `tradesafe.payout.escrow_held` | Funds in TradeSafe float | Mirrors `payout_in_transit` — possibly opens a `tradesafe_escrow` account (ADR 0009 §7) |
| `tradesafe.payout.released` | TradeSafe disbursed to hunter bank | Drives `PayoutsService.onPayoutSettled` equivalent — `payout_in_transit` → `hunter_paid` |
| `tradesafe.payout.failed` | Disbursement failed | Drives `onPayoutFailed` equivalent — compensating entry, retry |
| `tradesafe.beneficiary.verified` | KYC status change on a hunter beneficiary | Updates `StitchBeneficiary.verifiedAt` (or its TradeSafe peer — see ADR 0009 §3) |

Every event that can mutate the ledger MUST map to an idempotency-safe handler path with its own `actionType` constant. The `WebhookEvent.UNIQUE(provider, externalEventId)` constraint protects against Svix-side replay; the ledger's `UNIQUE(referenceId, actionType)` protects against handler-side double-posting.

### 4.5 Replay-attack guards (already in code)

- **HMAC verify + 5-min timestamp window** — `SvixVerifier` rejects stale events (line 64-73).
- **Redis replay guard** — re-delivered events short-circuit via `WebhookEventService.recordOrFetch` returning `{isDuplicate: true}` before the router is called (`tradesafe-webhook.controller.ts:103-114`).
- **Router dispatch errors are KB-recorded, not re-raised** — a buggy handler cannot turn one Svix event into a retry storm (controller lines 120-146 already enforce this).

---

## 5. `BENEFICIARY_ENC_KEY` — generation & storage

This key encrypts hunter bank-account numbers on `stitch_beneficiaries.accountNumberEnc` with AES-256-GCM (`apps/api/src/modules/payouts/beneficiary.service.ts:7, 57, 121-137`). A compromise of this key compromises every stored bank account; treat it at the same level as the database master key.

### 5.1 Generation

Approved one-liners (on an offline/secure host, not copy-pasted into Slack):

```bash
# 32-byte key, hex-encoded (64 chars)
openssl rand -hex 32

# 48-byte key, base64-encoded (64 chars, recommended for vault entry)
openssl rand -base64 48
```

Either format satisfies the `@MinLength(32)` validation. Internally `BeneficiaryService` runs `scryptSync(secret, 'stitch-beneficiary', 32)` to stretch to exactly 32 bytes for AES-256 (`beneficiary.service.ts:57`), so the input length only has to be ≥32 chars of entropy.

### 5.2 What NOT to do

- **Do NOT derive it from `JWT_SECRET`.** Comment at `beneficiary.service.ts:28-37` captures the reasoning: sharing the token-signing secret with the at-rest encryption key means one leak compromises both. The defence-in-depth throw at `beneficiary.service.ts:41-45` refuses to boot if `PAYOUTS_ENABLED=true` AND `BENEFICIARY_ENC_KEY` is missing — do NOT remove that guard. Also validated at boot in `env.validation.ts:170-176`.
- **Do NOT commit it** — `.env.example` has a placeholder literal (`replace-with-32-plus-char-random-secret-before-enabling-payouts`) that is deliberately obvious.
- **Do NOT reuse the same value across environments.** Staging / prod must have distinct keys.
- **Do NOT store it in `.env` files checked into any remote.** Vault-only.
- **Do NOT log it.** `ConfigService.get` accesses are one-shot reads at boot; confirm no `console.log` / `Logger` call ever prints the key.

### 5.3 Rotation procedure — this is a data-migration event

Because `BENEFICIARY_ENC_KEY` encrypts data at rest, rotating it is NOT a simple env swap. Every existing row in `stitch_beneficiaries.accountNumberEnc` was encrypted with the old key; swapping to a new key immediately breaks every `decryptAccountNumber` call (`beneficiary.service.ts:117-137`).

**Preferred policy: the first-time-generated key is kept forever** unless a documented compromise occurs.

**If rotation is required** (e.g. known compromise, compliance audit demand):

1. Generate the new key (as in §5.1). Do not deploy it yet.
2. Deploy a migration task that:
   - Reads every `stitch_beneficiaries` row.
   - Decrypts with the old key.
   - Re-encrypts with the new key.
   - Updates the row inside a transaction.
3. Flip the env var only after the migration completes across all replicas.
4. Verify by decrypting one row with the new key via a read-only admin tool.
5. Audit-log the rotation event.

A one-shot dev-side migration tool does not exist today; writing it is out of scope for this readiness doc — it's a pre-rotation engineering spike when the need arises.

### 5.4 Storage recommendation

- Production: secret manager (AWS Secrets Manager, GCP Secret Manager, Vault, or equivalent). Accessed via ECS/Kubernetes secret injection at container start.
- Staging: same shape, different value.
- Dev: unset — the JWT_SECRET fallback at `beneficiary.service.ts:47-55` issues a loud warning and is valid ONLY while `PAYOUTS_ENABLED=false`.
- Backup: encrypted escrow copy held by a separate role (e.g. Security lead) in case the primary vault is compromised. Recovery from this copy is a written runbook item.

---

## 6. Pre-flip smoke test on live

**Budget:** R10 total (platform eats the loss if the path is broken; refund once end-to-end passes).

### 6.1 Prep (T-24h)

- Confirm §2 rows 2.1–2.4 all signed off.
- `TRADESAFE_MOCK=false` (or unset) in the target env.
- `PAYOUT_PROVIDER=tradesafe`.
- `PAYOUTS_ENABLED=false` initially — flip last.
- All four `TRADESAFE_*` creds + `BENEFICIARY_ENC_KEY` in the prod secret manager.
- `STITCH_SYSTEM_ACTOR_ID` already provisioned and corresponds to a real `users` row (pre-existing for Stitch; reused here).
- Database backup taken within the hour (go-live checklist §1).

### 6.2 The sequence

1. **Create the test hunter.** Sign in as a real human, complete standard KYC. Use a REAL South African bank account (not a shared team test account — rotating it later is worse than using a personal account that can be closed).
2. **Save beneficiary via the hunter-side payouts settings page.** Walk the OAuth-callback flow end-to-end (`/api/v1/auth/tradesafe/callback` — this route is still **pending implementation** per ADR 0009 §5; confirm it exists in the deployed build).
3. **Verify encryption at rest.** From a read-only prod DB shell:
   ```sql
   SELECT id, "accountNumberEnc"
     FROM stitch_beneficiaries
    ORDER BY "createdAt" DESC
    LIMIT 1;
   ```
   (Schema name is `accountNumberEnc`, not `encrypted_payload` — the Prisma column lives in `packages/prisma/schema.prisma:1424`.) Output MUST look like three hex strings joined with colons (`<iv_hex>:<tag_hex>:<data_hex>`), NOT like digits. If it looks like a plain account number, abort immediately and investigate.
4. **Fund a 1 ZAR test bounty via Stitch.** Confirm inbound path still works (existing flow, not TradeSafe). Bounty transitions to `paymentStatus=PAID`, `StitchPaymentLink.status=SETTLED`, ledger group `stitch_payment_settled` exists.
5. **Approve a submission against that bounty.** Ledger posts `brand_reserve → hunter_pending → hunter_net_payable`. Hunter sees balance in Pending.
6. **Wait for clearance.** On the Free plan this is 48 hours (Pro: 0). **Shortcut for the smoke test:** set `CLEARANCE_OVERRIDE_HOURS_FREE=0.0083` (≈30s) as a DEV-only one-time deploy — the env var is already wired (`env.validation.ts:107-111`) and respected by `ClearanceService`. Use this ONLY in a controlled window and revert the override immediately after the test — leaving it in prod would eliminate the chargeback buffer permanently. (If `ClearanceService` respects the override in staging but not prod, fall back to the 48h wait — correctness over convenience.) Once clearance elapses, `ClearanceScheduler` moves `hunter_net_payable → hunter_available`.
7. **Flip `PAYOUTS_ENABLED=true`** + rolling-deploy API containers. Watch the `BeneficiaryService` constructor log line — if the env wire is wrong the app will throw at boot (intentional).
8. **Wait for `PayoutsScheduler.execute`** (every 10 minutes, `payouts.scheduler.ts:19`). Confirm a row appears in `stitch_payouts` with `status=CREATED` → `INITIATED`.
9. **Verify TradeSafe received the payout.** Cross-check on the TradeSafe dashboard: the payout should appear in the outbound queue.
10. **Webhook arrives.** `POST /api/v1/webhooks/tradesafe` hits the controller; Svix verification passes; `WebhookEvent` row lands with `provider='TRADESAFE'`; router dispatches to the (ADR 0010) payout-settled handler. **Note:** until ADR 0010 wires dispatch arms into `WebhookRouterService` (`webhook-router.service.ts:24-90`), the controller will accept the webhook but no ledger movement happens — this is a BLOCKER if hit at smoke-test time.
11. **Hunter's bank account receives the R~1** (minus TradeSafe fees — see 8.7 above). Real-money confirmation: ask the hunter to screenshot the SMS / bank-statement entry.
12. **Ledger verification.** Confirm `stitch_payout_settled`-equivalent (exact `actionType` pending ADR 0010) ledger group exists, balances, and references the `tradesafe_payout_id`. Also verify the `payout_in_transit → hunter_paid` double-entry.
13. **Reconciliation dashboard.** The next 15-min recon tick should show zero critical findings. If it trips a `stitch-ledger-gap` (because the legacy check scans only Stitch-named tables — see §9 + §11), expect this until the TradeSafe reconciliation check lands.
14. **Refund path for the test money.** Post a compensating entry via `/admin/finance/overrides` (not a production refund — just returning the 1 ZAR to the brand so the books tie out) with reason "TradeSafe live smoke test — refund to brand".
15. **Flip `PAYOUTS_ENABLED=false` again** if additional smoke-run iterations are needed, or keep it on if all 14 steps above are clean.

### 6.3 Go / No-go gates during the smoke

- **Step 3 fails** (plaintext account number in DB) → immediately `PAYOUTS_ENABLED=false`, kill switch on, post-mortem before retrying.
- **Step 10 blocks** (no router dispatch arm) → abort; ADR 0010 engineering work incomplete.
- **Step 11 times out** (≥2h without hunter confirmation) → TradeSafe-side issue; contact TradeSafe support per §2.6.
- **Reconciliation critical at step 13** → kill switch ON (automatic per `reconciliation.service.ts:97-145`); manual compensating entry to square books.

---

## 7. The `PAYOUTS_ENABLED=false` gate — how it's enforced today

### 7.1 Where in code it's checked

Single source of truth: `ConfigService.get<string>('PAYOUTS_ENABLED', 'false') === 'true'`. Five consumers (confirmed by grep):

1. `apps/api/src/modules/payouts/payouts.scheduler.ts:16` — `PayoutsScheduler.enabled()`. Both `@Cron` methods return early if false (lines 19-46).
2. `apps/api/src/modules/ledger/clearance.scheduler.ts:17` — `ClearanceScheduler`.
3. `apps/api/src/modules/bounties/expired-bounty.scheduler.ts:27` — `ExpiredBountyScheduler` (with `EXPIRED_BOUNTY_RELEASE_ENABLED` override).
4. `apps/api/src/modules/payouts/beneficiary.service.ts:39` — constructor-time check that throws if `BENEFICIARY_ENC_KEY` is unset while payouts are enabled (defence-in-depth against accidental dev-key reuse).
5. Boot-time validation in `env.validation.ts:170-176` — enforces the `BENEFICIARY_ENC_KEY` dependency.

ADR 0009 §10 "Rollout plan" — Phase 3 — explicitly documents: `PAYOUTS_ENABLED=false` instantly halts outbound.

### 7.2 Flood risk when flipped on after a period being off

Yes — if the flag is off for a period and clearance has been accumulating, the first `PayoutsScheduler.execute` tick after the flip will walk `eligibleBeneficiaries` (up to `batchSize=100` per call) and initiate payouts for everyone whose `hunter_available` balance exceeds `STITCH_MIN_PAYOUT_CENTS`. With 10-minute cron cadence and a 100-per-tick cap, the ramp is ~600 payouts/hour worst-case.

**Mitigations if the build-up is large:**
- Temporarily lower `batchSize` by editing the scheduler's `runBatch()` call — not an env var today, would need a small PR.
- Stage the rollout: `PAYOUTS_ENABLED=true` for 30 min → kill switch if anything odd → `PAYOUTS_ENABLED=false` → let drain → repeat.
- Rate-limit at the TradeSafe side if its API tolerates bursts poorly — check their rate-limit docs (**VERIFY WITH TRADESAFE**).

### 7.3 Auto-flip safety

Confirmed: no code path writes to `PAYOUTS_ENABLED`. It is strictly an environment variable read at boot via `ConfigService`. There is no admin UI, webhook handler, or scheduler that mutates it. Flipping live is always a deliberate operator action: env change + deploy / restart. Good.

---

## 8. Kill-switch interaction

Two independent gates on the outbound rail:

### 8.1 `PAYOUTS_ENABLED=false`

- Halts **all outbound movement** (scheduler, retry, clearance, expired-bounty-release).
- Does NOT block ledger reads. Balances continue to accrue in `hunter_available`.
- Does NOT block compensating entries posted via `FinanceAdminService.postOverride` — those use the `allowDuringKillSwitch` bypass (ADR 0006) and operate on the ledger directly, not via the scheduler.

### 8.2 Financial Kill Switch (`SystemSetting.financial.kill_switch.active`)

- Blocks **all ledger writes** via `LedgerService.postTransactionGroup` unless `allowDuringKillSwitch=true` is set on the call.
- Only two call sites use the bypass (ADR 0006 §"Scope"): `FinanceAdminService.postOverride` and `devSeedPayable` (dev-only, refuses to run under `stitch_live`).
- Auto-activated by `ReconciliationService.run` on any `critical` finding (`reconciliation.service.ts:99-144`).
- Manually activated / released via the Finance admin dashboard.

### 8.3 Combined state table

| `PAYOUTS_ENABLED` | kill_switch.active | Result |
|---|---|---|
| `false` | `false` | Current MVP default. Inbound works, ledger writes work, no outbound disbursement. |
| `true` | `false` | Live payouts. TradeSafe adapter active. |
| `true` | `true` | **TradeSafe would accept the payout, but the ledger refuses the `payout_initiated` group.** `PayoutsService.initiatePayout` at `payouts.service.ts:143-266` posts a ledger group BEFORE calling `stitch.createPayout` — the ledger post throws a `KillSwitchActiveError` and the scheduler marks the attempt failed. Money stays in `hunter_available`. Correct behaviour. |
| `false` | `true` | Nothing moves. Belt-and-braces. |

### 8.4 ADR 0010 auto-refund interaction

`ADR 0010` (Auto-Refund on PostVisibility Failure) triggers `RefundService.requestAfterApproval` after two consecutive visibility failures. The refund path at `apps/api/src/modules/refunds/refunds.service.ts:149-289`:

- Posts a **compensating** ledger group (`actionType: 'refund_processed'`, reversing earnings split and returning funds to `brand_reserve`) — this is one of the scenarios ADR 0006 covers.
- Calls `this.stitch.createRefund(settledLink.stitchPaymentId, faceValue, ...)` at line 271 to reverse the ORIGINAL Stitch INBOUND payment.

**Critical observation:** the refund path does NOT call TradeSafe. It reverses the inbound Stitch payment at source. TradeSafe is never involved in auto-refunds for submissions where the hunter hasn't been paid yet. This is the correct model — TradeSafe is only invoked for outbound hunter payouts, not for brand-side reversal. Verify this chain end-to-end in the smoke test (§6) by deliberately triggering a visibility-failure scenario once the live path is stable.

**Exception:** if the hunter has ALREADY been paid (`submission.payout?.paidAt` exists — line 161), `requestAfterApproval` throws `BadRequestException('Submission has been paid out; use after-payout endpoint')`. The after-payout refund path (not read in detail here) would need TradeSafe-side coordination to recall disbursed funds — which TradeSafe typically does NOT support. This is a finance-policy boundary: once TradeSafe has released to the hunter's bank, the platform cannot claw it back automatically. Manual recovery only. **Flag this as a commercial-terms question for TradeSafe: what is the recall window, if any?**

### 8.5 Kill-switch read is fail-closed — verify

`LedgerService.isKillSwitchActive()` must fail-closed (return true on transient DB read errors). `SubmissionVisibilityScheduler` calls it with `.catch(() => true)` per ADR 0010 §3. Verify other consumers (particularly PayoutsService-adjacent code) use the same guard before relying on this path — a DB read blip biasing the wrong way during payout time is a Critical financial impact case.

---

## 9. Monitoring & alerting — TradeSafe-specific

Minimum alert surface at go-live. Integrate with Sentry (existing `SENTRY_DSN`) and/or Slack webhooks (existing `docs/INCIDENT-RESPONSE.md` wiring).

| Metric | Threshold | Evidence path | Notes |
|---|---|---|---|
| Payout success rate (settled / total) | Warning <95%, Critical <90% rolling 24h | `stitch_payouts.status` counts (table is provider-generic per ADR 0009 §3 Option B; name may change) | Gaming this metric requires webhook arrival — if webhooks are stalled the numerator stays artificially low. Pair with 9.3. |
| Payout latency (created → settled) | Warning p95 >24h, Critical >48h | `stitch_payouts.createdAt` vs `SETTLED` status timestamp | TradeSafe SLA here is **VERIFY WITH TRADESAFE** — depends on escrow dwell time and disbursement cadence. |
| Beneficiary-link OAuth completion rate | Warning <85% | `auth_audit_log` entries (callback success vs initiate) | Only exists once `/api/v1/auth/tradesafe/callback` is implemented per ADR 0009 §5. Currently a gap. |
| Webhook success rate | Warning <99%, Critical <97% | `webhook_events` where `provider='TRADESAFE'` — `processed=true` / total | Replay guard adds `duplicate=true` rows that should not count as failures. |
| Reconciliation `tradesafe-vs-ledger` gap | Any row surfaced → critical alert | **MISSING — reconciliation gap** — see §11 | Currently `ReconciliationService.checkStitchVsLedger` (`reconciliation.service.ts:590-660`) scans only `stitch_payment_links` + `stitch_payouts`. A TradeSafe-named equivalent (or, if Option B lands, a provider-aware rewrite) MUST be in place before go-live. This is a blocker. |
| TradeSafe API 5xx rate | Warning >1%, Critical >5% | `TradeSafeClient.fetchWithRetry` already retries 5xx — surface via Sentry breadcrumb | Pair with payout failure-rate alert. |
| `TradeSafeClient` token cache misses | Informational — spike >10× baseline | Redis key `tradesafe:token:v1` — `TTL` observability | A sustained miss rate indicates OAuth credential rotation or upstream token-endpoint degradation. |

---

## 10. Rollback

### 10.1 Halting further outbound

**Primary mechanism: `PAYOUTS_ENABLED=false`.** Flip the env var + rolling deploy. Scheduler's next tick returns early. In-flight payouts that have already been dispatched to TradeSafe continue on TradeSafe's side — see 10.2.

**Secondary: Financial Kill Switch.** Blocks ledger writes too. Use if ledger integrity is in doubt. Auto-tripped by reconciliation on critical findings.

### 10.2 In-flight payouts — can they be recalled?

**Depends on TradeSafe policy. VERIFY WITH TRADESAFE.** Three states after we call `initiatePayout`:

1. **`CREATED` only, not yet handed to TradeSafe** — only ours. Compensating entry via `/admin/finance/overrides` returns funds to `hunter_available`.
2. **`ESCROW_HELD` on TradeSafe, not yet released** — TradeSafe's release endpoint is ours to call. A pre-release cancel is probably possible but MUST be confirmed in writing with TradeSafe; sandbox tests don't count for commercial terms.
3. **`RELEASED` — funds on the way to the hunter's bank** — almost certainly not recallable. Once TradeSafe has initiated the bank transfer, recovery is manual (TradeSafe support, chargeback-equivalent flow, or inter-personal recovery from the hunter). Document this explicitly: **out-the-door funds require manual TradeSafe-side intervention.**

### 10.3 Credential rotation window

If `TRADESAFE_CLIENT_SECRET` or `TRADESAFE_WEBHOOK_SECRET` is compromised:

1. **Rotate on the TradeSafe side first.** New secret issued; old one retained as "expiring" if TradeSafe supports a grace window.
2. **Update the prod secret manager.**
3. **Rolling deploy.** Because the `TradeSafeClient` caches tokens in Redis (`tradesafe:token:v1`, 14-min TTL per `tradesafe.client.ts:16`), existing cached tokens remain valid briefly with the old secret — OK as long as new tokens will be minted under the new secret.
4. **For `TRADESAFE_WEBHOOK_SECRET`:** expect a window where in-flight webhooks verify under the old secret and new ones under the new secret. Minimise by rotating during a quiet window. If TradeSafe's dashboard supports dual-active secrets, prefer that.

`BENEFICIARY_ENC_KEY` rotation is a separate, data-migration event — see §5.3.

---

## 11. Known gaps and open questions

The following items are **live blockers** for cutover. Every one must be closed or explicitly waived before `PAYOUTS_ENABLED=true` in prod.

### 11.1 Webhook signing scheme

**Gap.** Controller assumes Svix-compatible HMAC (§4.3, ADR 0009 §6/§8-8). If TradeSafe uses proprietary HMAC, a sibling verifier module is required. **Action:** Backend to confirm against TradeSafe docs, either add `tradesafe.verifier.ts` or confirm Svix-compat. File: `apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts:75-89`.

### 11.2 Multi-recipient payout API shape

**Gap.** Adapter's call shape (`TradeSafeClient.initiatePayout` at `tradesafe.client.ts:134-159`) posts to `/api/v1/payouts` with `{amount, beneficiaryId, merchantReference}`. ADR 0009 §8-2 marks the endpoint path + request shape as speculative; the adapter comment explicitly says "concrete endpoint paths and request/response shapes are stubs until ADR 0010 lands (post-sandbox)" (`tradesafe.client.ts:26-27`). **Action:** walk every TradeSafe endpoint the adapter expects against sandbox. Open question #8.3 (per-transaction vs batch) changes scheduler shape — a batch semantic breaks the current per-user loop in `PayoutsService.runBatch` at lines 65-137.

### 11.3 "Peach Payments" references — cosmetic only, must stay dead

**Verified.** No live-code references to Peach exist. Grep `md-files/`, `apps/api/`, `apps/web/` for "Peach" confirms all hits are in (a) ADRs 0007/0008 documenting the supersession or (b) historical comments pointing at "TRADESAFE MIGRATION (ADR 0008)" markers (`payouts.service.ts` lines 61-63, 139-142, 268-270, 325-327, 374-376, etc., `beneficiary.service.ts:60-64`). ADR 0008 supersedes ADR 0007. No action needed — mentioned only so the §0.6 gate in the go-live checklist is not mistakenly interpreted as requiring Peach.

### 11.4 Payout scheduler partial-failure handling in a batch

**Gap.** ADR 0009 §8 does not specify whether TradeSafe's payout endpoint accepts batched multi-recipient calls or requires one-call-per-beneficiary. `PayoutsService.runBatch` currently iterates per-beneficiary and calls `initiatePayout` individually (`payouts.service.ts:96-112`). If TradeSafe expects one batch call with N recipients, the partial-failure (some succeed, some fail in response body) semantics are different. **Action:** confirm the API shape; if batched, add per-line failure handling + ledger-per-line bookkeeping.

### 11.5 Reconciliation coverage for TradeSafe — blocker

**Gap.** `ReconciliationService.checkStitchVsLedger` (`reconciliation.service.ts:590-660`) scans ONLY `stitch_payment_links` (inbound) and `stitch_payouts` (outbound). Both queries use `FROM stitch_payouts sp WHERE sp.status = 'SETTLED'` and match against `actionType = 'stitch_payout_settled'`. When TradeSafe is live and the outbound path writes through the TradeSafe adapter, the ledger `actionType` will differ (ADR 0010 names it, likely `tradesafe_payout_settled` or a provider-agnostic `payout_settled`), and either:

- The same `stitch_payouts` table is reused with a `provider` discriminator (ADR 0009 §3 Option B — recommended but not yet migrated), OR
- A new `tradesafe_payouts` table exists (Option A).

Either way, `checkStitchVsLedger` needs a TradeSafe arm OR a provider-agnostic rewrite. **Without this check, a SETTLED TradeSafe payout with no ledger group would not raise a critical finding — which is the canonical "money missing from books" case. This is a blocker for go-live.** Action owner: Backend + Architect, in the PR that implements ADR 0010.

### 11.6 Webhook router TradeSafe dispatch arms

**Gap.** `WebhookRouterService.dispatch` has no `tradesafe.*` arms. Controller accepts + stores the webhook; router logs "no handler wired" (`webhook-router.service.ts:89`). **Until this is implemented, webhooks are a no-op.** Implementing it requires ADR 0010 to pin the event shapes.

### 11.7 `/api/v1/auth/tradesafe/callback` route — not implemented

**Gap.** ADR 0009 §5 promises this route. Grep confirms no file named `tradesafe.controller.ts` or `tradesafe-auth.controller.ts` exists. `/settings/payouts` on the frontend likewise has no TradeSafe-specific flow. Before live, the OAuth / beneficiary-link flow end-to-end must exist.

### 11.8 Env-var validation for `TRADESAFE_OAUTH_REDIRECT_URL` / `TRADESAFE_SUCCESS_URL` / `TRADESAFE_FAILURE_URL`

**Gap.** See §3.1. Three ADR-0009-referenced vars are not in `env.validation.ts` and not in `.env.example`. Add them with `@ValidateIf((o) => o.PAYOUT_PROVIDER === PayoutProvider.TRADESAFE)` when ADR 0010 confirms they are required.

---

## 12. Risk register update

| ID | Risk | Severity | Status at 2026-04-18 | Action owner | Close criterion |
|---|---|---|---|---|---|
| R24 | TradeSafe live creds + commercial onboarding — external blocker | **High** | **Open** — no change since batch 10 audit | Commercial | §2 rows 2.1–2.4 signed + ADR 0010 accepted |
| R31 **(new)** | Webhook signing scheme unverified | Medium | **Open** | Backend | §11.1 resolved against TradeSafe docs |
| R32 **(new)** | `checkStitchVsLedger` does not cover TradeSafe payouts (reconciliation gap) | **High** | **Open** — blocker | Backend + Architect | §11.5 resolved in ADR 0010 implementation PR; fault-injection test added |
| R33 **(new)** | `/api/v1/auth/tradesafe/callback` not implemented | Medium | **Open** | Backend | Route implemented + smoke-tested (§6 step 2) |
| R34 **(new)** | `WebhookRouterService` has no `tradesafe.*` dispatch arms | **High** | **Open** — blocker | Backend | §11.6 closed in ADR 0010 implementation PR |
| R35 **(new)** | TradeSafe env vars (`TRADESAFE_OAUTH_REDIRECT_URL` / `_SUCCESS_URL` / `_FAILURE_URL`) not boot-validated | Low | **Open** | Backend | §3.1 / §11.8 validation added |
| R36 **(new)** | Recallability of RELEASED TradeSafe payouts unknown | Medium | **Open** | Commercial | §10.2 clarified in writing with TradeSafe |
| R37 **(new)** | Multi-recipient API shape may not match adapter | Medium | **Open** | Backend | §11.2 / §11.4 resolved against sandbox |

Pre-existing risks (R25–R30) remain closed per `claude.md` §"Open risks" line 179.

---

## 13. Sign-off

No cutover without every role below signing. Each signature attests to their scope being green across the entire §0–§11 checklist.

| Role | Name | Signature | Date | Scope |
|---|---|---|---|---|
| Team Lead | | | | Final approval gate; holds §4 Financial Non-Negotiables + Hard Rules 1–10 |
| Backend Lead | | | | §3 env wiring, §4.3-4.5 webhook verifier + dispatch, §11 gaps |
| DevOps | | | | §3 secret-manager wiring, §5 key provisioning, §7 rollout ordering, §9 monitoring |
| Security / Compliance | | | | §5 encryption-key hygiene, §10.3 rotation runbook, R35–R37 review |
| Commercial | | | | §2 gates, R24 closure, §10.2 written recall policy with TradeSafe |
| Architect | | | | §8 state-table, §11.5 reconciliation gap closed, ADR 0010 accepted |

Six signatures minimum. ADR 0010 must be in `Accepted` state before any of them sign.

---

## References

- `docs/adr/0008-tradesafe-for-hunter-payouts.md` — decision that TradeSafe is the outbound rail
- `docs/adr/0009-tradesafe-integration-skeleton.md` — schema direction + env-var contract + open questions
- `docs/adr/0010-auto-refund-on-visibility-failure.md` — ADR 0010 (auto-refund path — reverses Stitch inbound, NOT TradeSafe outbound)
- `docs/adr/0006-compensating-entries-bypass-kill-switch.md` — kill-switch bypass scope
- `docs/adr/0005-ledger-idempotency-via-header-table.md` — `UNIQUE(referenceId, actionType)` idempotency
- `docs/STITCH-IMPLEMENTATION-STATUS.md` — implementation log; see "Out of scope per ADR 0008" section
- `docs/deployment/go-live-checklist.md` — §0.6 outbound-rail gate, §4 financial readiness
- `docs/deployment/deployment-plan.md` — containers, migrations, rollback
- `claude.md` §4 Financial Non-Negotiables, §"Open risks" (R24)
- `apps/api/src/modules/tradesafe/tradesafe.client.ts` — HTTP client, mock-mode gate
- `apps/api/src/modules/payouts/` — payouts service, scheduler, adapters, factory
- `apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts` — Svix-verified inbound receiver
- `apps/api/src/common/config/env.validation.ts` — env-var contract
- `apps/api/src/modules/reconciliation/reconciliation.service.ts` — 7-check engine (§11.5 gap)
- TradeSafe API (live + sandbox URLs to be confirmed — **VERIFY WITH TRADESAFE**)
- Svix webhooks: https://docs.svix.com/receiving/verifying-payloads/how-manual
