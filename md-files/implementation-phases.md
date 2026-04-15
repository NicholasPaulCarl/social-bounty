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
