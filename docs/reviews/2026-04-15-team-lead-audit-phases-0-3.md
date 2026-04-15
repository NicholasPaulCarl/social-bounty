# Team Lead Audit — Stitch Express (Phases 0–3)

**Date**: 2026-04-15
**Branch**: `bounty`
**HEAD at audit time**: `4050381 feat: Phase 3 finance admin dashboard (Stitch ledger ops UI)`

## What was verified

### RBAC matrix — every new endpoint

| Endpoint | Decorator | Verdict |
|---|---|---|
| `POST /webhooks/stitch` | `@Public()` | Correct — Svix signature replaces auth |
| `POST /webhooks/stitch/replay/:eventId` | `@Roles(SUPER_ADMIN)` + live-mode guard | Correct |
| `POST /bounties/:id/fund` | `@Roles(BUSINESS_ADMIN, SUPER_ADMIN)` | Correct |
| `GET /payments/funding-status` | `@Roles(BUSINESS_ADMIN, SUPER_ADMIN)` | Correct |
| `POST /payouts/me/beneficiary` | `@Roles(PARTICIPANT)` | Correct |
| `POST /payouts/:payoutId/retry` | `@Roles(SUPER_ADMIN)` | Correct |
| `/refunds/*` (4 routes) | `@Roles(SUPER_ADMIN)` except `before-approval` (BUSINESS_ADMIN) | Correct |
| `@Controller('admin/finance')` (8 routes) | Class-level `@Roles(SUPER_ADMIN)` | Correct |
| `admin/finance/reconciliation/{run,exceptions}` | Class-level `@Roles(SUPER_ADMIN)` | Correct |
| `admin/payments-health` | Class-level `@Roles(SUPER_ADMIN)` | Correct |

**No RBAC holes.**

### Audit log coverage

`LedgerService.postTransactionGroup` writes `AuditLog` atomically in the same `$transaction`. All 10 callers route through it. `@Audited(...)` is layered redundantly on admin controller actions.

### Kill Switch enforcement

`ledger.service.ts:113-116` blocks every write unless `allowDuringKillSwitch: true`. Only one caller sets that flag: `finance-admin.service.ts:222` (`postOverride`) — by design.

### Hard Rule #6 (destructive confirmation)

- Refund approval: `ConfirmAction` modal.
- Kill Switch toggle: `Dialog` + required 10-char reason.
- Override post: typed-literal "OVERRIDE" gate plus live DEBIT/CREDIT balance check.

### Test pass rate

`Test Suites: 10 passed, 10 total. Tests: 63 passed.` Green.

## Gates held before releasing the in-flight batch

1. **RBAC negative tests missing.** No supertest specs proving a `PARTICIPANT` JWT gets 403 on `/admin/finance/*` or `/refunds/*`. Required: at minimum one 403 test per admin controller.
2. **Wallet timeline must read `WalletProjectionService` only** — no direct `LedgerEntry` reads from the web tier, no recomputation client-side.
3. **KYB form** must apply Hard Rule #6 — `DRAFT → SUBMITTED` is a non-rollbackable state change for the brand.
4. **Env-overridable clearance window** — must be guarded against `PAYMENTS_PROVIDER=stitch_live`. Add a unit test.
5. **QA agent's 7-suite fix** — re-run the 63 Stitch tests after merging the jest config change to ensure no regression.
6. **Missing ADR**: the compensating-entry kill-switch bypass (`allowDuringKillSwitch: true`) is policy-critical and undocumented.
7. **Non-Negotiable #9 (plan snapshot)** — no test proves an in-flight approval is NOT re-priced when the brand's plan changes mid-flight.

## Risk register (7-day horizon)

- **Svix replay storm during live-test**: handler errors mark the event failed; Svix redelivers. Dispatch is idempotent via `LedgerTransactionGroup` UNIQUE so safe — but monitor `WebhookEvent.attempts`.
- **Kill Switch pre-checkout**: a brand can `POST /bounties/:id/fund` while Kill Switch is on, complete checkout, then the webhook write throws and Svix retries indefinitely. Needs a pre-checkout guard or a parking account.
- **No RBAC contract tests** — any refactor that drops a class-level `@Roles` decorator silently opens admin endpoints.
- **Override form accepts any account string** as `any`-cast — class-validator only enforces `IsString`, not the 16-account `LedgerAccount` enum. Typo posts a balanced but invalid account.

## Not yet delivered per `implementation-phases.md`

- Phase 2 exit criterion: 7 consecutive days of green fund→approve→clear→pay on staging — blocked on clearance-window override (in-flight).
- Phase 3 remainder: CSV/XLSX exports per module, subscription billing, expired-bounty release job.
- Phase 4 in full: KB automation, RecurringIssue signature matching, Confidence Score UI, Claude KB tooling.

## Recommendation for next batch (after the 4 parallel agents land)

In order:

1. RBAC supertest suite — one 403/401 test per Stitch controller (7 files).
2. Staging live-test dry run — once clearance-window override lands, run fund→approve→clear→pay end-to-end with synthetic data for 1 hour. The 7-day gate stays for prod release.
3. Kill-Switch pre-flight on `POST /bounties/:id/fund` — reject checkout creation when active.
4. Override account enum validation — replace `IsString` with `IsEnum(LedgerAccount)`.
5. ADR: "Compensating entries bypass Kill Switch".

**Do not start Phase 4 automation until items 1–5 land.**
