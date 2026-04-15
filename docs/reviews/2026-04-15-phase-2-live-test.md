# Phase 2 Outbound Payout Loop — Live Smoke Test

**Date:** 2026-04-15
**Agent:** QA Testing Engineer (dev-environment exercise)
**Result:** Partial. The clearance half of the loop runs end-to-end and posts the correct ledger entries. The payout half fails at the Stitch Express sandbox boundary due to two pre-existing bugs in `apps/api/src/modules/payouts` that the test uncovered. **These were not fixed — they are returned to the team.**

Bounty from Phase 1 (`bde31e12-f798-48e9-8c5e-d799a140d4e5`, ZAR 2 800 face value) was not used; we followed the new `dev/seed-payable` shortcut with a ZAR 50 (5 000 cent) position instead so we do not pollute the real Phase 1 group.

---

## 1. Pre-conditions

| Thing | Value |
|---|---|
| API | `localhost:3001`, NestJS watch mode (`apps/api && npm run dev`) |
| DB | Supabase Postgres via `DIRECT_URL` (`aws-1-eu-west-3.pooler.supabase.com:5432`) |
| Redis | Local `redis-server` on `127.0.0.1:6379` (required — API will report `redis:error` in `/health` if this is down, even though the app will still accept requests) |
| ngrok | `https://paplike-latonya-grapy.ngrok-free.dev/api/v1/webhooks/stitch`, inspector at `http://127.0.0.1:4040` |
| PAYMENTS_PROVIDER | `stitch_sandbox` |
| STITCH_SYSTEM_ACTOR_ID | `00000000-0000-0000-0000-000000000001` (must exist as a `users` row; already seeded) |
| STITCH_MIN_PAYOUT_CENTS | `2000` (payout will be skipped if `hunter_available < 20.00`) |

### Required env additions

Append to `.env` (repo root) before starting the API:

```env
PAYOUTS_ENABLED=true
CLEARANCE_OVERRIDE_HOURS_FREE=0.0083
```

`CLEARANCE_OVERRIDE_HOURS_FREE=0.0083` is ~30 seconds; the dev/seed-payable path already puts `clearanceReleaseAt = now() - 60s` so the override mainly matters for the real funded-bounty path. Both vars are read at boot, so the API must be restarted for them to take effect.

```bash
lsof -ti:3001 | xargs kill -9
cd apps/api && npm run dev > /tmp/api-e2e.log 2>&1 &
# wait until curl -s localhost:3001/api/v1/health returns status=ok (database/redis both ok)
```

### Required DB row: StitchBeneficiary

The payout scheduler only considers hunters with a `stitch_beneficiaries` row where `isActive=true`. None of the seeded PARTICIPANT users have one, so insert one directly (bypassing the real upsert endpoint — see "Broken item #1" below for why we cannot use the endpoint against Stitch sandbox right now):

```sql
INSERT INTO stitch_beneficiaries
  (id, "userId", "stitchBeneficiaryId", "accountHolderName", "bankCode",
   "accountNumberEnc", "accountType", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(),
        '7d00ed75-e9fb-4e74-b462-5ed8234053fc',          -- participant@demo.com
        'local:7d00ed75-e9fb-4e74-b462-5ed8234053fc',    -- synthetic; NOT a real Stitch id
        'Demo Hunter', '051001', 'SYNTHETIC_ENC_NOT_REAL',
        'CURRENT', true, now(), now());
```

Any PARTICIPANT user works; `participant@demo.com` (`7d00ed75-…`) is the convenient default.

---

## 2. Obtaining a Super Admin JWT

Auth is OTP (passwordless). The dev loop is:

1. Request OTP:
   ```bash
   curl -s -X POST http://localhost:3001/api/v1/auth/request-otp \
     -H 'Content-Type: application/json' \
     -d '{"email":"admin@socialbounty.cash"}'
   ```
   (Other super admins: `superadmin@demo.com`.)

2. Read the OTP out of Redis (the mail side is fire-and-forget; in sandbox it silently fails to SMTP, which is fine):
   ```bash
   redis-cli get 'otp:admin@socialbounty.cash'
   # → {"email":"…","otp":"NNNNNN","attempts":0}
   ```

3. Verify and grab the access token:
   ```bash
   curl -s -X POST http://localhost:3001/api/v1/auth/verify-otp \
     -H 'Content-Type: application/json' \
     -d '{"email":"admin@socialbounty.cash","otp":"NNNNNN"}' | jq -r .accessToken
   ```

   Access token is 15-minute-lived. Save as `JWT=...`. Refresh cookie is also set but scripts don't need it.

---

## 3. Seed the payable position

```bash
curl -s -X POST http://localhost:3001/api/v1/admin/finance/dev/seed-payable \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"7d00ed75-e9fb-4e74-b462-5ed8234053fc","faceValueCents":5000}'
# → {"transactionGroupId":"…","idempotent":false}
```

Verify the seed landed:

```sql
SELECT account, type, amount, "clearanceReleaseAt", status
FROM ledger_entries
WHERE "userId" = '7d00ed75-e9fb-4e74-b462-5ed8234053fc'
  AND "createdAt" > now() - interval '10 minutes'
ORDER BY "createdAt" DESC;
```

Expected:

```
 account            | type   | amount | clearanceReleaseAt       | status
--------------------+--------+--------+--------------------------+-----------
 hunter_net_payable | CREDIT |   5000 | <now - 60s>              | COMPLETED
```

(The compensating DEBIT against `brand_reserve` is on the *group* but not tied to this userId, so it doesn't appear here.)

---

## 4. Triggering the two stages

Both `ClearanceScheduler.tick()` and `PayoutsScheduler.execute()` are `@Cron(EVERY_10_MINUTES)`. They fire on the same `*/10 * * * *` tick, and **that is a problem**:

- At `HH:M0:00` both cron jobs start.
- Clearance takes ~5 s to release `hunter_net_payable → hunter_available`.
- Payout reads `hunter_available` in the same tick, sees 0, skips.

So the first wall-clock tick after seeding always skips. You either wait 10 more minutes, or trigger the jobs manually in sequence. We built a throwaway helper to do the latter without bootstrapping the full API:

```bash
# from repo root, after apps/api has been built at least once
node scripts/trigger-payout-batch.js clearance
node scripts/trigger-payout-batch.js payout
# or: node scripts/trigger-payout-batch.js both
```

The helper opens a Nest application context against the compiled `apps/api/dist`, resolves the real `ClearanceService` / `PayoutsService`, and calls `releaseEligible()` and `runBatch()` directly. It does **not** start an HTTP server, so it can coexist with the running API without port contention. Redis and Postgres are shared resources so the running API sees every ledger write immediately.

> **Note:** the helper re-reads `.env`, but the running `apps/api` only reads it at boot. If you change an env var (e.g. `PAYOUTS_ENABLED`) you must restart the API for the cron-driven path; the helper itself is always on.

### After clearance

```sql
SELECT account, type, amount
FROM ledger_entries
WHERE "userId" = '7d00ed75-e9fb-4e74-b462-5ed8234053fc'
ORDER BY "createdAt" ASC;
```

Expected:
```
 hunter_net_payable | CREDIT | 5000   -- original seed
 hunter_net_payable | DEBIT  | 5000   -- clearance moved it…
 hunter_available   | CREDIT | 5000   -- …to available
```

`job_runs` confirms:
```sql
SELECT "jobName", status, details
FROM job_runs WHERE "jobName" = 'clearance-release'
ORDER BY "startedAt" DESC LIMIT 1;
-- → { "released": 1, "skipped": 0 }
```

### After payout

Expected ledger additions:
```
 hunter_available  | DEBIT  | 5000
 payout_in_transit | CREDIT | 5000
```

Expected `stitch_payouts` row with `status=INITIATED` and a non-null `stitchPayoutId`, then after Stitch fires the `withdrawal.paid` webhook (or whatever sandbox calls it), a follow-up ledger group:
```
 payout_in_transit | DEBIT  | 5000
 hunter_paid       | CREDIT | 5000
```

**This did not happen.** See §5.

---

## 5. Where it died and why — hand back to team

### Broken item #1 — `POST /api/v1/beneficiaries` returns 404 from Stitch Express

`StitchClient.createBeneficiary()` ([`apps/api/src/modules/stitch/stitch.client.ts:195`](../../apps/api/src/modules/stitch/stitch.client.ts)) hits `/api/v1/beneficiaries`. Stitch Express sandbox answers with an HTML 404 page ("Stitch Express | Page Not Found"). Repro:

```bash
curl -s -X POST http://localhost:3001/api/v1/payouts/me/beneficiary \
  -H "Authorization: Bearer $HUNTER_JWT" \
  -H 'Content-Type: application/json' \
  -d '{"accountHolderName":"Demo Hunter","bankCode":"051001","accountNumber":"12345678901","accountType":"CURRENT"}'
# → 500 Internal Server Error
# log: StitchApiError: Stitch POST https://express.stitch.money/api/v1/beneficiaries returned 404: <html>…
```

Candidate fix: the Express API docs at <https://express.stitch.money/api-docs> advertise `/api/v1/beneficiary` (singular) or a different shape altogether. Needs a backend-agent run to reconcile the client with the current sandbox spec. The auth token call (`/api/v1/oauth2/token`) and the withdrawal call (`/api/v1/withdrawal`) both work, so we know the client's transport and auth are fine — just this path is wrong.

### Broken item #2 — payout dispatch sends the internal DB UUID as `beneficiaryId`

`PayoutsService.initiatePayout()` ([`apps/api/src/modules/payouts/payouts.service.ts:184-186`](../../apps/api/src/modules/payouts/payouts.service.ts)) does:

```ts
const stitchResult = await this.stitch.createPayout(
  { amountCents, beneficiaryId: payout.beneficiaryId, merchantReference, speed: this.speed },
  idempotencyKey,
);
```

`payout.beneficiaryId` is the `stitch_beneficiaries.id` (our internal PK UUID), **not** `stitch_beneficiaries.stitchBeneficiaryId` (the Stitch-assigned id). Even if Broken item #1 is fixed and a real beneficiary is registered with a valid Stitch id, the payout call will still send the wrong value — Stitch will either 404 or return a non-`data` response, which shows up as `StitchApiError: Invalid payout response`.

Observed repro even with the synthetic beneficiary row (so beneficiary-creation was bypassed):

```
ERROR [PayoutsService] payout initiation failed for 7d00ed75-…: Invalid payout response
```

`stitch_payouts` row:
```
 status=FAILED, attempts=1, lastError='Invalid payout response'
```

The failure path is correct — a compensating `payout_in_transit → hunter_available` group is posted, so the ledger stays balanced:

```
hunter_available   | CREDIT | 5000  -- clearance
hunter_available   | DEBIT  | 5000  -- payout initiated
payout_in_transit  | CREDIT | 5000  -- payout initiated
hunter_available   | CREDIT | 5000  -- failure compensating
payout_in_transit  | DEBIT  | 5000  -- failure compensating
```

Fix candidate: load the beneficiary relation (or store `stitchBeneficiaryId` directly on `StitchPayout`) and pass `beneficiary.stitchBeneficiaryId` to the Stitch client. The `StitchPayout` model does not currently hold `stitchBeneficiaryId`, so either:

- in `initiatePayout`, fetch `StitchBeneficiary` by `payout.beneficiaryId` and forward `stitchBeneficiaryId`; or
- add a `stitchBeneficiaryId` column on `StitchPayout` and populate it at creation.

This is a **single-line change** with a test — but it lives in `apps/api/src/modules/payouts/payouts.service.ts`, which is the other backend agent's turf per the task constraints, so it is not in scope for this QA exercise.

### Race between the two schedulers

`ClearanceScheduler` and `PayoutsScheduler` both fire on `EVERY_10_MINUTES`. They run concurrently, so the payout job sees stale `hunter_available`. Low-priority design issue (the next tick picks it up, so correctness is preserved), but worth noting:

- `2026-04-15 15:10:00.006` clearance-release started
- `2026-04-15 15:10:00.008` payout-execution started (saw 0 available → skipped)
- `2026-04-15 15:10:05.830` clearance-release finished (posted 5 000 to available)
- next payout-execution tick: `15:20:00` (would have worked if not for #2)

Candidate fix: stagger the crons (clearance at `*/10`, payouts at `*/10` + 5 min), or chain them (clearance calls payout-enqueue on success). Also worth considering: a distributed lock around the scheduler body so two API instances don't duplicate-run (currently none).

---

## 6. Final state

- Ledger is balanced for the hunter (+5 000 in `hunter_available` — the seed never reached `hunter_paid`, but it also did not vanish).
- One `FAILED` row in `stitch_payouts` with `attempts=1` (I cleaned it up after; it would have been retried by the every-hour retry cron, which would have failed again because #1 and #2 are still broken).
- No Stitch webhook traffic was generated (confirmed via ngrok inspector `http://127.0.0.1:4040`).
- `PAYOUTS_ENABLED=true` and `CLEARANCE_OVERRIDE_HOURS_FREE=0.0083` remain in `.env`; revert if you want the cron gated off again.

## 7. Re-running

```bash
# Clean slate for the same hunter
psql "$DIRECT_URL" -c "
  DELETE FROM stitch_payouts WHERE \"userId\"='7d00ed75-e9fb-4e74-b462-5ed8234053fc';
  DELETE FROM stitch_beneficiaries WHERE \"userId\"='7d00ed75-e9fb-4e74-b462-5ed8234053fc';
"
# Re-insert synthetic beneficiary (section 1)
# Re-POST dev/seed-payable (section 3)
# node scripts/trigger-payout-batch.js both
```

Note that the ledger legs from a previous run stay — `dev/seed-payable` generates a unique `referenceId` per call so it won't trip idempotency, and the `hunter_available` balance will accumulate. If that matters for your scenario, use a different hunter or post a compensating entry via `POST /admin/finance/overrides`.

## 8. Artifacts

- `scripts/trigger-payout-batch.js` — Nest-standalone helper to force-run clearance + payout batch. Safe to commit; pure QA convenience. Do NOT run in production.
- (companion) `scripts/trigger-payout-batch.ts` — initial TypeScript version; shelved because `ts-node` trips on the codebase's decorator style. Delete or keep as you prefer.
