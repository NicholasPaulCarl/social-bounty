# Stitch Implementation Status

**Last updated:** 2026-04-15
**Owner:** Architect (system design reference)
**Audience:** New teammates, returning agents, finance reviewers. Read this first.

> This is the 5-minute orientation document for the Stitch Express payment system. For the canonical gateway spec see [`md-files/payment-gateway.md`](../md-files/payment-gateway.md). For ledger mechanics see [`md-files/financial-architecture.md`](../md-files/financial-architecture.md). For phased delivery see [`md-files/implementation-phases.md`](../md-files/implementation-phases.md).

---

## Status at 2026-04-15

Stitch Express is integrated as the **inbound** rail (brand-side bounty funding) and has been live-tested in sandbox end-to-end: fund → approve → clear. The double-entry ledger, idempotency guards, AuditLog coupling, Kill Switch, reconciliation engine, Finance admin dashboard (9 modules), and KB automation (Phase 4 including Ineffective Fix auto-flag) are shipped. The **outbound** rail (hunter payouts) is gated: Stitch has no multi-recipient payout surface, so per [ADR 0008](adr/0008-tradesafe-for-hunter-payouts.md) TradeSafe will be the outbound rail — that integration is a separate workstream and is not shipping today. `PAYOUTS_ENABLED=false` in all non-dev environments.

---

## What's shipped and live-tested

### Inbound brand funding (Stitch Express hosted checkout)
- Brand → platform reserve funding flow per `payment-gateway.md` §8.1.
- Live sandbox proof: [`docs/reviews/2026-04-15-phase-2-live-test.md`](reviews/2026-04-15-phase-2-live-test.md) walks a real fund → approve → clearance cycle through the API, the Stitch sandbox, and the ngrok-tunnelled webhook path. Bounty `bde31e12-f798-48e9-8c5e-d799a140d4e5` (ZAR 2 800) and the `dev/seed-payable` ZAR 50 position both post balanced ledger groups.
- Stitch OAuth2 client (`/api/v1/oauth2/token`) and withdrawal endpoint (`/api/v1/withdrawal`) both confirmed reachable from the running stack.

### Double-entry ledger
- `ledger_entries` + `ledger_transaction_groups` with canonical accounts from `financial-architecture.md` §2 (`gateway_clearing`, `brand_reserve`, `admin_fee_revenue`, `global_fee_revenue`, `processing_expense`, `bank_charges`, `hunter_net_payable`, `hunter_available`, `payout_in_transit`, `hunter_paid`, `payout_fee_recovery`).
- Integer minor units (cents) only. No floats. Append-only — no updates or deletes; corrections land as compensating entries.

### Idempotency
- `LedgerTransactionGroup.UNIQUE(referenceId, actionType)` — see [ADR 0005](adr/0005-ledger-idempotency-via-header-table.md).
- `WebhookEvent.UNIQUE(provider, externalEventId)` — Svix-verified inbound webhooks are replay-safe.
- Payout dispatch uses a client-side `idempotencyKey` against the Stitch API.

### AuditLog coupling
- Every ledger write is accompanied by an `AuditLog` row (Hard Rule #3). Webhook and scheduler-driven writes use `STITCH_SYSTEM_ACTOR_ID` as the actor fallback.

### Financial Kill Switch
- Manual toggle via `FINANCIAL_KILL_SWITCH=true` and Super Admin dashboard control.
- Auto-trip on Critical reconciliation findings (ledger imbalance, duplicate transaction, missing leg).
- Compensating-entry bypass enforced per [ADR 0006](adr/0006-compensating-entries-bypass-kill-switch.md) and guarded by `npm run check:kill-switch-bypass` in CI.

### Reconciliation engine
- Batch every 15 min. All 7 checks per `financial-architecture.md` §6 are now implemented (batch 11A, 2026-04-15):
  1. **Balance** — `checkGroupBalance` (sum credits == sum debits per group; critical).
  2. **Duplicate groups** — `checkDuplicateGroups` (UNIQUE `(referenceId, actionType)` integrity; critical).
  3. **Reserve vs bounty** — `checkReserveVsBounty` (per-bounty `brand_reserve` balance; warning). Single-`GROUP BY` after batch 11B perf mitigation.
  4. **Missing legs** — `checkMissingLegs` (every transaction group has ≥ 2 legs; critical).
  5. **Status consistency** — `checkStatusConsistency` (Bounty PAID ⇔ `stitch_payment_settled` group; Submission APPROVED ⇔ `submission_approved` group; warning, four anti-joins).
  6. **Wallet projection drift** — `checkWalletProjectionDrift` (cached `Wallet.balance` vs ledger projection per ADR 0002; warning).
  7. **Stitch vs ledger** — `checkStitchVsLedger` (SETTLED `StitchPaymentLink` / `StitchPayout` requires the matching ledger group; critical).
- All checks are read-only set-based scans; Kill-Switch state is immaterial to safety.
- Findings feed the Exception module and the auto-trip Kill Switch pathway (any `critical` finding flips the switch via `LedgerService.setKillSwitch`).
- Performance projection at B = 10 k paid bounties: ~400 ms end-to-end across all 7 checks. 15-min cadence remains safe well past 100 k. See `docs/perf/2026-04-15-reconciliation-benchmarks.md` §7.

### Finance admin dashboard — 9 modules
1. Overview (live balances + kill switch state)
2. Inbound (brand funding groups, Stitch external references)
3. Reserves (per-bounty reserve balances vs face value)
4. Earnings & Payouts (hunter earnings, clearance windows, payout state)
5. Refunds (pre-approval, post-approval, post-payout paths)
6. Overrides (manual adjustments with reason + compensating entries)
7. Exceptions (reconciliation findings severity-tagged)
8. Audit Trail (every ledger-touching action)
9. Exports (CSV for every module, Stitch ref + `transactionGroupId` included)

### KB automation (Phase 4 complete)
- `RecurringIssue` table populated by reconciliation findings and `claude.md` §9 triggers.
- Root-cause signature matching bumps `recurrenceCount` on recurrence.
- Prior KB entry is auto-flagged **Ineffective Fix** when the same signature fires twice within the recurrence window.
- KB Insights panel + Confidence Score live in the admin dashboard (`admin-dashboard.md` §5–6).
- Claude context tool: `scripts/kb-context.ts` pulls top-N relevant KB entries for a file path or system; wired into the Agent Team Lead context.

### Hunter-facing read surfaces
- Hunter wallet timeline (earnings, pending, available, paid). Projected from ledger per [ADR 0002](adr/0002-wallet-read-model-projection.md).
- Hunter payouts history — **read-only** (history surface works; the execution rail is gated behind TradeSafe).

### Brand / subscription surfaces
- Brand KYB intake and review.
- Subscription admin: monthly prepaid, plan snapshot, failed-billing grace (3 days) and downgrade.

### Exports
- CSV export on every dashboard module. All exports include Stitch external reference + `transactionGroupId` for third-party reconciliation.

### Expired-bounty release scheduler
- Cron job releases unclaimed `brand_reserve` positions back to brand wallet after bounty expiry. Idempotent; logged to `JobRun`.

---

## What's gated and why

| Gate | State | Reason |
|---|---|---|
| `PAYOUTS_ENABLED` | `false` by default | Hunter payout rail is TradeSafe per [ADR 0008](adr/0008-tradesafe-for-hunter-payouts.md). Stitch has no multi-recipient surface. Integration workstream pending. |
| Upgrade CTA (Free → Pro) | Live (batch 10, task B) | `POST /subscription/upgrade` → Stitch `/api/v1/subscriptions` returns hosted consent URL; webhook router dispatches `SUBSCRIPTION/AUTHORISED`, `SUBSCRIPTION/PAID`, `SUBSCRIPTION/FAILED`; balanced `subscription_charged` ledger group (idempotent on `stitchPaymentId`). |
| `stitch_live` provider mode | Rejects `local:` beneficiary ids | Synthetic `local:<userId>` beneficiaries are dev-only; `BeneficiaryService` guard blocks them in live mode. |
| Kill Switch | Auto-trip armed | Fires on any Critical reconciliation finding. Manual release required — not auto-reset. |

---

## Out of scope per ADR 0008

Hunter payouts via **TradeSafe** (a dedicated workstream). Not landing in this release.

Summary of the decision:
- 12 Stitch Express endpoints were probed during the Phase 2 live test. None expose a multi-recipient payout surface suitable for hunter disbursement.
- TradeSafe was selected as the outbound rail. It is South Africa's longest-running digital escrow service, gives us a registered-escrow payout rail with multi-recipient disbursement, and a stronger compliance posture than direct-to-bank.
- [ADR 0008](adr/0008-tradesafe-for-hunter-payouts.md) supersedes [ADR 0007 (Peach Payments)](adr/0007-peach-payments-for-hunter-payouts.md). Peach was the previous candidate; no Peach integration work was started, so the unwind is documentation-only.
- [ADR 0003 (TradeSafe Out of Scope)](adr/0003-tradesafe-out-of-scope.md) is partially superseded — TradeSafe is now in scope for the payout rail but remains out of scope as a standalone escrow layer.

Everything currently shipped is **provider-agnostic below the LedgerService**. The TradeSafe integration will add webhook routes and beneficiary tables; it will not change the accounts, the double-entry model, or the dashboard.

---

## Runbook

### Starting the stack locally

```bash
# 1. Redis (required — /health reports redis:error if missing)
redis-server &

# 2. Postgres: Supabase via DIRECT_URL (see .env)
#    No local install needed; the API connects to Supabase directly.

# 3. API (NestJS, port 3001)
cd apps/api && npm run dev

# 4. Web (Next.js, port 3000)
cd apps/web && npm run dev

# 5. Health check
curl -s localhost:3001/api/v1/health
```

### Seed command

```bash
cd packages/prisma && npm run seed
```

Seeds include:
- `admin@socialbounty.cash`, `superadmin@demo.com` (SUPER_ADMIN)
- `participant@demo.com` (PARTICIPANT)
- `STITCH_SYSTEM_ACTOR_ID=00000000-0000-0000-0000-000000000001` system actor row (required — AuditLog FK).

### OTP login trick (dev only)

Auth is passwordless OTP. SMTP fails silently in sandbox, so read the OTP out of Redis:

```bash
# 1. Request OTP
curl -X POST http://localhost:3001/api/v1/auth/request-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@socialbounty.cash"}'

# 2. Read it from Redis
redis-cli get 'otp:admin@socialbounty.cash'
# → {"email":"…","otp":"NNNNNN","attempts":0}

# 3. Verify and get the JWT (15-minute lifetime)
curl -X POST http://localhost:3001/api/v1/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@socialbounty.cash","otp":"NNNNNN"}' | jq -r .accessToken
```

### `dev/seed-payable` endpoint

For Phase 2 / payout loop testing without burning a real funded bounty:

```bash
curl -X POST http://localhost:3001/api/v1/admin/finance/dev/seed-payable \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"<participant-userId>","faceValueCents":5000}'
```

Posts a balanced ledger group: `brand_reserve → hunter_net_payable` with `clearanceReleaseAt = now() - 60s`. Combine with `CLEARANCE_OVERRIDE_HOURS_FREE=0.0083` to exercise the clearance scheduler in seconds.

### ngrok tunnel for webhook dev

```bash
ngrok http 3001
# then configure the webhook URL in the Stitch dashboard:
#   https://<your-subdomain>.ngrok-free.dev/api/v1/webhooks/stitch
# inspector: http://127.0.0.1:4040
```

### Webhook secret

Stored in `.env` as `STITCH_WEBHOOK_SECRET`. Svix signature verification is performed at the route guard — any mis-signed payload is rejected before it reaches the handler. `WebhookEvent.UNIQUE(provider, externalEventId)` ensures replay safety.

---

## CI guards

| Check | Command | What it guards |
|---|---|---|
| Kill Switch bypass lint | `npm run check:kill-switch-bypass` | Enforces [ADR 0006](adr/0006-compensating-entries-bypass-kill-switch.md). Flags any ledger-writing call site that bypasses `LedgerService` guards. |
| Jest unit + integration | `npm test` (1 061+ tests) | Ledger handlers, webhook handlers, RBAC, reconciliation, KB automation. Hard Rule #4 requires 100% pass before release. |
| Playwright smoke | `npm run test:e2e -- --grep @smoke` | Critical user journeys (login, bounty list, submission create, finance dashboard load). |

---

## ADRs (0001–0008)

| # | Title | Status |
|---|---|---|
| [0001](adr/0001-stripe-retirement-timing.md) | Stripe Retirement Timing | Accepted |
| [0002](adr/0002-wallet-read-model-projection.md) | Wallet as Read-Model Projection Over LedgerEntry | Accepted |
| [0003](adr/0003-tradesafe-out-of-scope.md) | TradeSafe Escrow Layer Out of Scope | Partially superseded by ADR 0008 |
| [0004](adr/0004-feature-flag-inventory.md) | Feature Flag Inventory for Stitch Rollout | Accepted |
| [0005](adr/0005-ledger-idempotency-via-header-table.md) | Ledger Idempotency Lives on the Transaction Group Header | Accepted |
| [0006](adr/0006-compensating-entries-bypass-kill-switch.md) | Compensating Entries Bypass the Financial Kill Switch | Accepted |
| [0007](adr/0007-peach-payments-for-hunter-payouts.md) | Peach Payments for Hunter Payouts | Superseded by ADR 0008 |
| [0008](adr/0008-tradesafe-for-hunter-payouts.md) | TradeSafe for Hunter Payouts | Accepted |

---

## Audits

| Batch | Date | File |
|---|---|---|
| Phases 0–3 Team Lead Audit | 2026-04-15 | [reviews/2026-04-15-team-lead-audit-phases-0-3.md](reviews/2026-04-15-team-lead-audit-phases-0-3.md) |
| Team Lead Audit — Batch 2 | 2026-04-15 | [reviews/2026-04-15-team-lead-audit-batch-2.md](reviews/2026-04-15-team-lead-audit-batch-2.md) |
| Team Lead Audit — Batch 3 | 2026-04-15 | [reviews/2026-04-15-team-lead-audit-batch-3.md](reviews/2026-04-15-team-lead-audit-batch-3.md) |
| Team Lead Audit — Batch 4 | 2026-04-15 | [reviews/2026-04-15-team-lead-audit-batch-4.md](reviews/2026-04-15-team-lead-audit-batch-4.md) |
| Team Lead Audit — Batch 5 | 2026-04-15 | [reviews/2026-04-15-team-lead-audit-batch-5.md](reviews/2026-04-15-team-lead-audit-batch-5.md) |
| Team Lead Audit — Batch 6 | 2026-04-15 | [reviews/2026-04-15-team-lead-audit-batch-6.md](reviews/2026-04-15-team-lead-audit-batch-6.md) |
| Phase 2 Live Test | 2026-04-15 | [reviews/2026-04-15-phase-2-live-test.md](reviews/2026-04-15-phase-2-live-test.md) |

---

## Environment variables

Cross-reference [`.env.example`](../.env.example) for templates. Stitch + system vars only:

| Variable | Purpose |
|---|---|
| `PAYMENTS_PROVIDER` | `none` / `stitch_sandbox` / `stitch_live`. Gates checkout creation. Safe dev default: `stitch_sandbox`. |
| `STITCH_API_BASE` | `https://express.stitch.money`. Do not change. |
| `STITCH_CLIENT_ID` | OAuth2 client id (sandbox or live). |
| `STITCH_CLIENT_SECRET` | OAuth2 client secret. Secret — never commit. |
| `STITCH_WEBHOOK_SECRET` | Svix signing secret. Verifies inbound webhooks. |
| `STITCH_REDIRECT_URL` | Return URL after hosted checkout. Defaults to `http://localhost:3000/business/bounties/funded`. |
| `STITCH_PAYOUT_SPEED` | `DEFAULT` (used when the TradeSafe cutover happens; currently unused in live payout). |
| `STITCH_MIN_PAYOUT_CENTS` | Payout skip threshold. Default `2000` (ZAR 20.00). |
| `STITCH_SYSTEM_ACTOR_ID` | Users.id of the system actor used by webhook/cron-driven ledger writes. AuditLog FK to users.id, so must be a real row. Seeded as `00000000-0000-0000-0000-000000000001`. |
| `FINANCIAL_KILL_SWITCH` | `true` halts all ledger writes except compensating entries (ADR 0006). |
| `PAYOUTS_ENABLED` | Gates the payout scheduler. `false` everywhere until TradeSafe is live. |
| `CLEARANCE_OVERRIDE_HOURS_FREE` | DEV/STAGING ONLY. Fractional hours. Bypasses the 72h Free-tier clearance window. Leave unset in production. |
| `CLEARANCE_OVERRIDE_HOURS_PRO` | DEV/STAGING ONLY. Bypasses Pro-tier clearance (default 0h). Leave unset in production. |

Non-Stitch system vars that the payment stack depends on:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres. `DIRECT_URL` is the migration + ledger read path. |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_DB` | Redis for sessions, OTP, rate limits. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Auth tokens. Required; no default. |
| `SENTRY_DSN` | Error tracking. Optional locally, required in production. |

---

## Batch 8 additions (2026-04-15)

- **Refund after-approval** now posts a balanced compensating ledger group and calls the Stitch refund API with an idempotent key — no longer a bare `Refund` row. Webhook transitions the compensating group to `COMPLETED`; replay is idempotent.
- **Transaction-group drill-down:** new read-only `GET /admin/finance/groups/:transactionGroupId` (SUPER_ADMIN only) returns group header, all legs, linked `AuditLog`, and Stitch external refs.
- **UI drill-down:** recent-groups rows on the Finance overview and reserves rows are now clickable into `/admin/finance/groups/[id]` (SUPER_ADMIN only; cross-tenant guard server-side).
- **ADR 0009 drafted (Proposed).** TradeSafe integration skeleton — adapter contract, env vars, routing, schema reshape. Not Accepted; references ADR 0008. No migration lands this batch; `PAYOUTS_ENABLED=false` unchanged.

---

## Batch 9 additions (2026-04-15)

- **Subscription cancel flow verified:** AuditLog on cancel includes previous tier + status; cancel is reversible while `cancelAtPeriodEnd=true` and the period has not elapsed; no re-pricing of in-flight transactions (plan snapshot immutable per Non-Negotiable #9); RBAC limits BUSINESS_ADMIN to own org.
- **KB seeded with 3 real entries:** Stitch payment-links response-shape mismatch, `merchantReference` special-char rejection, webhook event-type routing mismatch. Template-compliant with real file paths, line numbers, and fix commits. Phase 4 is now truly exit-complete.
- **`/admin/finance/payouts` (SUPER_ADMIN) shipped** listing all `StitchPayout` rows platform-wide. Retry button is a no-op-plus-AuditLog while `PAYOUTS_ENABLED=false`; tooltip states TradeSafe outbound rail is not yet live.
- **Severity filter on `/admin/finance/exceptions`** (cosmetic, query-string driven; no reconciliation-engine change).
- **Playwright reconciliation spec** walks run → exceptions filter → drill-in; skips gracefully on an empty exceptions table.

---

## Performance

The reconciliation engine was benchmarked at N = 1 k, 10 k, and 100 k ledger
entries on 2026-04-15 — full write-up in
[`docs/perf/2026-04-15-reconciliation-benchmarks.md`](perf/2026-04-15-reconciliation-benchmarks.md).
End-to-end `run()` completes in 345 ms at N = 100 k (1 000 paid bounties),
comfortably inside the 15-minute cron cadence. `checkGroupBalance` and
`checkDuplicateGroups` are effectively constant-time at this scale;
`checkReserveVsBounty` is O(B) with two round-trips per paid bounty — a 10×
bounty increase costs ~9× runtime, confirming the structural smell. A single
`GROUP BY`-based rewrite (documented §5.1 of the report) would collapse
2 × B round-trips into one; the current implementation remains safe until the
platform reaches roughly 100 000 paid bounties. A reusable benchmark harness
(`scripts/bench-reconciliation.ts`) plus an opt-in CI guard (`npm run
bench:recon`) are committed so any reconciliation change can be regression-
tested before merge. No production code was modified in this batch.

---

*Document owner: Architect. Update after every payment-stack material change or new ADR.*
