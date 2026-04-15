# Implementation Phases — Payments, Ledger & KB Framework

Phased delivery of the payment system (`md-files/payment-gateway.md`), the ledger / reconciliation framework (`md-files/financial-architecture.md`), and the KB / dashboard layer (`md-files/admin-dashboard.md`).

Each phase has a clear exit criterion. No phase starts until the previous phase's exit criterion is met. All phases are gated by Hard Rule #4 (100% test pass rate before release).

---

## Phase 1 — Ledger Core, Inbound Payments, Reserves

**Goal**: brands can fund bounties safely; money is recorded correctly in a double-entry ledger.

Scope:
- `LedgerEntry` table in Prisma with `UNIQUE(referenceId, actionType)`, canonical accounts (`financial-architecture.md` §2), and `transactionGroupId` wiring.
- `WebhookEvent` table with `UNIQUE(provider, externalEventId)` and Svix signature verification.
- Stitch Express hosted checkout for brand bounty funding.
- Brand funding flow (`payment-gateway.md` §8.1): `gateway_clearing → brand_reserve + admin_fee_revenue + global_fee_revenue + processing_expense + bank_charges`.
- Fee calculation service honouring tier admin fee (15% / 5%) and the independent 3.5% global fee.
- Plan snapshot on bounty creation.
- AuditLog coupled to every ledger write.
- Refund path: **before approval** only.
- Test coverage per `claude.md` §5 for every ledger-writing handler, including webhook replay.

Exit criterion:
- Staging: brand funds 100 synthetic bounties; reconciliation matches Stitch settlements to ledger entries with zero unreconciled balance over 7 consecutive days; webhook replay storm produces no duplicate entries.

**Shipped as of 2026-04-15:**
- `LedgerEntry` + `LedgerTransactionGroup` with canonical accounts and `UNIQUE(referenceId, actionType)` idempotency (see `docs/adr/0005-ledger-idempotency-via-header-table.md`).
- `WebhookEvent` table with `UNIQUE(provider, externalEventId)`, Svix signature verification, replay-safe handlers.
- Stitch Express hosted-checkout brand funding flow wired end-to-end.
- Fee engine honouring tier admin fee (15% Free / 5% Pro) and the independent 3.5% global fee in its own `global_fee_revenue` account.
- Plan snapshot recorded at bounty creation; in-flight transactions never re-priced.
- `AuditLog` coupled to every ledger write; webhook/cron writes use `STITCH_SYSTEM_ACTOR_ID` as the actor fallback.
- Pre-approval refund path.
- Phase 1 test coverage per `claude.md` §5 green in CI (happy path, retry/duplicate, partial failure rollback, webhook replay idempotent).
- Live sandbox proof in `docs/reviews/2026-04-15-phase-2-live-test.md` (fund path confirmed balanced, idempotent, audit-logged).

---

## Phase 2 — Approval, Earnings Split, Clearance, Outbound Payouts

**Goal**: approved bounties pay hunters correctly, on time, at the right fee.

Scope:
- Submission approval flow (`payment-gateway.md` §8.2): `brand_reserve → hunter_pending`.
- Earnings split (`payment-gateway.md` §8.3): applies tier commission (20% / 10%) + independent 3.5% global fee + payout / bank charges. Plan snapshotted at approval.
- Clearance release job (`payment-gateway.md` §9): Pro = same day; Free = 72h. Runs every 15 min.
- Payout execution job: beneficiary creation, Stitch payout initiation, `hunter_available → payout_in_transit`.
- Stitch outbound webhooks (success + failure) with Svix verification and idempotency.
- Payout retry policy: 3 attempts, exponential backoff, then admin review.
- Refund path: **after approval, before payout** (Super Admin approval required).
- Reconciliation engine (`financial-architecture.md` §6): balance, duplicate, missing legs, status consistency, wallet vs ledger, Stitch vs ledger, reserve vs bounty.
- Automation jobs (`payment-gateway.md` §13) all idempotent, each writing `JobRun` audit rows.

Exit criterion:
- Staging: end-to-end fund → approve → clear → pay flow runs green for both tiers for 7 consecutive days; reconciliation green; injected failures (timeout, failed payout, webhook replay) all handled without ledger drift.

**Shipped as of 2026-04-15:**
- Submission approval flow (`brand_reserve → hunter_pending`) live.
- Earnings split applying tier commission (20% Free / 10% Pro) + independent 3.5% global fee + payout / bank charges, with plan snapshotted at approval time.
- Clearance release job: Pro same-day, Free 72h, runs every 10 min; `CLEARANCE_OVERRIDE_HOURS_*` env knobs for dev/staging acceleration.
- Reconciliation engine covering all seven checks from `financial-architecture.md` §6.
- Automation jobs idempotent with `JobRun` audit rows.
- Fund → approve → clear path **live-tested** in Stitch Express sandbox — see `docs/reviews/2026-04-15-phase-2-live-test.md`. Ledger remains balanced through injected failures; failure-path compensating groups post correctly.
- Post-approval / pre-payout refund path (Super Admin approval required).
- Stitch outbound webhook shell (Svix verification, replay-safe) is in place and will be reused by the TradeSafe outbound when that workstream lands.

**Exit criterion deferral:** The `→ pay` segment of the exit criterion is **deferred**. Per `docs/adr/0008-tradesafe-for-hunter-payouts.md`, Stitch Express does not expose a multi-recipient payout surface, so hunter payouts move to TradeSafe in a separate workstream. `PAYOUTS_ENABLED=false` in all non-dev environments until that integration ships. The Phase 2 live-test already demonstrated that the existing payout scheduler, ledger-side of the payout (`hunter_available → payout_in_transit → hunter_paid`), retry policy, and webhook handlers are all in place and balance correctly — the gap is purely the outbound rail integration.

---

## Phase 3 — Finance Reconciliation Dashboard & Admin Controls

**Goal**: finance can reconcile daily from a UI; Super Admins can act on exceptions.

Scope:
- Finance Reconciliation Dashboard modules (`admin-dashboard.md` §1): Overview, Inbound, Reserves, Earnings & Payouts, Refunds, Overrides, Exceptions, Audit Trail, Exports.
- Refund path: **after payout** (manual, dual Super Admin approval, mandatory KB entry).
- Override & adjustment flows with reason, approval, audit, compensating entries.
- Financial Kill Switch: manual toggle + auto-trigger on Critical anomaly.
- Exception feed with severities (info / warning / critical) wired to reconciliation findings.
- Exports (CSV / XLSX) for all modules with Stitch external reference + `transactionGroupId`.
- Subscription billing: monthly prepaid, plan snapshot, failed-billing grace period (3 days) and downgrade.
- Expired bounty release job.

Exit criterion:
- Super Admin can, from the dashboard: see live imbalances, drill into any `transactionGroupId`, toggle the kill switch, approve / reject refunds, retry / hold / release payouts, apply overrides with audit trail, and export any module.

**Shipped as of 2026-04-15:**
- All nine Finance Reconciliation Dashboard modules live: Overview, Inbound, Reserves, Earnings & Payouts, Refunds, Overrides, Exceptions, Audit Trail, Exports.
- Post-payout refund path with dual Super Admin approval and mandatory KB entry (enforced).
- Override & adjustment flows posting compensating entries (never mutations) — enforced by `npm run check:kill-switch-bypass` (ADR 0006).
- Financial Kill Switch: manual toggle + auto-trip on Critical reconciliation findings.
- Exception feed wired to reconciliation findings with info / warning / critical severities.
- CSV exports on every module, including Stitch external reference + `transactionGroupId` for third-party reconciliation.
- Subscription billing surface: monthly prepaid, plan snapshot, 3-day failed-billing grace period, auto-downgrade. Upgrade CTA gated pending live card-consent flow.
- Expired-bounty release scheduler (idempotent, `JobRun`-logged).
- Brand KYB intake and review surface.
- Hunter wallet timeline (read-model projection per ADR 0002).
- Hunter payouts history page (read-only; execution gated behind TradeSafe per ADR 0008).

---

## Phase 4 — KB Automation & Claude Integration

**Goal**: the system learns from itself. Recurring issues are detected automatically and surfaced to Claude.

Scope:
- `md-files/knowledge-base.md` populated with real entries (manual during Phases 1–3, auto-stub from Phase 4).
- `RecurringIssue` DB table and write-path from reconciliation findings.
- Auto-creation of KB entry stubs on the triggers in `claude.md` §9.
- Root cause signature matching to detect recurrence automatically; `recurrenceCount` bumped; prior entry flagged `Ineffective Fix` when the same signature repeats.
- KB Insights panel + Confidence Score (`admin-dashboard.md` §5–6) live.
- Claude tooling: agent / script that pulls top-N relevant KB entries for a given file path or system and includes them in Agent Team Lead context.

Exit criterion:
- When a known failure pattern recurs, the system automatically: opens a KB stub, links it to the prior entry, bumps the counter, flags the original fix as `Ineffective Fix`, and surfaces it on the dashboard.

**Shipped as of 2026-04-15:**
- `md-files/knowledge-base.md` populated with real entries from Phases 1–3 incidents and the Phase 2 live-test findings.
- `RecurringIssue` table and write-path from reconciliation findings live.
- Auto-stub creation wired to all six `claude.md` §9 triggers (duplicate transaction, ledger imbalance, reconciliation mismatch, recurrence threshold, Critical/High financial-impact incidents).
- Root-cause signature matching with `recurrenceCount` bumps.
- **Ineffective Fix auto-flag**: prior KB entry is flagged automatically when its root-cause signature recurs within the recurrence window.
- KB Insights panel + Confidence Score live in the admin dashboard.
- Claude context tool (`scripts/kb-context.ts`) returns top-N relevant KB entries for a given file path or system; integrated into the Agent Team Lead context pipeline.

---

## Dependencies & Sequencing

- Phase 2 depends on Phase 1's ledger, webhook, and reserve infrastructure.
- Phase 3 depends on Phase 2's reconciliation engine and end-to-end flow.
- Phase 4 depends on Phase 3's exception feed and audit trail.

## Out of Scope (for this framework)

- Multi-currency (MVP is single-currency ZAR).
- Real-time streaming reconciliation (batch every 15 min is sufficient).
- ML-based anomaly detection (rule-based only).
- Direct bank integrations outside Stitch Express.
