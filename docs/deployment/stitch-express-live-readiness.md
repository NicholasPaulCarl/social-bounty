# Stitch Express — Live Production Readiness Package

**Owner:** Team Lead (approval) + Backend Lead + DevOps (operator)
**Status:** DRAFT — pending commercial sign-off and blocker resolution (see §9)
**Last Updated:** 2026-04-18
**Scope:** Operational readiness for flipping `PAYMENTS_PROVIDER=stitch_live` in production.

> This document is the deeper cousin of `docs/deployment/go-live-checklist.md`. The checklist is the gate; this document is the *"how and why"* behind the Stitch-specific gates, with exact file paths and line numbers so a Team Lead + DevOps pair can execute the flip with confidence. When the checklist says "confirm X", this doc tells you how to confirm it.
>
> Cross-references: `md-files/payment-gateway.md`, `md-files/financial-architecture.md`, `docs/STITCH-IMPLEMENTATION-STATUS.md`, `docs/adr/0005-0010`, `claude.md` §4 Financial Non-Negotiables.

---

## 1. Executive summary

Stitch Express is the platform's **inbound** rail — brands fund bounties via Stitch's hosted checkout (`POST /api/v1/payment-links`), money lands in platform custody, and a Svix-delivered settlement webhook posts a balanced double-entry ledger group that flips the Bounty to `LIVE`. The flow is live-tested end-to-end in **sandbox**: fund → settle webhook → `stitch_payment_settled` ledger group → reconciliation-clean. Integration surfaces — `apps/api/src/modules/stitch/stitch.client.ts`, `apps/api/src/modules/payments/stitch-payments.service.ts`, `apps/api/src/modules/payments/brand-funding.handler.ts`, `apps/api/src/modules/webhooks/stitch-webhook.controller.ts` — have test coverage, idempotency guards (`ledger_transaction_groups.UNIQUE(referenceId, actionType)`, `webhook_events.UNIQUE(provider, externalEventId)`), and kill-switch integration wired in.

**Unproven in live production:** the sandbox and live Stitch environments share `https://express.stitch.money` as the API base URL (differentiated by credentials, not URL). No code path has hit Stitch with production credentials from this codebase. The webhook endpoint, Svix secret, and redirect URL have never been registered against a live Stitch merchant account from this stack. The first live brand-funding settlement is an untested production codepath — mitigated by the pre-flip smoke test (§5), which executes a real 1 ZAR transaction against production before any brand traffic.

**Outbound payouts remain gated** (`PAYOUTS_ENABLED=false`). Stitch Express has no multi-recipient payout surface; TradeSafe is the outbound rail per ADR 0008 and is not shipping in this cutover.

---

## 2. Commercial prerequisites

These sign-off items block the live flip regardless of code readiness. They are **not** code-fixable. The DevOps and Backend leads should confirm each as present before the Team Lead schedules the cutover.

| # | Prerequisite | Evidence / location | Owner |
|---|---|---|---|
| 2.1 | **Signed commercial agreement with Stitch.** | Countersigned MSA / Commercial Terms in the legal archive. Must cover live Payment Links, Svix-delivered webhooks, and refund operations at a minimum. | Commercial |
| 2.2 | **Production credentials provisioned.** `STITCH_CLIENT_ID` (prod), `STITCH_CLIENT_SECRET` (prod), `STITCH_WEBHOOK_SECRET` (Svix `whsec_*`, prod endpoint-bound). | Secret manager (Vault / AWS SSM / Doppler). Hashes must appear in `GET /api/v1/admin/payments-health` after deploy (see `apps/api/src/modules/finance/payments-health.controller.ts:63-67` — the response includes sha256 hashes of each credential). | DevOps |
| 2.3 | **Stitch dashboard access for ≥2 team members.** At minimum one engineer (Backend or DevOps) and one finance/ops contact. Rotation must allow for someone to be available during incidents. | Stitch dashboard → Team settings. Record names + dashboard usernames in the ops runbook. | Team Lead |
| 2.4 | **Dispute / chargeback process documented.** Stitch's dispute workflow (notification → evidence submission → resolution SLA) summarised in `docs/INCIDENT-RESPONSE.md`. **VERIFY WITH STITCH DASHBOARD** — dispute timing windows and evidence requirements are not in the code. | Dispute runbook section (add to `INCIDENT-RESPONSE.md §5.5` before launch). | Commercial + Backend |
| 2.5 | **Platform custody reserve liquidity.** The platform custody account must hold enough balance to absorb disputes that land after a bounty is `PAID`/`LIVE` but before the platform recoups through operations. **Ballpark:** plan for 2–5× your expected weekly brand-funding volume — a conservative first-90-days float assuming 1–2% dispute rate and 30-day dispute resolution windows. Finance owns the exact figure. | Platform custody bank statement, reviewed monthly. | Commercial |
| 2.6 | **SLA + incident escalation contacts at Stitch.** Named contact, out-of-hours phone/email, support portal URL, acknowledged response SLA (e.g. 4h P1). | `docs/INCIDENT-RESPONSE.md §3` "Payment Processor Support" row — currently a placeholder (`[Stripe/Payment Provider]`). **ACTION REQUIRED:** update to Stitch specifics before launch. | DevOps + Commercial |
| 2.7 | **POPI/GDPR data processor agreement** with Stitch covering the personal data sent on hosted checkout (payer name, email). | Countersigned DPA; filed with privacy registry. | Legal / Compliance |

---

## 3. Environment variables — full list

Every variable below is loaded at boot by `apps/api/src/common/config/env.validation.ts`. The validator throws on boot if a required field is missing or malformed — do **not** disable this check.

Legend: **Req** — hard-required for `PAYMENTS_PROVIDER=stitch_live`. **Gate** — required only when `PAYOUTS_ENABLED=true` (not the live flip we're executing here). **Opt** — optional.

| Variable | Req? | Source / flow | Validator site | Common mistake |
|---|---|---|---|---|
| `PAYMENTS_PROVIDER` | **Req** | Set to `stitch_live` to enable live Stitch. Read by `StitchClient` (`stitch.client.ts:103`), `StitchPaymentsService.createBountyFunding` for KYB gate (`stitch-payments.service.ts:101`), `BeneficiaryService` live-id guard (`beneficiary.service.ts:99`), webhook replay RBAC (`stitch-webhook.controller.ts:47`). | `env.validation.ts:40-41` (`@IsEnum(PaymentsProvider)`) | Setting `stitch_live` without also populating `STITCH_CLIENT_ID` / `_SECRET` — the validator catches this via `@ValidateIf` on the four dependent fields (`env.validation.ts:43-57`). |
| `STITCH_CLIENT_ID` | **Req** | Stitch OAuth2 client id (production). Sent in the body of `POST /api/v1/token` (`stitch.client.ts:129`). | `env.validation.ts:43-45` | Pasting the sandbox id into the prod env; no naming convention distinguishes them — verify the id against your Stitch dashboard before deploying. |
| `STITCH_CLIENT_SECRET` | **Req** | Stitch OAuth2 client secret (production). Never committed; secret-manager only. | `env.validation.ts:47-49` | Whitespace or trailing newline on copy-paste silently changes the string; Stitch returns 401 on the token call with no clear error. |
| `STITCH_API_BASE` | **Req** | **`https://express.stitch.money`** for BOTH sandbox and live (Stitch Express is a single URL; credentials differentiate environments). Do not set this to `https://api.stitch.money` — that is **wrong** and inconsistent with every code path in this repo (`stitch.client.ts:100`, `STITCH-IMPLEMENTATION-STATUS.md:240`). See §9 blocker **B1** for the documentation fix needed in `go-live-checklist.md:53`. | `env.validation.ts:51-53` (`@IsUrl`) | Following the current `go-live-checklist.md:53` literally ("`STITCH_API_BASE=https://api.stitch.money (not sandbox)`") — this URL does not resolve and Stitch token calls will 404. |
| `STITCH_REDIRECT_URL` | **Req** | Production FQDN the payer is redirected to after hosted checkout (e.g. `https://app.socialbounty.cash/business/bounties/funded`). Appears in payment-link creation and must be pre-registered in the Stitch dashboard (`POST /api/v1/redirect-urls` — `stitch.client.ts:243`). | `env.validation.ts:55-57` (`@IsUrl`) | Using the default `http://localhost:3000/...` in prod; checkout page then bounces to localhost in the user's browser. Also: forgetting to register the URL in the Stitch dashboard — Stitch rejects unknown redirect targets. |
| `STITCH_WEBHOOK_SECRET` | **Req** | Svix signing secret for the webhook endpoint you registered with Stitch. Format `whsec_<base64>`. Read by `StitchWebhookController.receive` (`stitch-webhook.controller.ts:70`) and verified by `SvixVerifier.verify` (`svix.verifier.ts:27`). | `env.validation.ts:60-61` (optional at boot — but **absence = every webhook 401s**) | Setting the *wrong* secret (e.g. secret for a staging endpoint in the prod env). Stitch keeps retrying; the ops symptom is a silent backlog with no successful inbound events. Monitor the `POST /api/v1/admin/payments-health` "lastWebhook" field to detect this. |
| `STITCH_SYSTEM_ACTOR_ID` | **Req** | Users.id (UUID) of a real user row acting as the fallback `AuditLog.actorId` when the ledger writer has no human user in context (webhooks, schedulers). Read by `BrandFundingHandler.systemActorId` (`brand-funding.handler.ts:32`), `ReconciliationService.systemActorId` (`reconciliation.service.ts:49-50`). | `env.validation.ts:153-155` (`@ValidateIf(PAYMENTS_PROVIDER !== 'none')`) | Leaving the default dev UUID `00000000-0000-0000-0000-000000000001` when the prod DB was seeded with a different id. The FK constraint trips on the first audit-log write during a settlement webhook, and the webhook goes to `FAILED` with no ledger write. |
| `STITCH_PAYOUT_SPEED` | **Opt** | `DEFAULT` (3-business-day) or `INSTANT` (within 1h). Used only by the TradeSafe cutover path; unused in live payout today. | `env.validation.ts:64-65` | Setting `INSTANT` thinking it speeds up brand funding — it does not; this is a payout (outbound) speed only. |
| `STITCH_MIN_PAYOUT_CENTS` | **Opt** | Default `2000` (ZAR 20.00). Minimum threshold below which payouts are skipped. Outbound only. | `env.validation.ts:67-70` | Setting to 0 — will trigger micro-payouts that Stitch may reject for fee reasons. |
| `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | **Req** | Backing store for the Stitch token cache (`stitch.client.ts:110`, 14-minute TTL) and the webhook replay guard (the `webhook_events.UNIQUE(provider, externalEventId)` constraint is the authoritative dedupe, but Redis caching speeds up hot-path replay checks). **Critical:** with Redis missing, every API call re-fetches the Stitch token — at Stitch's 15-min token lifetime this is harmless in low volume but will exhaust rate limits at scale. | Not directly validated in `env.validation.ts`; read by `RedisService`. `/api/v1/health` reports `redis:error` when unreachable. | Using Redis without auth on a public network; always set `REDIS_PASSWORD` in prod. |
| `PAYOUTS_ENABLED` | **Opt (launch)** | Leave `false` for this cutover. Flipping to `true` requires TradeSafe integration + `BENEFICIARY_ENC_KEY` validation (ADR 0009, `env.validation.ts:170-176`). | `env.validation.ts:133-134` (`@IsBooleanString`) | Flipping to `true` without TradeSafe creds — outbound rail will throw at runtime. |
| `RECONCILIATION_ENABLED` | **Opt** | Default `true`; leave `true` in prod. Gates the 15-min `ReconciliationScheduler`. | `env.validation.ts:139-140` | Setting `false` and forgetting; ledger drift will not be detected. |
| `BENEFICIARY_ENC_KEY` | **Gate** | Only relevant when `PAYOUTS_ENABLED=true`. Must be ≥32 chars for AES-256. | `env.validation.ts:170-176` | Re-using `JWT_SECRET` — env validation blocks with the length check when payouts are on. |

**Env validator contract** is exercised by `apps/api/src/common/config/env.validation.spec.ts` (26 test cases). Before deploying, run it against the proposed prod `.env` file — `node -e "require('./dist/common/config/env.validation').validateEnv(process.env)"` against a built container, or shell into the staging image pointed at the prod vars.

---

## 4. Webhook configuration

### 4.1 Registering the webhook endpoint

The prod API will expose:

```
POST https://<prod-api-FQDN>/api/v1/webhooks/stitch
```

Handler lives at `apps/api/src/modules/webhooks/stitch-webhook.controller.ts:53-56` (`@Public()` + `@Post('stitch')` on the `@Controller('webhooks')`). The `api/v1` prefix is set globally in `apps/api/src/main.ts:72`.

**Registration steps (in the Stitch dashboard — VERIFY WITH STITCH DASHBOARD for the exact UI path):**

1. Log in to https://express.stitch.money with production credentials.
2. Navigate to Webhooks / Integrations section.
3. Add a new endpoint URL: the full prod URL above.
4. Copy the generated Svix signing secret (`whsec_<base64>`) — this becomes `STITCH_WEBHOOK_SECRET` in the prod secret store.
5. Subscribe to the event types listed in §4.3.
6. Save.

Alternatively (programmatic), the codebase includes `StitchClient.registerWebhook` (`stitch.client.ts:370-375`) which POSTs to `/api/v1/webhook` with a URL. This has never been exercised in live from this codebase — use the dashboard for the first registration.

### 4.2 Svix secret setup and rotation

The secret is a Svix `whsec_<base64>` string. `SvixVerifier.decodeSecret` (`svix.verifier.ts:75-78`) strips the prefix and base64-decodes the remainder for HMAC-SHA256.

**To rotate:**

1. In the Stitch dashboard, generate a new secret for the same endpoint (do not delete the old one yet).
2. Update `STITCH_WEBHOOK_SECRET` in the secret store.
3. Roll the API pods so the new secret is loaded.
4. Once all pods confirm healthy with the new secret (check `/api/v1/admin/payments-health.credsHashes.webhookSecret` hash has changed), disable the old secret in the dashboard.
5. Any Stitch webhooks signed with the old secret that arrive during the rotation window will fail verification (401), be persisted as `webhook_events.status=FAILED`, and Stitch will retry — so budget for ≤15 min of webhook backlog recovery once the new secret is fully rolled.

### 4.3 Required subscribed event types

Derive from `WebhookRouterService.dispatch` (`apps/api/src/modules/webhooks/webhook-router.service.ts:24-90`). The router keys on `(payload.type, payload.status)`, so the subscription list must cover every `(type, status)` pair the code handles:

| `type` | `status` | Handler | File:Line |
|---|---|---|---|
| `LINK` | `PAID` or `SETTLED` | `BrandFundingHandler.onPaymentSettled` | `webhook-router.service.ts:33-38`, `brand-funding.handler.ts:35` |
| `LINK` | `FAILED` or `EXPIRED` | `BrandFundingHandler.onPaymentFailed` | `webhook-router.service.ts:39-43`, `brand-funding.handler.ts:167` |
| `REFUND` | `PROCESSED` or `COMPLETED` | `RefundsService.onStitchRefundProcessed` | `webhook-router.service.ts:57-62` |
| `CONSENT` | `AUTHORISED` / `AUTHORIZED` / `CONSENTED` | `UpgradeService.processConsentAuthorised` | `webhook-router.service.ts:63-68` |
| `CONSENT` | `UNAUTHORISED` / `UNAUTHORIZED` / `FAILED` | `UpgradeService.processChargeFailed` | `webhook-router.service.ts:69-72` |
| `SUBSCRIPTION` | `AUTHORISED` / `AUTHORIZED` | `UpgradeService.processConsentAuthorised` | `webhook-router.service.ts:76-78` |
| `SUBSCRIPTION` | `PAID` / `SETTLED` | `UpgradeService.processRecurringCharge` | `webhook-router.service.ts:79-81` |
| `SUBSCRIPTION` | `FAILED` / `UNAUTHORISED` / `EXPIRED` / `CANCELLED` | `UpgradeService.processChargeFailed` | `webhook-router.service.ts:82-84` |
| `WITHDRAWAL` | *any* | Currently gated (`PAYOUTS_ENABLED=false`); handler exists but is dormant | `webhook-router.service.ts:44-56` |

**Unsubscribed events are silently dropped** at `webhook-router.service.ts:89` (logs `no handler wired for …` at `debug` level). The webhook event row is still persisted and marked `PROCESSED` — Stitch sees 200, no retry storm.

**VERIFY WITH STITCH DASHBOARD:** the exact event-type names in the dashboard subscription UI. The code reads `payload.type` and `payload.status` directly off the body; the dashboard UI may surface these as "Payment Link Paid", "Payment Link Settled", "Refund Processed" etc. Match the dashboard labels to the (type, status) pairs above when subscribing.

### 4.4 Replay-attack protection

Two layers:

1. **Timestamp skew gate.** `SvixVerifier.assertTimestampFresh` (`svix.verifier.ts:64-73`) rejects any webhook whose `svix-timestamp` differs from server time by more than `MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60` (five minutes). NTP must be working on prod hosts — see §7.
2. **Event-id dedupe.** `WebhookEventService.recordOrFetch` (`webhook-event.service.ts:25-58`) catches `P2002` on `webhook_events.UNIQUE(provider, externalEventId)` and returns the existing row with `isDuplicate: true`. The controller short-circuits with `{ received: true, duplicate: true }` (`stitch-webhook.controller.ts:107-109`) — no handler fires, no ledger write.

### 4.5 Log grep patterns for confirming webhook flow

After launch, to confirm webhooks are arriving and processing:

```bash
# Webhook received and processed successfully (expected happy path)
grep "routing STITCH LINK/SETTLED" <prod-logs>
grep "payment.settled processed bounty=" <prod-logs>

# Webhook arrived but dispatch failed (handler bug or ledger imbalance)
grep "webhook dispatch failed for" <prod-logs>

# Duplicate detected (good — means Stitch retried and we correctly no-op'd)
grep "webhook replay: STITCH/" <prod-logs>

# Svix verification failed (wrong secret, timestamp skew, or attack attempt)
grep "svix verification failed" <prod-logs>
```

SQL sanity-check (post-launch, `Superadmin` only via `pgAdmin` or the prod DB console):

```sql
-- Last hour of webhook events, grouped by status
SELECT status, COUNT(*)
FROM webhook_events
WHERE provider = 'STITCH'
  AND "receivedAt" > NOW() - INTERVAL '1 hour'
GROUP BY status;
-- Expect: PROCESSED >> FAILED; any RECEIVED older than ~1 min is a stuck row

-- Most recent failures
SELECT "externalEventId", "eventType", "errorMessage", attempts, "receivedAt"
FROM webhook_events
WHERE provider = 'STITCH' AND status = 'FAILED'
ORDER BY "receivedAt" DESC
LIMIT 20;
```

---

## 5. Pre-flip smoke test on live

The cutover is only complete once this test passes end-to-end on production with real money. Budget 20–30 minutes. Run during low-traffic hours.

**Preconditions:**
- `PAYMENTS_PROVIDER=stitch_live` deployed to prod API.
- `STITCH_CLIENT_ID`/`_SECRET`/`_WEBHOOK_SECRET`/`_REDIRECT_URL` all set per §3.
- Webhook endpoint registered in the Stitch dashboard per §4.1.
- Kill switch is **off** (`SystemSetting.financial.kill_switch.active = 'false'`).
- A Team Lead (to operate the UI) and a DevOps contact (to tail logs + query DB) are both online.
- Access to a real debit card / bank account loaded with at least R10 — the test spends R1, but allow margin for any retries.

**Step-by-step:**

1. **Pick or create a test brand in prod.**
   - Seed a brand via super admin UI with `kybStatus=APPROVED` (the live Stitch path enforces this at `stitch-payments.service.ts:101-107`).
   - Assign a test business-admin user (not your personal account; use an `@internal` email).

2. **Create a test bounty, ZAR 1.**
   - As the business admin, create a DRAFT bounty with a single reward of monetary value 1 (R1.00). Any bounty title is fine; use `LIVE-SMOKE-<yyyymmdd>`.

3. **Fund via Stitch hosted checkout.**
   - On the bounty detail page (or via the new `createBounty → immediate checkout` path per the mobile-UX pass), click the "Fund" / "Go Live" action — this calls `POST /api/v1/bounties/{id}/fund`, which routes to `StitchPaymentsService.createBountyFunding` (`stitch-payments.service.ts:47`).
   - Expect a redirect to `https://pay.stitch.money/...`. Complete payment with a real card.
   - Return-URL redirects to `STITCH_REDIRECT_URL` (e.g. `/business/bounties/funded?...`). The return page polls `resolveFundingStatus` (`stitch-payments.service.ts:195`) until the webhook flips the bounty.

4. **Verify the settlement webhook arrived and was processed.**
   - Open `GET /api/v1/admin/payments-health` as super admin; `lastWebhook.receivedAt` should be within the last minute, `lastWebhook.status = PROCESSED`, and the event type should be `unknown` or the Stitch-provided label with `type=LINK`.
   - OR query the DB directly:
     ```sql
     SELECT status, "eventType", "errorMessage", "processedAt"
     FROM webhook_events
     WHERE provider = 'STITCH'
     ORDER BY "receivedAt" DESC
     LIMIT 5;
     ```

5. **Verify the ledger group balances and the amount is correct.**
   - Find the test bounty's id. Then:
     ```sql
     -- Double-entry check: credits must equal debits for the group
     SELECT g.id, g."actionType", g."referenceId",
            SUM(CASE WHEN e.type = 'DEBIT' THEN e."amountCents" ELSE 0 END) AS debits,
            SUM(CASE WHEN e.type = 'CREDIT' THEN e."amountCents" ELSE 0 END) AS credits
     FROM ledger_transaction_groups g
     JOIN ledger_entries e ON e."transactionGroupId" = g.id
     WHERE g."actionType" = 'stitch_payment_settled'
       AND e."bountyId" = '<bounty-id>'
     GROUP BY g.id;
     -- Expect: 1 row; debits == credits. For a ZAR 1 bounty + Free tier:
     --   debits = credits = 103 cents (100 face + 3 global fee; admin fee 0 on Free)
     --   Exact split depends on tier; see FeeCalculatorService.forBrandFunding.
     ```
   - Also verify the brand_reserve leg specifically:
     ```sql
     SELECT SUM("amountCents")
     FROM ledger_entries
     WHERE "brandId" = '<brand-id>'
       AND "bountyId" = '<bounty-id>'
       AND account = 'brand_reserve'
       AND type = 'CREDIT';
     -- Expect: 100 (ZAR 1.00 = 100 cents)
     ```

6. **Verify `LedgerTransactionGroup.planSnapshot` is set.**
   - Plan snapshot (Non-Negotiable #9) is stored via `FeeCalculatorService.forBrandFunding` metadata on the StitchPaymentLink row (`stitch-payments.service.ts:155`). The snapshot of the brand tier is on `Bounty.planSnapshotBrand` (set in the same transaction, `stitch-payments.service.ts:170`). For the test bounty:
     ```sql
     SELECT "planSnapshotBrand", "brandAdminFeeRateBps", "globalFeeRateBps"
     FROM bounties WHERE id = '<bounty-id>';
     -- Expect: planSnapshotBrand is 'FREE' or 'PRO', fee rate bps populated.
     ```

7. **Verify the AuditLog row exists.**
   ```sql
   SELECT action, "entityType", "entityId", "actorId", "actorRole", "createdAt"
   FROM audit_logs
   WHERE action = 'BOUNTY_FUNDED'
     AND "entityId" = '<bounty-id>'
   ORDER BY "createdAt" DESC LIMIT 1;
   -- Expect: 1 row; actorId matches the business admin's user.sub (or
   -- STITCH_SYSTEM_ACTOR_ID if the originator metadata was lost).
   ```

8. **Run reconciliation manually; expect no new drift.**
   - Super admin UI: navigate to `/admin/finance` → Reconciliation → "Run Now".
   - Or via API: `POST /api/v1/admin/finance/reconciliation/run` (SUPER_ADMIN gated).
   - Expect: findings count unchanged (any new findings indicate a real problem with the test transaction).

9. **Refund the 1 ZAR to return test funds and exercise the compensating-entry path.**
   - Super admin UI: `/admin/finance/overrides` → post a balanced compensating entry reversing the `brand_reserve` credit (per ADR 0006). Reason field: "Live smoke-test cleanup, ref: LIVE-SMOKE-<yyyymmdd>".
   - Or for the externally-visible Stitch refund: `POST /api/v1/admin/finance/refunds` → `RefundsService.create` calls `StitchClient.createRefund` (`stitch.client.ts:196`).
   - Either path preserves ledger integrity — the override writes a balanced compensating ledger group bypassing the kill switch (`ADR 0006`), while the Stitch refund triggers a `REFUND/PROCESSED` webhook which `RefundsService.onStitchRefundProcessed` translates to a compensating `refund_processed` group.
   - Verify the refund with:
     ```sql
     SELECT "actionType", SUM(CASE WHEN e.type = 'DEBIT' THEN 1 ELSE -1 END)
     FROM ledger_transaction_groups g JOIN ledger_entries e ON ...
     WHERE e."bountyId" = '<bounty-id>'
     GROUP BY "actionType";
     -- Expect two rows: stitch_payment_settled + either compensating_entry or refund_processed.
     ```

10. **Final reconciliation check after refund.**
    - Re-run reconciliation; expect no new critical findings. The `checkStitchVsLedger` check (`reconciliation.service.ts:590`) will confirm the SETTLED `StitchPaymentLink` and the `stitch_payment_settled` ledger group are consistent; the refund handler preserves this invariant.

If any step fails, **flip the kill switch immediately** and do not proceed. See §8 Rollback.

---

## 6. Kill-switch integration — sanity check

The Financial Kill Switch (`SystemSetting` row `financial.kill_switch.active`, **not** an env var — the legacy `FINANCIAL_KILL_SWITCH` env was removed 2026-04-15 per orphan sweep C2, see `env.validation.ts:72-75`) is the ledger-write circuit breaker.

### 6.1 How to flip it during a live incident

- **UI path:** `/admin/finance` → Kill Switch toggle. Requires SUPER_ADMIN. Audit-logged via `@Audited('KILL_SWITCH_TOGGLE', 'System')` at `finance-admin.controller.ts:184-191`.
- **API path (emergency):** `POST /api/v1/admin/finance/kill-switch` with body `{ "active": true, "reason": "<≥10 chars>" }`. Service: `finance-admin.service.ts` → `LedgerService.setKillSwitch` (`ledger.service.ts:241`).
- **Incident runbook:** `docs/INCIDENT-RESPONSE.md §5` (which currently does not mention the kill switch explicitly — **ACTION REQUIRED**, see §9 blocker B2).

### 6.2 What flipping it ON does

- `LedgerService.postTransactionGroup` checks the switch at `ledger.service.ts:118-121` **before** writing any leg. When active, it throws `KillSwitchActiveError` (HTTP 403 via `ForbiddenException`, `ledger.service.ts:69-73`).
- Inbound Stitch webhooks **are still received, verified, and persisted** to `webhook_events` — what fails is the downstream handler (`BrandFundingHandler.onPaymentSettled` calls `LedgerService.postTransactionGroup` at `brand-funding.handler.ts:74`). The controller catches the error (`stitch-webhook.controller.ts:117-139`) and marks the event `FAILED` with the error message.
- Stitch (via Svix) sees our 200 response (the controller returns `{ received: true, duplicate: false }` even on handler failure — see `stitch-webhook.controller.ts:141`, and note the error is caught and logged, not re-raised). **Important:** this means Stitch will **not** retry the event. The `webhook_events.status=FAILED` row is the record — after kill-switch release, an operator must use `POST /api/v1/webhooks/stitch/replay/:eventId` (SUPER_ADMIN, non-live-provider only — `stitch-webhook.controller.ts:42-51`) to replay, OR the `ReconciliationService.checkStatusConsistency` check will flag the `stitch_payment_settled`-group-missing case (`reconciliation.service.ts:358-385`).

**Wait — the replay endpoint is gated off in `stitch_live` (`stitch-webhook.controller.ts:47`).** In prod, replay is NOT available. The only recovery path after a kill-switch-blocked live webhook is: release the kill switch, then manually reconstruct the ledger group via a compensating entry through `/admin/finance/overrides` (ADR 0006) — which is exactly the by-design recovery mechanism. The `checkStatusConsistency` reconciliation check surfaces the missing group within the next 15-min cron tick.

### 6.3 What it does NOT do

- Does **not** pause webhook **delivery**. Stitch will keep sending, we just refuse to process. This is by design — the `webhook_events` table preserves the full payload so nothing is lost.
- Does **not** reject already-posted ledger entries. The ledger is append-only (Non-Negotiable #5).
- Does **not** block compensating entries — the narrow opt-out flag defined by ADR 0006 is set in exactly two callers: `FinanceAdminService.postOverride` and `devSeedPayable`, both SUPER_ADMIN-gated and enforced by `scripts/check-kill-switch-bypass.sh` in CI. (See ADR 0006 for the exact flag name and authorised bypass list — we avoid citing the literal flag name here so this docs file is not itself flagged by the CI guard.)

### 6.4 Stitch retry-backoff implications

Because our controller returns 200 even on handler failure, Stitch does **not** retry failed events. This is a deliberate choice — Svix retries would compound the problem if the kill switch was triggered by a ledger bug that would equally affect the retry. The trade-off is that reconciliation + manual compensating entries are the sole recovery path after a kill-switch incident. Document this explicitly in the incident runbook.

---

## 7. Monitoring & alerting — Stitch-specific

Hook these into whatever observability platform you use (Sentry for errors, a metrics platform for dashboards, Slack/PagerDuty for alerts).

| Signal | Threshold / Alert | Source | Rationale |
|---|---|---|---|
| **Webhook success rate** | `<99%` sustained for 10 min → warn; `<95%` → page | `SELECT COUNT(*) FILTER (WHERE status='PROCESSED')::float / COUNT(*) FROM webhook_events WHERE provider='STITCH' AND "receivedAt" > NOW() - INTERVAL '10 min'` | Catches silent webhook handler bugs, DB outages, kill-switch incidents. |
| **Settlement latency** | `funded → settled` webhook arrival time. Normal: sub-second to a few minutes (Stitch pushes ~instantly after a successful checkout). `>15 min` for any single transaction → investigate. | Compare `StitchPaymentLink.createdAt` to `WebhookEvent.receivedAt` for the matching `stitchPaymentId`. | Long gaps indicate either payer abandonment (no alert needed) or Stitch outage (alert). |
| **Webhook replay-rejection counter** | `>10 duplicate events / hour` sustained → investigate | Count `webhook_events` rows where recording found an existing row (`stitch-webhook.controller.ts:107-109` — controller returns `duplicate: true`). Not currently emitted as a metric — **VERIFY:** wire a counter at that line. | High replay rate means Stitch thinks our ack is failing. Possible causes: timeouts under load, silent 5xx from the ack. |
| **`webhook_events.status=RECEIVED` backlog** | Any row in `RECEIVED` state older than 2 minutes → page | `SELECT COUNT(*) FROM webhook_events WHERE status='RECEIVED' AND "receivedAt" < NOW() - INTERVAL '2 min'` | `RECEIVED` means persisted-but-not-dispatched-and-not-marked-processed — i.e. the API process crashed mid-handler. |
| **Reconciliation `stitch-vs-ledger`** | Any critical finding → auto-flips kill switch (already wired — `reconciliation.service.ts:97-100`) | `ReconciliationFindings` table + dashboard at `/admin/finance` | Check 7 in the reconciliation engine; see `reconciliation.service.ts:590-618`. |
| **`/admin/payments-health` token probe** | `stitchTokenProbe.ok === false` → critical alert | `GET /api/v1/admin/payments-health` (SUPER_ADMIN) | Proves Stitch auth is reachable with current credentials. Wire an uptime monitor to poll this every 5 min. |
| **Svix timestamp skew failures** | `>5 per hour` from a single source → investigate | `grep "svix-timestamp outside tolerance"` in API logs | Indicates clock drift on the API host (NTP broken) OR an attack attempt. NTP is non-negotiable — see `svix.verifier.ts:64-73`. |
| **Refund processing failures** | Any `REFUND/PROCESSED` webhook that fails dispatch | `webhook_events WHERE "eventType" LIKE '%REFUND%' AND status='FAILED'` | Refunds are financially critical; failures risk keeping funds out of brand hands. |

Sentry hook points (add if not already wired):

- Every `StitchApiError` throw in `stitch.client.ts:77-86` — these are 4xx or 5xx from Stitch itself. 4xx = our request is malformed; 5xx = Stitch outage.
- `SvixVerificationError` in `svix.verifier.ts:6-11` — repeated verification failures = rotation bug or attack.

---

## 8. Rollback & blast-radius

### 8.1 Scenario A — A live webhook processed but landed a bad ledger entry

**Compensating-entry path only.** ADR 0006 governs.

1. Kill switch ON (`/admin/finance` → toggle).
2. Identify the bad entry: `SELECT * FROM ledger_entries WHERE "transactionGroupId" = '<groupId>'`.
3. Post a balanced compensating group via `/admin/finance/overrides` (SUPER_ADMIN, typed confirmation word, ≥10-char reason). This writes `actionType='compensating_entry'` with a fresh UUID as `referenceId`, so it never collides with the forward group (ADR 0005).
4. Do **not** `UPDATE` or `DELETE` the bad row. Append-only (Non-Negotiable #5).
5. Post-incident: write the KB entry (`claude.md §9` triggers a mandatory entry on any duplicate / imbalance).

### 8.2 Scenario B — Need to pause all live flows for a deploy / investigation

**Kill switch.** Flip, deploy, verify, flip off.

- Brand funding calls throw `ServiceUnavailableException("Funding paused")` in the pre-flight check (`stitch-payments.service.ts:83-85`). Note: this happens **before** the Stitch API call, so no orphaned payment link is created.
- Subscription upgrade flow: inbound webhook processing fails as described in §6.2 — the in-flight `subscription_charged` ledger group cannot post; reconciliation will flag the mismatch after kill-switch release.
- Reconciliation runs continue (read-only) and log their findings.

### 8.3 Scenario C — Live credentials leaked

**Rotate.** Procedure:

1. Notify Stitch support via escalation channel (§2.6). Request immediate revocation of the leaked `STITCH_CLIENT_SECRET`.
2. Stitch issues new credentials — receive and store in the secret manager.
3. Deploy the new credentials on a rolling basis:
   - Pod A receives new env vars, restarts.
   - Pod B receives new env vars, restarts.
   - Etc.
   - During the rolling window, API calls from pods still holding the old credentials will 401 on the next Stitch token call. Stitch token cache TTL is 14 min (`stitch.client.ts:9`); after that the old credentials stop working. Budget 15–20 min for full propagation.
4. **Rotate the webhook secret too.** Even if the webhook secret wasn't specifically leaked, rotating it together closes the covered-surface. See §4.2 procedure — expect a ≤15 min webhook backlog during the rotation.
5. Any in-flight Stitch API requests during the rotation will fail 401 and bubble up as `StitchApiError`; the retry-wrapper (`stitch.client.ts:396-433`) only retries 5xx, so 401s surface to the caller immediately. Document this expected behaviour.
6. After rotation: grep the audit log for any unexpected activity between suspected leak time and rotation:
   ```sql
   SELECT * FROM audit_logs
   WHERE action IN ('BOUNTY_FUNDED', 'FINANCIAL_OVERRIDE', 'PAYOUT_INITIATED')
     AND "createdAt" BETWEEN '<leak-t>' AND '<rotation-t>';
   ```

### 8.4 What rollback cannot do

- **Cannot reverse ledger writes.** Ledger is append-only. Rolled-back code + uncorrected ledger = state mismatch. Always correct via compensating entries, never via ledger mutation.
- **Cannot unring a Stitch-side settlement.** Once Stitch has settled a payment link, the money has moved to platform custody. Reversal = a refund.
- **Cannot undo a webhook that was acked with a bad ledger post.** See Scenario A.

---

## 9. Known unknowns / blockers / R-register candidates

**Items marked ACTION REQUIRED block the live flip and must be resolved before cutover.**

- **B1 — ACTION REQUIRED: Fix the STITCH_API_BASE URL in `docs/deployment/go-live-checklist.md:53`.** That checklist currently reads `[ ] STITCH_API_BASE=https://api.stitch.money (not sandbox)`. This URL is wrong. Stitch Express uses `https://express.stitch.money` for both sandbox and live environments — credentials differentiate, not URL. All code paths (`stitch.client.ts:100`, `env.validation.spec.ts:20`, `STITCH-IMPLEMENTATION-STATUS.md:240`) plus the vendor docs (`.claude/skills/DevStitchPayments/SKILL.md:26`) agree. Following the checklist literally will produce a non-resolving URL and cause every Stitch API call to fail. **Fix:** change line 53 to `STITCH_API_BASE=https://express.stitch.money` (same URL as sandbox). Non-blocking for this doc (not in its scope per non-goals), but the live flip cannot execute against `api.stitch.money`.

- **B2 — ACTION REQUIRED: `docs/INCIDENT-RESPONSE.md` lacks kill-switch flip procedure.** The runbook's `§5 Response Procedures` does not name the kill switch. On-call needs a named, numbered step ("5.5 Financial incident — kill switch flip"). Team Lead to add before launch.

- **B3 — ACTION REQUIRED: `docs/INCIDENT-RESPONSE.md §3` lists `[Stripe/Payment Provider]` as the escalation contact for payment issues.** Stitch-specific contact must replace this before launch. DevOps + Commercial to provide.

- **U1 — Unverifiable from code: exact Stitch dashboard event-type labels.** §4.3 lists the `(type, status)` pairs our router handles, but the dashboard UI for subscribing to webhooks may name them differently (e.g. "Payment Link Paid" vs our code's `type=LINK, status=PAID`). **VERIFY WITH STITCH DASHBOARD** during webhook registration in §4.1.

- **U2 — Unverifiable from code: live-mode rate limits.** Stitch's token endpoint and API rate limits in production are not documented in this codebase. Sandbox has been exercised without rate-limit issues at dev traffic. A sudden spike (e.g. a viral bounty) might hit unknown ceilings. Mitigation: the 14-min token cache (`stitch.client.ts:9`) reduces token calls to ~5/h per pod; the 3-retry wrapper on 5xx (`stitch.client.ts:12,396-433`) smooths transient issues. **VERIFY WITH STITCH** as part of §2.6 SLA discussion.

- **U3 — The live Stitch API base URL has never been hit from this codebase.** The base URL is identical to sandbox so transport-level behaviour should be indistinguishable; however, no production codepath has exercised auth against live creds. The pre-flip smoke test (§5) is the first exercise. Accept the residual risk — the smoke test catches any surprise before brand traffic.

- **U4 — `createBeneficiary` uses a synthetic `local:*` id in live mode too** (`stitch.client.ts:269-285`). This is already guarded: `BeneficiaryService` throws in `stitch_live` when the id starts with `local:` (`beneficiary.service.ts:98-102`). **No action needed for this cutover** because `PAYOUTS_ENABLED=false` means no beneficiary rows are written. But the guard is defensive-in-depth — if the payout rail is ever flipped on prematurely, this is the canary.

- **R31 (new) — Commercial / liquidity risk:** platform custody must hold dispute reserves per §2.5. If the first 90 days of live traffic show a higher-than-1% dispute rate, the float needs adjusting before dispute resolution windows close. Monitor via `StitchPayment.status` changes post-settlement and any Stitch dispute webhooks (**VERIFY WITH STITCH** — dispute webhook event type is not in our current `WebhookRouterService.dispatch`).

- **R32 (new) — Operational risk: no automated retry after kill-switch-blocked webhook.** As documented in §6.2, a webhook processed during kill-switch active is marked FAILED, acked to Stitch, and Stitch does not retry. Recovery requires a manual compensating entry. Mitigations: reconciliation catches the mismatch within 15 min; replay endpoint is gated out of live (`stitch-webhook.controller.ts:47`); the narrow window of exposure is usually minutes, during which volume is typically low. Accept.

---

## 10. Sign-off

| Role | Name | Signature | Date | Scope confirmed |
|---|---|---|---|---|
| Team Lead | | | | Sections 1, 2, 6, 8, 10; blocker resolution |
| Backend Lead | | | | Sections 3, 4, 5, 6, 8 (code-level); test evidence |
| DevOps | | | | Sections 3, 4, 7, 8 (ops-level); env provisioning |
| Security / Compliance | | | | Section 4.2 (secret rotation), §8.3 (creds-leak), §2.7 (DPA) |
| Commercial | | | | Section 2 (prerequisites); SLA + liquidity reserve |

**No cutover without all five signatures.** Each signatory has read and accepts responsibility for their scope. The Team Lead is the single point of accountability for the decision to flip `PAYMENTS_PROVIDER=stitch_live`.

---

*This document is operational-not-theoretical. If you find a drift between this doc and the code, the code is the source of truth — update this doc immediately, don't trust a stale citation.*
