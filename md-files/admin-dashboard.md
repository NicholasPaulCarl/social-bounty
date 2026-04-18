# Admin Dashboard — Financial Control Centre & KB Surface

Super Admin surface for reconciling payment providers (Stitch inbound, Stitch + TradeSafe outbound) against the ledger, managing reserves, payouts, refunds, overrides, and exceptions — plus monitoring KB-level system health. UI uses PrimeReact + Tailwind (Hard Rule #5). All routes RBAC-gated to Super Admin only.

Payment behaviour (flows, states, fees, webhooks) is defined canonically in `md-files/payment-gateway.md`. This file describes the UI and operational actions on top of that model.

---

## 1. Finance Reconciliation Dashboard

Purpose: provide a full financial control centre to reconcile payment providers (Stitch + TradeSafe) against the ledger, track reserves, payouts, refunds, manage overrides and exceptions, and audit all financial activity.

### Core modules

- Overview Summary
- Inbound Reconciliation
- Reserve Monitoring
- Hunter Earnings & Payouts
- Refunds & Reversals
- Overrides & Adjustments
- Exceptions & Alerts
- Audit Trail
- Exports

### 1.1 Overview Summary

Metric tiles (live, read-through, no cache > 60s):
- Total collected
- Reserve balance
- Refundable balance
- Pending earnings
- Available earnings
- Paid out
- Platform revenue (commission + admin fee + global fee, broken out)
- Failed payouts
- Failed refunds
- Overrides (last 30d)
- Unreconciled balance

### 1.2 Inbound Reconciliation

Tracks Stitch references vs internal records. Each row: Stitch payment id · internal bounty / brand · amount · status · discrepancy.

Statuses: `matched | mismatch | missing | duplicate`.

Actions per row: **reconcile** · **mark review**.

### 1.3 Reserve Monitoring

Tracks funded vs allocated, reserve vs approved, expired reserves.

Alerts raised as exceptions:
- Underfunded bounty
- Over-allocation
- Mismatch with ledger `brand_reserve`

### 1.4 Hunter Earnings & Payouts

Tracks hunter money through every state: `pending → clearing → available → payout_initiated → paid | failed`.

Filters by hunter, plan tier, bounty, date range, state.

Actions per row: **retry payout** · **hold payout** · **release payout**. All require confirmation dialog and reason (Hard Rule #6).

### 1.5 Refunds & Reversals

Tracks full refunds, partial refunds, payout returns.

Statuses: `requested | approved | processing | completed | failed`.

Actions: **approve** · **reject** · **retry**.

Refund rules and allowed paths (before approval / before payout / after payout) are defined in `payment-gateway.md` §11.

### 1.6 Overrides & Adjustments

Supports fee overrides, manual credits / debits, reserve corrections, payout overrides, write-offs.

Rules for every override:
- Reason required (free text, min 20 chars).
- Approval required (dual Super Admin for amounts > threshold).
- Audit required — writes AuditLog with before / after state.
- Writes compensating ledger entries, never mutates existing ones.

### 1.7 Exceptions & Alerts

Feed of reconciliation findings and handler failures.

Types: payment mismatch · failed payout · refund failure · negative balance · missing webhook · reserve mismatch.

Severity: `info | warning | critical`.

Each item links to: affected `transactionGroupId`(s), related KB entry (if one has been auto-created), suggested remediation.

### 1.8 Audit Trail

Tracks payments, approvals, payouts, refunds, overrides. Every row carries: actor, action, before state, after state, reason, timestamp, `transactionGroupId`.

Fully searchable and filterable. Read-only.

### 1.9 Exports

CSV / XLSX exports for: payments · payouts · refunds · overrides · statements · audit logs. All exports include the Stitch external reference and the internal `transactionGroupId` for traceability.

---

## 2. Reconciliation Rules

Each mismatch generates an exception with severity.

| Rule | Sources | Raises |
|------|---------|--------|
| Inbound | Stitch settlements vs `gateway_clearing` ledger | mismatch, missing, duplicate |
| Reserve | `bounty.face_value` vs `brand_reserve` ledger balance | underfunded, over-allocation |
| Payouts | `hunter_available` → `payout_in_transit` → `hunter_paid` continuity | stuck in transit, missing leg |
| Refunds | Refund requested vs completed (Stitch + ledger) | failure, drift |
| Revenue | Computed fee amounts vs `commission_revenue`, `admin_fee_revenue`, `global_fee_revenue` | mismatch |

---

## 3. KPIs

- Gross platform volume
- Total bounty volume
- Platform margin
- Payout time (approval → paid)
- Refund rate
- Failure rate (inbound and outbound)
- Reconciliation accuracy (matched / total, rolling 7d and 30d)

---

## 4. Financial Kill Switch

Global toggle that halts all outbound money movement (payouts, refunds) without blocking reads or inbound webhooks.

Triggered by:
- Manual Super Admin action.
- Automated: any Critical financial-impact anomaly detected by the reconciliation engine.

Behaviour when active:
- Payout handlers reject with a clear error code and log the rejection.
- Webhooks are still ingested and recorded but their side effects are deferred.
- UI banner visible to all Super Admins.
- AuditLog entry on activation and deactivation.

Deactivation requires Super Admin action plus a signed-off KB entry referencing the resolved anomaly.

---

## 5. KB Insights (system health panel)

Separate from financial reconciliation; surfaces KB-level patterns.

- Top 10 root causes by frequency.
- Most unstable systems (by KB entries in last 90 days).
- Fix effectiveness — % of fixes where the same root cause has not recurred within 90 days of the fix.
- Confidence score per system (see §6).

---

## 6. Confidence Score

Per-system score. Heuristic, not authoritative.

```
score(system) = 100
              - 20 * (open Critical KB entries)
              - 10 * (open High KB entries)
              -  5 * (recurrences in last 90 days)
              -  5 * (failed reconciliation runs in last 7 days)
clamped to [0, 100]
```

Systems: Wallet · Payouts · Bounty · Auth · Integrations.

---

## 7. Fix Effectiveness Tracking

When a KB entry is marked Resolved, the system records the root cause signature. If the same signature recurs, the prior KB entry is marked `Ineffective Fix` and a new entry opens linked to it.

Dashboard shows a rolling 90-day effectiveness ratio: `resolved_without_recurrence / total_resolved`.

---

## 8. Acceptance Criteria

- Stitch records match ledger records daily.
- Reserves always equal sum of open bounty face values.
- Payouts initiate only from `hunter_available` funds.
- Every failure (payment, payout, refund) is handled without ledger drift.
- Full audit trail exists for every state change.
- Finance can reconcile daily from the dashboard.
- Every admin action is logged with actor, before / after state, reason.

---

## 9. Routes & RBAC

All routes under `/admin/*`. RBAC middleware enforces Super Admin (Hard Rule #2). RBAC is enforced at the API layer, not only the UI.

- `/admin/finance/overview`
- `/admin/finance/inbound`
- `/admin/finance/reserves`
- `/admin/finance/earnings`
- `/admin/finance/refunds`
- `/admin/finance/overrides`
- `/admin/finance/exceptions`
- `/admin/finance/audit`
- `/admin/finance/exports`
- `/admin/finance/kill-switch`
- `/admin/kb-insights`
- `/admin/recurring-issues`

Destructive actions (kill switch toggle, refund approval, override application, KB dismiss) require confirmation dialogs (Hard Rule #6).

---

## 10. Build Notes

- Read-heavy panels; acceptable to cache aggregates for 60 seconds.
- Kill switch toggle must be strongly consistent — read-through, no cache.
- All panel queries must respect RBAC at the API layer.
- All exports must include Stitch external reference and internal `transactionGroupId`.
