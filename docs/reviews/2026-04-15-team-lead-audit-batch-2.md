# Team Lead Audit — Batch 2 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `073fe59 feat: parallel agent batch — Phase 2 prep, hunter timeline, KYB UI, 100% test gate`
**Prior audit:** `docs/reviews/2026-04-15-team-lead-audit-phases-0-3.md`
**Related decision:** `docs/adr/0006-compensating-entries-bypass-kill-switch.md` (written alongside this audit)

## 1. What I verified today (in `073fe59`)

### Phase 2 live-test prep (env-overridable clearance)

- `ApprovalLedgerService.clearanceHoursFor` reads `CLEARANCE_OVERRIDE_HOURS_FREE/PRO`, falls back to canonical `CLEARANCE_HOURS` constants on absence or invalid value, and emits a WARN log when overridden (`apps/api/src/modules/ledger/approval-ledger.service.ts:50-69`).
- `.env.example:105` documents the override vars. `env.validation.ts:64,73` marks them optional.
- Spec `approval-ledger.service.spec.ts:154` covers "invalid override → fall back to canonical".
- **Gap:** the override is not guarded against `PAYMENTS_PROVIDER=stitch_live`. `devSeedPayable` does block live-mode (`finance-admin.service.ts:231`); the clearance override does not. See §2.

### System-actor plumbing on schedulers

- `clearance.service.ts:24-33` and `payouts.service.ts:40-48` both throw when `STITCH_SYSTEM_ACTOR_ID` is missing — the ID is passed as both `postedBy` and `audit.actorId`.
- Verified by `clearance.service.spec.ts:56-83` (two tests: happy path and missing-config).

### Hunter wallet timeline UI

- `apps/web/src/app/(participant)/wallet/page.tsx` reads through `useWalletDashboard()` (line 92), which hits the server projection — no client-side ledger recomputation. Passes prior audit's gate #2.
- Note: comment at line 27 records a known follow-up ("split pending vs clearing once projection exposes finer-grained"); this is appropriate scope discipline, not a hole.

### Brand KYB intake form

- `apps/web/src/app/business/organisation/kyb/page.tsx:58-103`. Gate on `status === NOT_STARTED || REJECTED` before allowing submit; calls `useSubmitKyb`.
- **Hard Rule #6 violation:** I find no `ConfirmDialog` / `ConfirmAction` between "Submit KYB Details" click and the API call. `DRAFT → SUBMITTED` is a non-rollbackable state change for the brand and the prior audit flagged this as a pre-merge gate. See §2.

### Dev seed payable

- `POST /admin/finance/dev/seed-payable`: `@Roles(SUPER_ADMIN)` (class level on `finance-admin.controller.ts:77-78`), service-level re-check (`finance-admin.service.ts:227`), `PAYMENTS_PROVIDER=stitch_live` refusal (`finance-admin.service.ts:231`), audited (`@Audited('DEV_SEED_PAYABLE', 'User')`).
- Uses `allowDuringKillSwitch: true` + `actionType='compensating_entry'` → compliant with ADR 0006.

### Test suite

- User reports 884/884 green. Not re-run here (audit is read-only). Prior 63 Stitch tests listed unchanged; expect agent-qa-testing-2's RBAC suite to extend the count.

### Kill-switch pre-flight on bounty funding

- Already landed (not in-flight). `stitch-payments.service.ts:83-85` throws `ServiceUnavailableException('Funding paused')` when the switch is active. **agent-backend-2's task is therefore to add coverage / surface this in `/bounties/:id/fund` path if a second entry point exists** — not to introduce the guard. Verify the new test hits `stitch-payments.service.ts:83`, not a mocked stub.

## 2. Gates I'm holding for the in-flight batch

### agent-qa-testing-2 (RBAC supertest suite)

- Must include **401 for unauthenticated requests**, not just 403 for wrong-role. Two-JWT negative matrix: `(PARTICIPANT, BUSINESS_ADMIN) × every /admin/finance/* and /refunds/* route = ≥ 24 test cases`.
- Must cover `POST /webhooks/stitch/replay/:eventId` (SUPER_ADMIN only) and `POST /payouts/:payoutId/retry`.
- Must assert status code **and** response shape — a silent body leak on a 403 is still a leak.
- Run against actual Nest pipeline (module compile with real Guards), not unit-level reflection.

### agent-backend-2 (kill-switch pre-flight + OverrideLegDto enum)

- Pre-flight: test must force `systemSetting.kill_switch=true` in-DB, POST `/bounties/:id/fund`, assert 503 and zero `StitchPaymentLink` rows created. Reading `stitch-payments.service.ts:83-85` alone is not evidence.
- `OverrideLegDto.account`: currently `@IsString()` only (`finance-admin.controller.ts:29-30`). Replace with `@IsEnum(LedgerAccount)` imported from `@prisma/client` or shared. Test must assert `POST /admin/finance/overrides` with `{account:'typo_account'}` returns 400 before any DB work.
- `OverrideLegDto.type`: currently `@IsString()` (`finance-admin.controller.ts:32-33`) — same issue. Fix in the same PR or the LedgerEntryType typo lands balanced but wrong.
- Plan-snapshot test: post an approval for hunter X at FREE tier, *then* upgrade X to PRO mid-flight, then run the clearance job. Assert `clearanceReleaseAt` reflects FREE (72h or override), not PRO (0h). Covers Non-Negotiable #9.

### agent-qa-testing-3 (Phase 2 live dry-run)

- Dry run must exercise the actual webhook path — replay a captured Stitch settlement webhook, don't call `StitchPaymentsService.settlePayment` directly.
- Assert idempotency: replay the same webhook twice, assert second invocation returns `idempotent: true` and no second `LedgerEntry` row.
- Assert `WebhookEvent.attempts` stops incrementing after success.
- Exit criterion for this run is NOT "7 consecutive days green" — that gate stays for prod release. This is a smoke signal only.

### agent-frontend (hunter payouts history UI)

- Must pull from a server endpoint that joins `StitchPayout` with `LedgerTransactionGroup` — no client joins.
- Must render settled/failed/pending consistently with the Reconciliation Dashboard copy.
- Zero raw `LedgerEntry` shape in the web tier (same gate as wallet timeline).

### Holdover gate from prior audit

- **KYB DRAFT → SUBMITTED confirmation.** Not yet closed. Must land before KYB form ships to production.
- **Clearance override live-mode guard.** Add a runtime refuse (`if PAYMENTS_PROVIDER=stitch_live && raw !== undefined → throw`) in `approval-ledger.service.ts:55`. The WARN log is not a substitute for a hard block.

## 3. Updated risk register

| # | Risk | Status | Note |
|---|---|---|---|
| R1 | Svix replay storm | **Unchanged** | Header-table idempotency handles it; monitor `WebhookEvent.attempts`. |
| R2 | Kill-switch bypass at pre-checkout | **Resolved** | `stitch-payments.service.ts:83-85` blocks at link creation. Verify agent-backend-2's test. |
| R3 | No RBAC contract tests | **In flight** | agent-qa-testing-2. Gate on 401+403 matrix. |
| R4 | Override accepts any string as account | **In flight** | agent-backend-2. Must cover both `account` AND `type`. |
| R5 | Compensating-entry bypass undocumented | **Resolved** | ADR 0006 written. |
| R6 | Plan-snapshot re-pricing risk | **In flight** | agent-backend-2. Test must simulate mid-flight tier change. |
| R7 | Clearance-override live-mode leak | **NEW** | No guard against `PAYMENTS_PROVIDER=stitch_live`; only a WARN log. |
| R8 | KYB submit without confirmation | **NEW (held over)** | Hard Rule #6 violation on `kyb/page.tsx`. |
| R9 | `allowDuringKillSwitch` usage could spread | **NEW** | ADR 0006 scopes it to `actionType='compensating_entry'`. Add a CI guard (grep for the token outside `finance-admin.service.ts`) in a future batch. |

## 4. Recommendation for Batch 3

Gate Batch 3 on closure of R3, R4, R6, R7, R8 from the table above. In order:

1. **Close R7** (clearance override live-mode guard) — trivial, ship with R4.
2. **Close R8** (KYB confirm dialog) — frontend one-liner; do not ship KYB flow to staging without it.
3. **Add CI guard for R9** — a simple grep-based check in `package.json` / husky that fails if `allowDuringKillSwitch: true` appears in any file other than `apps/api/src/modules/finance-admin/finance-admin.service.ts`.
4. **Begin Phase 3 CSV/XLSX exports** per module (prior audit's outstanding item) — unblocked only after 1–3 land.
5. **Subscription billing + expired-bounty release job** — next behind exports.
6. **Phase 4 (KB automation)** remains blocked until R3/R4/R6 all land green and the Phase 2 7-day staging gate passes.

**Do not begin Phase 4 until:** Batch 2 RBAC suite green, override enum validation deployed, plan-snapshot test green, KYB confirm gate closed, clearance-override live-mode guard in place.
