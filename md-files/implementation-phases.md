# Implementation Phases — Payments, Ledger & KB Framework

Phased delivery of the payment system (`docs/adr/0011-tradesafe-unified-rail.md`), the ledger / reconciliation framework (`md-files/financial-architecture.md`), and the KB / dashboard layer (`md-files/admin-dashboard.md`).

Each phase has a clear exit criterion. No phase starts until the previous phase's exit criterion is met. All phases are gated by Hard Rule #4 (100% test pass rate before release).

---

## Phase 1 — Ledger Core, Inbound Payments, Reserves

**Goal**: brands can fund bounties safely; money is recorded correctly in a double-entry ledger.

Scope:
- `LedgerEntry` table in Prisma with `UNIQUE(referenceId, actionType)`, canonical accounts (`financial-architecture.md` §2), and `transactionGroupId` wiring.
- `WebhookEvent` table with `UNIQUE(provider, externalEventId)` and TradeSafe URL-path secret verification (ADR 0011 §4).
- TradeSafe hosted checkout for brand bounty funding.
- Brand funding flow (ADR 0011 §3): `tradesafe_escrow → bounty_reserved + platform_admin_fee + global_fee_revenue + processing_expense + bank_charges`.
- Fee calculation service honouring the three platform fee streams (20% hunter commission + 15% brand admin fee + 5% transaction fee per ADR 0011 §3.4) plus the independent 3.5% global fee.
- Plan snapshot on bounty creation.
- AuditLog coupled to every ledger write.
- Refund path: **before approval** only (allocation `CANCELLED` path).
- Test coverage per `claude.md` §5 for every ledger-writing handler, including webhook replay.

Exit criterion:
- Staging: brand funds 100 synthetic bounties; reconciliation matches TradeSafe `FUNDS_RECEIVED` states to ledger entries with zero unreconciled balance over 7 consecutive days; webhook replay storm produces no duplicate entries.

**Shipped as of 2026-04-24:**
- `LedgerEntry` + `LedgerTransactionGroup` with canonical accounts and `UNIQUE(referenceId, actionType)` idempotency (see `docs/adr/0005-ledger-idempotency-via-header-table.md`).
- `WebhookEvent` table with `UNIQUE(provider, externalEventId)`, URL-path-secret verification + GraphQL re-fetch, replay-safe handlers.
- TradeSafe hosted-checkout brand funding flow wired end-to-end.
- Fee engine honouring the ADR 0011 §3.4 three-stream model plus the independent 3.5% global fee in its own `global_fee_revenue` account.
- Plan snapshot recorded at bounty creation; in-flight transactions never re-priced.
- `AuditLog` coupled to every ledger write; webhook/cron writes use the system-actor id fallback.
- Pre-approval refund path via allocation `CANCELLED`.
- Phase 1 test coverage per `claude.md` §5 green in CI (happy path, retry/duplicate, partial failure rollback, webhook replay idempotent).

---

## Phase 2 — Approval, Earnings Split, Clearance, Outbound Payouts

**Goal**: approved bounties pay hunters correctly, on time, at the right fee.

Scope:
- Submission approval flow (ADR 0011 §6): `bounty_reserved → hunter_paid` via `allocationAcceptDelivery`.
- Earnings split (ADR 0011 §3.4): three platform fee streams (20% / 15% / 5%) + independent 3.5% global fee + payout / bank charges. Plan snapshotted at approval.
- Clearance release job: Pro = same day; Free = 72h. Runs every 15 min. (Policy under review per ADR 0011 §8 OQ-4 — TradeSafe's own escrow-to-bank window may collapse this internally.)
- Payout execution: TradeSafe auto-pays SELLER on `allocationAcceptDelivery`. No separate outbound call required.
- TradeSafe webhooks (success + failure) with URL-path-secret verification and GraphQL re-fetch.
- Refund path: **after approval, before payout** (Super Admin approval required; allocation `CANCELLED`).
- Reconciliation engine (`financial-architecture.md` §6): balance, duplicate, missing legs, status consistency, wallet vs ledger, payouts vs ledger (TradeSafe), reserve vs bounty.
- Automation jobs all idempotent, each writing `JobRun` audit rows.

Exit criterion:
- Staging: end-to-end fund → approve → clear → pay flow runs green for both tiers for 7 consecutive days; reconciliation green; injected failures (timeout, failed payout, webhook replay) all handled without ledger drift.

**Shipped as of 2026-04-24:**
- Submission approval flow via `allocationAcceptDelivery` live in sandbox.
- Earnings split applying the ADR 0011 §3.4 three-stream model + independent 3.5% global fee + payout / bank charges, with plan snapshotted at approval time.
- Clearance release job: Pro same-day, Free 72h, runs every 10 min; `CLEARANCE_OVERRIDE_HOURS_*` env knobs for dev/staging acceleration.
- Reconciliation engine covering all seven checks from `financial-architecture.md` §6.
- Automation jobs idempotent with `JobRun` audit rows.
- Fund → approve → clear path end-to-end on TradeSafe sandbox. Ledger remains balanced through injected failures; failure-path compensating groups post correctly.
- Post-approval / pre-payout refund path (Super Admin approval required) via allocation `CANCELLED`.

**Production gate:** The live-money segment is **blocked** pending R24 (TradeSafe production OAuth credentials). `TRADESAFE_MOCK=true` in all non-dev environments until creds arrive. Engineering state is complete: GraphQL client live, webhook handlers present, reconciliation covers the TradeSafe branch — the gap is purely the commercial onboarding.

---

## Phase 3 — Finance Reconciliation Dashboard & Admin Controls

**Goal**: finance can reconcile daily from a UI; Super Admins can act on exceptions.

Scope:
- Finance Reconciliation Dashboard modules (`admin-dashboard.md` §1): Overview, Inbound, Reserves, Earnings & Payouts, Refunds, Overrides, Exceptions, Audit Trail, Exports.
- Refund path: **after payout** (manual, dual Super Admin approval, mandatory KB entry).
- Override & adjustment flows with reason, approval, audit, compensating entries.
- Financial Kill Switch: manual toggle + auto-trigger on Critical anomaly.
- Exception feed with severities (info / warning / critical) wired to reconciliation findings.
- Exports (CSV / XLSX) for all modules with TradeSafe `transactionId` / `allocationId` + `transactionGroupId`.
- Subscription billing: **deferred**. Pro subscriptions gated behind "coming soon" placeholder per ADR 0011 §7 (TradeSafe has no recurring-subscription primitive).
- Expired bounty release job.

Exit criterion:
- Super Admin can, from the dashboard: see live imbalances, drill into any `transactionGroupId`, toggle the kill switch, approve / reject refunds, retry / hold / release payouts, apply overrides with audit trail, and export any module.

**Shipped as of 2026-04-15:**
- All nine Finance Reconciliation Dashboard modules live: Overview, Inbound, Reserves, Earnings & Payouts, Refunds, Overrides, Exceptions, Audit Trail, Exports.
- Post-payout refund path with dual Super Admin approval and mandatory KB entry (enforced).
- Override & adjustment flows posting compensating entries (never mutations) — enforced by `npm run check:kill-switch-bypass` (ADR 0006).
- Financial Kill Switch: manual toggle + auto-trip on Critical reconciliation findings.
- Exception feed wired to reconciliation findings with info / warning / critical severities.
- CSV exports on every module, including TradeSafe `transactionId` / `allocationId` + `transactionGroupId` for third-party reconciliation.
- Subscription billing surface **removed post-ADR-0011**; UI retains a "Pro subscriptions coming soon" placeholder.
- Expired-bounty release scheduler (idempotent, `JobRun`-logged).
- Brand KYB intake and review surface.
- Hunter wallet timeline (read-model projection per ADR 0002).
- Hunter payouts history page (driven by TradeSafe allocation `FUNDS_RELEASED` states per ADR 0011).

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
- Direct bank integrations outside TradeSafe.
- Pro subscriptions (deferred per ADR 0011 §7; TradeSafe has no recurring-subscription primitive).
