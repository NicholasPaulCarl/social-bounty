# Team Lead Audit — Batch 6 Gate Checklist

**Date:** 2026-04-15
**Branch:** `bounty`
**HEAD at audit time:** `88faeb0 feat: batch 5 — Phase 4 KB tooling, auto-downgrade, fault-injection, Playwright`
**Prior audits:** `…-phases-0-3.md`, `…-batch-2.md`, `…-batch-3.md`, `…-batch-4.md`, `…-batch-5.md`
**Test state (reported):** 1050 apps/api + 15 scripts/ = 1065 green.

## 1. Verified at HEAD `88faeb0` + what changed today

- **1050/15 tests confirmed green** (reported; no new commits since HEAD).
- **ADR 0008 written and internally consistent.** `docs/adr/0008-tradesafe-for-hunter-payouts.md` supersedes ADR 0007 and partially re-opens ADR 0003. Non-negotiables mapping carries over cleanly (double-entry, idempotency, plan-snapshot, RBAC, Kill Switch all stay at the `LedgerService` layer; only the provider-facing enum/route/env-var surface changes). Section 7 flags that TradeSafe escrow semantics may collapse the 72h clearance window — that is a real unknown that must land in the integration ADR, not this one.
- **ADR status headers updated.** ADR 0003 now reads "Partially superseded by ADR 0008 — TradeSafe in scope for payout, out of scope for a standalone escrow layer". ADR 0007 now reads "Superseded by ADR 0008 (2026-04-15)". No Peach commercial work started, so unwind is documentation-only.

## 2. Status of the holdover gates going into batch 6

| Holdover | Before (HEAD `88faeb0`) | Target after batch 6 |
|---|---|---|
| R19 — draft migration folder | **Still under `packages/prisma/migrations/20260415_subscription_revenue_ledger_draft/`.** A `prisma migrate deploy` would execute it (lexical sort is after the live `20260415143053_stitch_express`). | Move out of `migrations/` (proposal: `docs/draft-migrations/`), update release runbook. Verify via `ls packages/prisma/migrations/` returning exactly the 7 committed live migrations + `migration_lock.toml`. |
| R21 — PEACH MIGRATION markers | **8 sites found** via grep: `beneficiary.service.ts:32`, `payouts.service.ts:59/138/266/322/370`, `stitch.client.ts:167/219`. All reference "ADR 0007". | All 8 flipped to `// TRADESAFE MIGRATION (ADR 0008):`. Grep for `PEACH MIGRATION` in `apps/api/src/**` must return **zero** hits; grep for `TRADESAFE MIGRATION` must return **8**. |
| Webhook-failure → `KbService.recordRecurrence` | **NOT wired.** `grep KbService apps/api/src/modules/webhooks` returns zero matches; `stitch-webhook.controller.ts:115-119` only calls `events.markFailed` + `logger.error`. Slipped from batch 4 and batch 5. | One-line call to `kb.recordRecurrence({ category:'webhook-failure', system:'webhooks', errorCode:eventType, title:…, severity:'warning', metadata:{eventId, attempt} })` in the catch block. Signature-stability unit test added. |

agent-backend-6 owns all three. This is the last batch this holdover can survive.

## 3. Gates I'm holding for the four batch-6 agents

### agent-backend-6 (PEACH→TRADESAFE flip, R19 rename, webhook→KB wiring)
1. **Marker flip is text-only.** No behaviour change in `PayoutsService`, `StitchClient`, `BeneficiaryService`. PR diff must show only comment lines edited. CI must stay green with no snapshot regenerations.
2. **R19 rename must land in the same PR** as the flip. If the rename ships separately, the Prisma deploy window between PRs is a live foot-gun.
3. **Webhook → KB wiring must be idempotent.** The `recordRecurrence` call lives inside the existing catch block, must not throw if the KB service is unavailable (wrap in its own try/catch), and must carry a stable `errorCode` (= `eventType`, not `eventId`) so repeat failures converge on one signature. Unit test: two failures on the same `eventType` produce one `RecurringIssue` row with `occurrences=2`.

### agent-architect-6 (Ineffective Fix auto-flag, Phase 4 exit)
1. **`KbService.flagIneffectiveFix(signature)` must be idempotent.** Second call for the same signature is a no-op at DB level (`WHERE ineffectiveFix=false` guard on the update, or upsert semantics). Unit test required.
2. **Must not auto-flag in the same run that created the first occurrence.** The trigger fires only when `recordRecurrence` detects `occurrences >= 2` AND a prior KB entry with `status='resolved'` or `status='fixed'` matches the signature — i.e. the fix was declared and the problem came back. This is the literal definition of "Ineffective Fix" per `claude.md` §6.
3. **AuditLog row required** on every flag (Hard Rule #3). `entityType='kb.recurring_issue'`, `action='ineffective_fix_flagged'`, `entityId=signature`, `reason` embedding the prior-resolution entry id + new occurrence count. System actor pattern.
4. **`/admin/finance/insights` UI card is read-only, SUPER_ADMIN-gated.** No mutation surface. Pulls from a new `GET /finance/kb/ineffective-fixes` endpoint (returns rows where `ineffectiveFix=true`, ordered by most-recent occurrence).

### agent-qa-6 (refund-approval integration test, Business Admin → Super Admin)
1. **Use mocked StitchClient** — no live HTTP. Pattern already established in `reconciliation.fault-injection.spec.ts`.
2. **RBAC assertions are mandatory.** Test matrix must include: BUSINESS_ADMIN initiating a refund → 200; BUSINESS_ADMIN *approving* a refund → 403; SUPER_ADMIN approving → 200; PARTICIPANT touching either endpoint → 403. Hard Rule #2.
3. **Compensating ledger group must be balanced.** Assert symmetric debit/credit sums across the refund transaction group (Non-Negotiable #1, #3). Assert the original charge group is untouched — corrections are compensating entries only, no updates (Non-Negotiable #5).
4. **Webhook replay is idempotent.** Replay the refund webhook payload and assert the second call yields no new `LedgerEntry` rows. `UNIQUE(referenceId, actionType)` already enforces this; the test proves it.
5. **AuditLog entries written** for both the business-admin initiation and the super-admin approval (Hard Rule #3).

### agent-frontend-6 (subscription self-service UI)
1. **Upgrade CTA cannot bypass confirmation.** A PrimeReact `ConfirmDialog` fronts the upgrade action, stating the new monthly charge, the effective date, and the fact that in-flight bounties are not re-priced. Hard Rule #6.
2. **In-flight bounties must not be re-priced** (Non-Negotiable #9). UI copy must state plainly that existing bounties keep their snapshot tier. No client-side mutation of any `tierSnapshot` field.
3. **PrimeReact + Tailwind only** (Hard Rule #5). No new UI primitive library, no custom dialog component.
4. **RBAC on both routes.** `/settings/subscription` is PARTICIPANT-scoped; `/business/organisation/subscription` is BUSINESS_ADMIN-scoped. Hard Rule #2. Server-side guard (not just client-side redirect).
5. **Grace-period display** must read from `Subscription.gracePeriodEndsAt` as-is. No recomputation client-side — that's a backend concern. Reuses the auto-downgrade state machine shipped in batch 5.
6. **No destructive action without confirmation.** Cancel-at-period-end is a destructive action per Hard Rule #6.

## 4. Risk register (updated)

| # | Risk | Status | Note |
|---|---|---|---|
| R1 | Svix replay storm | Unchanged | Monitor `WebhookEvent.attempts`. Webhook→KB wiring (batch 6) will finally make this observable. |
| R7, R12, R13, R15 | Prior-batch closures | **Closed** | All verified in batches 2–5. |
| R10, R11 | Outbound provider shape | **Medium, unchanged** | Now tracking TradeSafe, not Peach. `PAYOUTS_ENABLED=false` keeps them dormant. |
| R16, R17 | Subscription ledger / KB dupes | **Closed** | Verified in batch 5 audit. |
| R18 | ~~Peach provider vacuum~~ **Renamed: TradeSafe provider vacuum** | Open — policy | Reserve ageing on the dashboard still the mitigation. Nothing in code changes; only the label. |
| R19 | Draft migration folder inside `migrations/` | **Must close in batch 6** | Held on agent-backend-6. |
| R20 | Webhook-failure KB path missing | **Must close in batch 6** | Held on agent-backend-6. |
| R21 | PEACH MIGRATION markers | **Reframed — flip to TRADESAFE MIGRATION (8 sites)** | Held on agent-backend-6. |
| **R22** | **NEW — ADR churn risk** | Open — Low | Three payout-rail ADRs in one day (0003/0007/0008). Anyone reading ADR 0007 out of context might start a Peach integration. Status headers now updated; mitigated by discoverability. |
| **R23** | **NEW — `Ineffective Fix` false positives** | Open — Low | If the flag fires on a signature whose prior resolution was "won't fix" rather than "fixed", the dashboard fills with noise. Architect-6 must restrict the trigger to entries with `status IN ('resolved','fixed')`, not all terminal states. |

## 5. What's left after batch 6

**Phase 1** — complete.

**Phase 2** — outbound payout loop: **now blocked on TradeSafe (ADR 0008)** instead of Peach. Inbound leg is green and live-tested. The 7-day end-to-end staging green remains the exit criterion; it cannot close without the payout rail.

**Phase 3** — after batch 6 closes:
- Auto-downgrade shipped (batch 5). Self-service UI shipped (frontend-6). Refund-approval integration test shipped (qa-6). Exception-feed drill-through into `RecurringIssue` id remains TODO — the only Phase 3 gap.

**Phase 4 — KB automation + Claude integration** — exit criteria status *after* batch 6:

| Exit criterion | Status |
|---|---|
| `scripts/kb-context.ts` read-only CLI for Claude | **Met** (batch 5). |
| Reconciliation → `recordRecurrence` auto-stub | **Met** (batch 4). |
| Webhook failure → `recordRecurrence` auto-stub | **Met** (batch 6, agent-backend-6). |
| `recordRecurrence` signature-stable and idempotent | **Met** (batch 4 + batch 6 webhook unit test). |
| `Ineffective Fix` auto-flag on repeat + prior resolution | **Met** (batch 6, agent-architect-6). |
| KB Insights per-system drill-down to entry list | **NOT met** — remains as a small frontend follow-up. |

After batch 6, Phase 4 has one cosmetic gap (per-system drill-down list view). I consider Phase 4 functionally complete.

## 6. Recommendation for batch 7

Three candidates, ordered by value:

1. **TradeSafe integration kick-off** — its own ADR (ADR 0009) first: provider adapter contract, `ProviderPayout` schema decision (rename or pair), webhook route, clearance-window reshape (TradeSafe escrow semantics may eliminate the 72h wait; this has ledger implications). No code until the ADR is written and gated.
2. **Playwright expansion against a running stack** — the batch 5 smoke covers four flows with mocked Stitch. Next level: subscription self-service UI (just shipped in batch 6), refund-approval dual-SA flow (just shipped in batch 6), auto-downgrade UI state transitions.
3. **Performance / load tests on the reconciliation engine under 100k ledger rows.** The engine is algorithmically simple but untested at volume. Run against a seeded staging DB, capture p95 runtime, tune the `LedgerEntry` indexes if needed.

My recommendation: **batch 7 = ADR 0009 (TradeSafe integration plan) in parallel with Playwright expansion.** Performance testing waits until there's a volume concern, not before.