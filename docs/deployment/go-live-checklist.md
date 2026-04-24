# Social Bounty — Go-Live Checklist

**Owner:** Team Lead
**Date:** living document, last refreshed 2026-04-18
**Scope:** Production cutover for the Social Bounty MVP.

This checklist is a hard gate list, not a polite suggestion. Every unchecked item is a blocker. Where an item is "accepted-for-MVP" (i.e. known gap that has been signed off), it is called out explicitly and cited to its ADR or review.

Cross-references: `docs/deployment/deployment-plan.md`, `docs/INCIDENT-RESPONSE.md`, `docs/SECURITY-COMPLIANCE.md`, `docs/BACKUP-STRATEGY.md`, `docs/adr/0001-0010`, `claude.md` §4 Financial Non-Negotiables.

---

## 0. Show-stoppers — one "no" is a NO-GO

| # | Gate | Blocking owner | Evidence required |
|---|---|---|---|
| 0.1 | Hard Rule #4: 100% test pass on `main` | QA / DevOps | Paste-ready output of `npm test --workspaces` showing `api X/X, web Y/Y, 100% green` |
| 0.2 | Hard Rule #3: every admin action + status change writes `AuditLog` | Backend / QA | Grep confirmation that all new admin controllers are `@Audited(...)` decorated; see `finance-admin.controller.ts` for the pattern |
| 0.3 | RBAC applied on every new endpoint | Backend / QA | `*.controller.rbac.spec.ts` matrix green; no SUPER_ADMIN-only service method called from a non-admin controller |
| 0.4 | Stitch Live credentials in prod env | DevOps | `PAYMENTS_PROVIDER=stitch_live`, `STITCH_CLIENT_ID` and `_SECRET` set, `STITCH_WEBHOOK_SECRET` set (Svix verification) | <!-- historical -->
| 0.5 | `BENEFICIARY_ENC_KEY` set and ≥32 chars IF `PAYOUTS_ENABLED=true` | DevOps / Security | Env validation throws at boot if missing — don't disable the check |
| 0.6 | Outbound payouts gate | Team Lead | EITHER `PAYOUTS_ENABLED=false` (MVP default — see §9 "Accepted gaps") OR TradeSafe live creds signed off (R24 closed) |
| 0.7 | Financial Kill Switch is set to `false` (inactive) at launch | Ops | `SystemSetting` row `financial.kill_switch.active = 'false'`; ADR 0006 applies |
| 0.8 | Database migrations deployed | DevOps | `prisma migrate deploy` exit 0 against prod DB; `_prisma_migrations` table row count matches `packages/prisma/migrations/*/` directory count |
| 0.9 | A Super Admin account exists in prod and password is in a vault (not slack/email) | Team Lead | Seed script output; vault entry reference |

If any row above is unchecked, **do not flip the launch DNS**.

---

## 1. Data & migrations

- [ ] Full Postgres backup taken within 1h of cutover (ADR 0003 in scope here too — platform custody only).
- [ ] Latest migration `20260418000000_add_visibility_recheck` applied — confirm via `SELECT COUNT(*) FROM _prisma_migrations` matches the migrations directory.
- [ ] Seed: super admin only. Do **NOT** run dev-only seeds (`kb-context.ts` is fine; `devSeedPayable` is dev-only per ADR 0006 and refuses to run when `PAYMENTS_PROVIDER=stitch_live` — verify by reading `finance-admin.service.ts:231`). <!-- historical -->
- [ ] Zero-row check: `SELECT COUNT(*) FROM ledger_entries` should be 0 before first real transaction. Any pre-existing rows indicate a dev-leak into the prod DB.
- [ ] `BACKUP-STRATEGY.md` retention + restore runbook reviewed in the last 90d.

## 2. Environment variables (prod)

Every one of these MUST resolve at boot or `env.validation.ts` throws and the app refuses to start. Run `npm run start:prod --workspace=apps/api` against the prod `.env` in staging before cutover.

**Core:**
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (pooled connection)
- [ ] `DIRECT_URL` (migration runner connection — Supabase requires both)
- [ ] `JWT_SECRET` (≥32 chars, unique, NOT the dev default)
- [ ] `REDIS_URL` (Stitch token cache + webhook replay guard) <!-- historical -->

**Stitch (inbound — LIVE):** <!-- historical -->
- [ ] `PAYMENTS_PROVIDER=stitch_live` <!-- historical -->
- [ ] `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET` <!-- historical -->
- [ ] `STITCH_API_BASE=https://express.stitch.money` — same URL for sandbox and live; credentials differentiate the mode. The default in `stitch.client.ts:100` is this URL, and `PAYMENTS_PROVIDER` is what switches sandbox vs live. Don't invent an `api.stitch.money` URL — it will 404. <!-- historical -->
- [ ] `STITCH_REDIRECT_URL` (prod FQDN) <!-- historical -->
- [ ] `STITCH_WEBHOOK_SECRET` (Svix verification; wrong value silently rejects all webhooks) <!-- historical -->
- [ ] `STITCH_SYSTEM_ACTOR_ID` (UUID of a dedicated system user; used by the visibility scheduler's auto-refund path per ADR 0010) <!-- historical -->

**Outbound rail (per §0.6 above):**
- [ ] If launching with outbound disabled: `PAYOUTS_ENABLED=false`. Confirm no `PAYOUT_PROVIDER` flag flips this.
- [ ] If launching with outbound enabled: `PAYOUTS_ENABLED=true`, `PAYOUT_PROVIDER=tradesafe`, `BENEFICIARY_ENC_KEY` (32-char AES-256 key, NOT derived from JWT_SECRET), plus TradeSafe client creds per ADR 0009.

**Auxiliary:**
- [ ] `APIFY_API_TOKEN` (post-scraping + brand-profile cron; required for the hunter submission verification feature — without it, scraper cost guards silently mark everything VERIFIED with empty checks, which will pass the approval gate without actually verifying anything)
- [ ] `SENTRY_DSN` (error tracking)
- [ ] Mail provider creds (SMTP or transactional API) — required for `post-visibility-warning-hunter.hbs` + `post-removed-*.hbs` templates
- [ ] File upload config (local path or S3-equivalent)

**Kill switch (operator-facing, not env-vars):**
- [ ] Confirm `SystemSetting.financial.kill_switch.active` can be toggled by Super Admin via `/admin/finance` UI. Test on staging — toggle on, try to post a bounty funding, expect `KillSwitchActiveError`; toggle off; retry; expect success. Document the ops playbook in `docs/INCIDENT-RESPONSE.md`.

## 3. Security & compliance

- [ ] `docs/SECURITY-COMPLIANCE.md` last-audit date within 6 months.
- [ ] HTTPS-only: all cookies `Secure + HttpOnly + SameSite=Lax`. Verify the JWT middleware sets these in prod mode.
- [ ] CORS locked to prod domain (no `*`, no staging origins).
- [ ] CSP header set (see `next.config.js` — review before flipping DNS).
- [ ] Rate limiting: `ThrottlerModule` configured with production limits (not dev defaults). OTP endpoints especially — 3 requests / 10 min per IP is roughly the right order of magnitude.
- [ ] Password-auth: **see `docs/reviews/2026-04-15-team-lead-audit-batch-13.md`** — MVP runs OTP-only; password flow is roadmap. If this is a hard commercial requirement for launch, it's a blocker.
- [ ] Webhook endpoints: Svix HMAC-SHA256 verification on Stitch + TradeSafe webhooks. Skew ≤5 minutes. Confirm prod `STITCH_WEBHOOK_SECRET` matches what you registered in the Stitch dashboard. <!-- historical -->
- [ ] POPI/GDPR: user self-service export + deletion paths exist. If the commercial target region has different requirements, flag.
- [ ] `docs/adr/0010-auto-refund-on-visibility-failure.md` reviewed by Team Lead. The visibility scheduler can auto-refund without a human in the loop; confirm this is commercially acceptable, or toggle `MAX_VISIBILITY_RESCRAPES_PER_BOUNTY` to 0 effectively disabling the cron path until you've watched a week of failures in staging.

## 4. Financial readiness — the hard stuff

These gates come directly from `claude.md` §4 "Financial Non-Negotiables". Every one is pre-launch.

- [ ] **Double-entry:** all ledger-writers pass their 5-test matrix (happy path, retry idempotent, partial rollback, webhook replay, concurrent writer). Evidence: `ledger.service.spec.ts` + each handler spec.
- [ ] **Idempotency:** `UNIQUE(referenceId, actionType)` constraint enforced in DB — confirm with `\d ledger_transaction_groups` on prod.
- [ ] **Plan snapshot:** current tier stamped on every `LedgerTransactionGroup` at creation. Verify a sample row has `planSnapshot` populated.
- [ ] **Integer minor units:** grep for `Number.parseFloat` and `parseFloat` in ledger paths — should find zero hits outside of display code.
- [ ] **Append-only ledger:** no `UPDATE` / `DELETE` on `ledger_entries` outside compensating-entry path. ADR 0005 + 0006 govern.
- [ ] **Compensating-entry bypass:** per ADR 0006, ONLY `FinanceAdminService.postOverride` and `devSeedPayable` may set the `PostTransactionGroupInput` kill-switch bypass flag. The pre-commit hook `scripts/check-kill-switch-bypass.sh` enforces this — confirm it runs in CI too.
- [ ] **Global fee independence:** 3.5% platform fee in `global_fee_revenue` ledger account, separate from tier admin fee. Spot-check a sample transaction.
- [ ] **Reconciliation engine:** scheduled 15-min cron on prod. Dashboard at `/admin/finance/insights` loads. Kill switch wired.
- [ ] **ADR 0010 specific:** the visibility scheduler's auto-refund path requires a system user with `STITCH_SYSTEM_ACTOR_ID` set — confirm that user exists in prod DB and has the right role. <!-- historical -->
- [ ] **Kill switch read path is fail-closed:** `LedgerService.isKillSwitchActive()` errors on transient DB blips bias toward active. `submission-visibility.scheduler.ts` calls it with `.catch(true)` — verify other consumers do too or add the same guard.

## 5. Observability & incident response

- [ ] Sentry: prod DSN configured, sample run shows errors arriving.
- [ ] Logs: structured (JSON), shipping to the log platform of choice. Confirm:
    - No PII in log statements. Grep for `email`, `phone`, `firstName` — only structured fields at debug level should emit these.
    - Audit-log writes are visible in the log stream (they also hit the DB but a mirror in logs is useful during incidents).
- [ ] Dashboards: finance admin + KB insights + visibility-failures page load cleanly with zero data. Panels don't throw.
- [ ] Alerting:
    - Apify actor failure rate (Phase 3D analytics — surface warning alert ≥30% / critical ≥50% on the insights page, and wire a Slack/email webhook off the KB recurrence `errorCode: POST_VISIBILITY_FIRST_FAILURE` hitting ≥10 distinct submissions in a 6h window).
    - Kill switch toggles (the AuditLog entry should fire an external alert; if not, add one).
    - Webhook replay counter breaching baseline (Svix replay guard runs in Redis; monitor its rejection rate).
    - Reconciliation scheduler dead (no heartbeat in last 20 min).
- [ ] `docs/INCIDENT-RESPONSE.md` reviewed by on-call within the last 30d. On-call knows how to:
    - Flip the kill switch
    - Manually post a compensating entry via `/admin/finance/overrides`
    - Read the reconciliation dashboard
    - Rotate the Stitch webhook secret (implies a rolling deploy window since in-flight webhooks will fail verification) <!-- historical -->

## 6. Deployment pipeline

- [ ] CI green on the merge commit that will ship (full `npm test`, `tsc --noEmit`, `next build`, the `check:kill-switch-bypass` script).
- [ ] Migration step in CI separate from code deploy — run migrations first, verify `_prisma_migrations` table catches up, then deploy.
- [ ] Zero-downtime deploy strategy (blue-green or rolling). Webhooks should queue at the load-balancer if both instances bounce simultaneously.
- [ ] Rollback: documented and tested. **Critical:** ledger is append-only, so "rolling back" a bad deploy does NOT mean reverting ledger state. Only code is rolled back; any incorrect entries must be corrected via ADR 0006's compensating-entry path. Document this explicitly in the rollback plan.
- [ ] DNS TTL dropped to ≤60s 24h before cutover.

## 7. Legal / commercial

- [ ] Terms of Service + Privacy Policy live, linked from the footer, versioned.
- [ ] Brand KYB flow tested end-to-end with a real brand (not the dev seed).
- [ ] Hunter self-service account-close flow functional. POPI/GDPR-style delete-my-account should purge PII from `users`, `user_social_handles`, `submission_url_scrapes.scrapeResult` (contains caption + tagged usernames per ADR 0010's PII note), wallets, and trigger a final reconciliation of any in-flight balance.
- [ ] Subscription tier pricing in `SUBSCRIPTION_CONSTANTS` matches the public pricing page.
- [ ] Commercial agreement with Stitch is signed and in effect on launch day. <!-- historical -->
- [ ] Insurance / chargeback reserve — understand the Stitch dispute process (see `md-files/payment-gateway.md`), and ensure the platform custody account has enough liquidity to cover disputes that land after approval but before clearance. <!-- historical -->

## 8. Launch-day procedures

**T-24h:**
- [ ] Final `prisma migrate deploy` dry-run against a prod snapshot.
- [ ] Final `npm run build:all` in a clean container; smoke-check in staging.
- [ ] Team stand-up: who's on-call, who's watching dashboards, who can flip the kill switch if needed.

**T-1h:**
- [ ] Pre-launch snapshot: DB backup + ledger export (`SELECT * FROM ledger_entries ORDER BY id LIMIT 10` should return zero rows).
- [ ] Flip to maintenance page if you have one (not required, but useful for webhook-secret-rotation).
- [ ] Deploy.

**T+0:**
- [ ] DNS cutover OR flip env var to prod.
- [ ] Tail logs for 10 minutes continuous. Expect ≤0 ERROR lines in that window.
- [ ] First real transaction: a Team Lead funds a 1 ZAR test bounty through Stitch. Confirm: <!-- historical -->
    - Stitch hosted checkout loads <!-- historical -->
    - Payment-settled webhook arrives and is `processed` (check `webhook_events` table)
    - Ledger reconciles (0 drift in the Reconciliation dashboard 15 min later)
    - AuditLog row exists

**T+1h:**
- [ ] Real hunter signs up, applies to the test bounty, submits a URL. Visibility scheduler picks it up on its next tick. Confirm: scrape result exists in `submission_url_scrapes`, brand review page renders the verification panel, Approve button enables only when all URLs are VERIFIED.

**T+24h:**
- [ ] Reconciliation engine: no `critical` findings in the last 24h.
- [ ] KB dashboard: no new recurrences under `ledger-imbalance`.
- [ ] Stitch dashboard: inbound webhook success rate ≥99%. <!-- historical -->
- [ ] Apify dashboard: actor-run count matches submission count roughly 1:1 (accounting for cost guard skips).

**T+7d:**
- [ ] Reconciliation engine has run ≥670 times (every 15 min × 24h × 7d = 672) with zero unresolved critical findings.
- [ ] Visibility scheduler has run 28 times (6h × 7d) — check `AUDIT_ACTIONS.SUBMISSION_VISIBILITY_AUTO_REFUND` entries; if any auto-refunds fired, confirm each was legitimate (not an Apify outage false-positive).
- [ ] Review `RecurringIssue` table — any `ineffectiveFix` auto-flags trigger an immediate follow-up.

## 9. Accepted gaps (signed off for MVP — do not block launch)

These are explicitly out of scope per existing ADRs and reviews. The checklist flags them so no one is surprised.

- **`PAYOUTS_ENABLED=false`** — outbound rail gated on TradeSafe live creds (ADR 0009). Hunters accrue balance; withdrawal UI returns "coming soon". R24 in the risk register.
- **Password auth** — OTP-only at launch per `docs/reviews/2026-04-15-team-lead-audit-batch-13.md`. Roadmap item.
- **Standalone escrow** — platform custody only; no TradeSafe-style segregated escrow (ADR 0003).
- **Auto-refund human-review queue** — ADR 0010 §"Out of scope": refunds fire without human review. MVP accepts this given the 2-failure threshold + kill-switch gate + per-bounty cost cap. If the first 7 days show false-positives, flip `MAX_VISIBILITY_RESCRAPES_PER_BOUNTY` to a near-zero value as a kill switch until a proper human review queue lands.
- **Pre-refund outage detection inside the scheduler** — ADR 0010 §"Out of scope". The admin-facing Phase 3D analytics is the manual escape hatch for detecting Apify systemic failures before they cascade.
- **Per-hunter rate limit on auto-refunds** — deferred until pattern data exists.
- **ESLint** — dead lint scripts were removed in commit `8378f5a`. Adopting ESLint properly is a post-launch decision. Quality gates in place: TypeScript strict, `next build` type-check, `check:kill-switch-bypass` guard, full jest suites.
- **PostVisibility re-check cadence** — Phase 2A defaults (every 6h × 24h/72h/7d bucketing × 90d cap for `MUST_NOT_REMOVE`, stops at deadline for `MINIMUM_DURATION`). Tweak if real-world data shows these are wrong.

## 10. Rollback plan — critical path

**If the first real transaction fails:**
1. Immediately flip the kill switch via `/admin/finance` (audit-logged).
2. Check `webhook_events` for the failed event; check `ledger_entries` for any partial write.
3. If a ledger entry landed for the failed transaction: post a compensating entry via `/admin/finance/overrides` (reason ≥10 chars, typed confirmation word per Hard Rule #6).
4. Restore the Stitch webhook secret if it was rotated. <!-- historical -->
5. If the issue is code: roll back the deploy. The DB state does NOT roll back — the compensating-entry pattern above is the only way to correct the ledger.

**If reconciliation surfaces a critical finding:**
1. Kill switch on immediately.
2. Do NOT merge any fix until the mismatch is understood. Hard Rule #4: 100% tests pass before release applies to fixes too.
3. Use `scripts/kb-context.ts` to pull the most relevant prior incident from the KB.
4. Team Lead + on-call review, then compensating entry if needed.

**If the visibility scheduler misfires and auto-refunds a batch:**
1. Kill switch on — stops further auto-refunds mid-flight.
2. Each refund has a reversal path via `RefundService` (audit-logged). Do not attempt to edit ledger rows.
3. Post-mortem: root cause (Apify outage? Account private? Hunter took post down legitimately?), update the threshold / cost-cap constants, document in the KB.

---

## Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| Team Lead | | | |
| Backend Lead | | | |
| Frontend Lead | | | |
| DevOps | | | |
| Security / Compliance | | | |
| Commercial | | | |

No cutover without all six. No exceptions.
