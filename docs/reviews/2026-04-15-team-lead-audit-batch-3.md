# Team Lead Audit — Batch 3 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `304b158 feat: batch 2 — RBAC contracts, kill-switch pre-flight, payouts UI, ADR 0006`
**Prior audits:** `docs/reviews/2026-04-15-team-lead-audit-phases-0-3.md`, `docs/reviews/2026-04-15-team-lead-audit-batch-2.md`
**Test state:** user-reported 991 green.

## 1. Verified at HEAD `304b158`

- **RBAC contract tests exist across 6 spec files** (total ≈ 19 cases, mixing direct `it()` and parameterised `test.each` tables):
  - `apps/api/src/modules/webhooks/stitch-webhook.replay-rbac.spec.ts` (9)
  - `apps/api/src/modules/payouts/payouts.controller.rbac.spec.ts` (4)
  - `apps/api/src/modules/refunds/refunds.controller.rbac.spec.ts` (4)
  - `apps/api/src/modules/finance/payments-health.controller.rbac.spec.ts` (`test.each` matrix)
  - `apps/api/src/modules/reconciliation/reconciliation.controller.rbac.spec.ts` (`test.each` matrix)
  - `apps/api/src/modules/finance-admin/finance-admin.controller.rbac.spec.ts` (`test.each`, 159 LOC — the 8 `/admin/finance/*` routes)
- **Kill-switch pre-flight** on bounty funding: `apps/api/src/modules/payments/stitch-payments.service.ts:83-85` throws `ServiceUnavailableException('Funding paused')` inside `createPaymentLink` before any DB row / Stitch call. Prior audit's R2 remains closed.
- **Override DTO enum validation**: `apps/api/src/modules/finance-admin/finance-admin.controller.ts:31,34` — `@IsEnum(LedgerAccount)` on `account` and `@IsEnum(LedgerEntryType)` on `type`. R4 closed.
- **Plan-snapshot regression test**: `apps/api/src/modules/ledger/approval-ledger.service.spec.ts:205-222` — `ApprovalLedgerService idempotency — plan snapshot (Non-Negotiable #9)` asserts second approval on the same submission is idempotent and is not re-priced with the new plan. R6 closed.
- **ADR 0006** present at `docs/adr/0006-compensating-entries-bypass-kill-switch.md`; `allowDuringKillSwitch: true` confined to `finance-admin.service.ts:253` (dev-seed) and `:300` (override). No stray uses.
- **KYB page imports `ConfirmAction`** (`apps/web/src/app/business/organisation/kyb/page.tsx:15`) but the handler at `:64` and button at `:274` are not yet wrapped — i.e. the import is a placeholder for agent-frontend-3 to wire.

## 2. Status of the four batch-2 audit gates

| Gate | Status |
|---|---|
| KYB submit confirmation (Hard Rule #6) | **addressed-this-batch** (agent-frontend-3) — component imported; submit flow not yet gated. |
| Clearance override live-mode hard-refuse | **addressed-this-batch** (agent-backend-3). Today at `approval-ledger.service.ts:59-61` only `logger.warn`s. No `PAYMENTS_PROVIDER=stitch_live` refuse. |
| `OverrideLegDto.type` uses `IsEnum` | **verified-already-done** — `finance-admin.controller.ts:34`. |
| CI grep guard for `allowDuringKillSwitch: true` | **addressed-this-batch** (agent-qa-3). |

## 3. Gates I'm holding for batch 3

### agent-backend-3 (live-test bugs + live-mode hard-refuse)
1. `apps/api/src/modules/stitch/stitch.client.ts:195` — the literal `'/api/v1/beneficiaries'` must be replaced with the correct Stitch Express path per `md-files/payment-gateway.md`. PR must cite the Stitch docs URL in the commit body; a unit test must mock the HTTP layer and assert the exact path string sent, not just a 200 shape. No `any`-casts on the response.
2. `apps/api/src/modules/payouts/payouts.service.ts:185` — replace `beneficiaryId: payout.beneficiaryId` with `beneficiaryId: <stitchBeneficiaryId>`. The `stitchBeneficiaryId` lives on `Beneficiary` (written at `beneficiary.service.ts:54`); the service must either load it by FK before the Stitch call or the `StitchPayout` row must carry a denormalised `stitchBeneficiaryId`. Test: create a payout whose `Beneficiary.stitchBeneficiaryId='stitch_ben_XYZ'` and `Beneficiary.id='uuid-...'`; assert `stitchClient.createPayout` is called with `beneficiaryId: 'stitch_ben_XYZ'`.
3. `apps/api/src/modules/ledger/approval-ledger.service.ts:55` — add an explicit `throw` when `this.config.get('PAYMENTS_PROVIDER') === 'stitch_live'` and `raw !== undefined`. Accompanying test must module-compile the service with `PAYMENTS_PROVIDER=stitch_live` + `CLEARANCE_OVERRIDE_HOURS_FREE=1` set and assert a thrown `InternalServerErrorException` (not a silent warn).
4. No plumbing widening (no extra `Beneficiary` rows written, no extra columns) outside what bug 2 needs.

### agent-frontend-3 (KYB confirm + KB Insights panel)
1. The confirmation must gate the actual mutation — assert via RTL test that `useSubmitKyb.mutateAsync` is NOT called before `ConfirmAction`'s primary handler fires. Import-only is a fail (as it stands today).
2. Confirmation copy must name the non-rollbackable consequence ("KYB cannot be edited after submit"), not generic "Are you sure".
3. KB Insights panel must hit `GET /admin/kb/confidence` through the typed `apps/web/src/lib/api/finance-admin.ts` client (no direct `fetch`). If the endpoint does not yet exist on the API tier, frontend stops and escalates — do not stub with mocked data.
4. Zero raw `LedgerEntry` shape in the web tier (standing gate).

### agent-qa-3 (CI guard + Phase 2 live dry-run re-test)
1. CI guard: must fail the build with a non-zero exit when `allowDuringKillSwitch: true` is found in any file outside `apps/api/src/modules/finance-admin/finance-admin.service.ts`. Wire into `package.json` pretest or a GitHub Actions step. Include a red test: temporarily plant the token in a throwaway file, confirm CI fails, revert.
2. Dry-run: must only start **after** agent-backend-3's PR merges. Must exercise the real Svix path (replay a captured settlement webhook), not invoke `settlePayment` directly. Assert second replay returns `idempotent: true` with zero new `LedgerEntry`. Smoke signal only — the 7-day gate stays for prod.
3. Dry-run must create a real beneficiary + payout round-trip to prove bugs 1 and 2 are dead.

### agent-architect (CSV exports + expired-bounty release)
1. Exports under `/admin/finance/exports/*` must route through class-level `@Roles(SUPER_ADMIN)` and emit an `AuditLog` entry per export (entity=`FinanceExport`). No streaming without row count in the audit `afterState`.
2. Exports join `transactionGroupId` + Stitch external reference per `admin-dashboard.md`. No Prisma raw queries.
3. Expired-bounty release scheduler writes compensating ledger entries using the existing `postTransactionGroup` path (not a new write path) and honours Kill Switch (NO `allowDuringKillSwitch: true`). Mandatory idempotency test (same bounty, same `referenceId`, second run is a no-op).

## 4. Risk register (updated)

| # | Risk | Status | Note |
|---|---|---|---|
| R1 | Svix replay storm | Unchanged | Monitor `WebhookEvent.attempts`. |
| R2 | Kill-switch bypass at pre-checkout | Resolved | Verified at `stitch-payments.service.ts:83-85`. |
| R3 | No RBAC contract tests | Resolved | 6 spec files cover the Stitch controllers. |
| R4 | Override accepts any string as account/type | Resolved | Verified at `finance-admin.controller.ts:31,34`. |
| R5 | Compensating-entry bypass undocumented | Resolved | ADR 0006. |
| R6 | Plan-snapshot re-pricing risk | Resolved | `approval-ledger.service.spec.ts:205-222`. |
| R7 | Clearance-override live-mode leak | **In flight** | agent-backend-3. WARN-only today. |
| R8 | KYB submit without confirmation | **In flight** | agent-frontend-3. Import present, not wired. |
| R9 | `allowDuringKillSwitch` token sprawl | **In flight** | agent-qa-3 CI guard. |
| R10 | **NEW — Stitch beneficiary endpoint wrong** | **Critical, in flight** | `stitch.client.ts:195` posts to `/api/v1/beneficiaries` → 404. Every hunter cash-out attempt fails. agent-backend-3. |
| R11 | **NEW — Payout passes internal UUID to Stitch** | **Critical, in flight** | `payouts.service.ts:185` passes `payout.beneficiaryId` (our DB UUID) instead of `stitchBeneficiaryId`. Even if R10 fixed, Stitch would reject. agent-backend-3. |
| R12 | **NEW — `beneficiary.service.ts:46` fallback masks Stitch failure** | **Medium** | `stitchBeneficiaryId = (result as any).id ?? ``local:${userId}``` silently writes a non-Stitch ID if Stitch responds without `id`. This is how R10/R11 reached production paths undetected. Tighten after R10 fix. |
| R13 | **NEW — Beneficiary call catch-swallow** | **Medium** | `beneficiary.service.ts:47-48` falls back to `local:` on any exception (incl. 404). Combined with R12, no upstream observability of Stitch outages. |
| R14 | **NEW — Expired-bounty release unimplemented** | Open | No `expired*` / `releaseExpired*` symbol anywhere in `apps/api/src`. Locked brand reserves grow unbounded until agent-architect lands the scheduler. |

## 5. What's left from `md-files/implementation-phases.md`

### Phase 2 (blocked)
- End-to-end green on staging for 7 consecutive days. **Blocked** on R7, R10, R11 closure + agent-qa-3 dry-run.

### Phase 3 (ready to pick up, sequenced)
- CSV / XLSX exports per module (Overview, Inbound, Reserves, Earnings & Payouts, Refunds, Overrides, Exceptions, Audit Trail). **Ready** — agent-architect.
- Subscription billing (monthly prepaid, plan snapshot, 3-day grace, auto-downgrade). **Ready** after exports.
- Expired-bounty release job. **Ready** — agent-architect (see R14).
- Finance Kill Switch auto-trigger on Critical anomaly. Manual toggle lands; auto-trigger not found.
- Exception-feed severity wiring to the reconciliation engine findings (partial).

### Phase 4 (blocked)
- All of it — KB automation, RecurringIssue signature matching, Confidence Score UI, Claude KB tooling, auto-stub KB entries. **Blocked** until Phase 2 dry-run green and Phase 3 exports + subscription billing land.

## 6. Recommendation for batch 4

After batch 3 merges and agent-qa-3's dry-run comes back green, spawn:

1. **agent-backend-4** — subscription billing (monthly prepaid, plan snapshot at renewal, 3-day grace, auto-downgrade). Must snapshot tier per Non-Negotiable #9 and emit `AuditLog` per billing cycle event. No re-pricing in-flight transactions.
2. **agent-backend-4b** — Kill Switch auto-trigger: reconciliation engine's Critical findings toggle the switch and post to an incident log. Requires a "reason" sourced from the finding's root-cause hash so R9's scoping stays intact.
3. **agent-frontend-4** — wire Phase 3 exports to the dashboard UI (download buttons + progress), consume the CSV endpoints agent-architect shipped.
4. **agent-qa-4** — RBAC supertest pass for the new export + billing routes, plus a fault-injection suite (timeout on Stitch, Svix redelivery, partial ledger commit) against the live dry-run harness.
5. **agent-architect** — scope Phase 4 KB automation: `RecurringIssue` table migration, signature function contract, and Confidence Score formula. Design-only in batch 4.

**Do not start Phase 4 implementation until:** R7, R10, R11 closed; R14 closed; Phase 2 dry-run green; exports + subscription billing shipped.
