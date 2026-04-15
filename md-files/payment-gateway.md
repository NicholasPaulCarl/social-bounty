# Payment Gateway — Stitch Express Integration Spec

**Canonical source** for payment behaviour in Social Bounty. All other payment-adjacent docs (`financial-architecture.md`, `admin-dashboard.md`, `claude.md`) defer to this file. If they disagree, this file wins and the others must be updated.

Provider: **Stitch Express**
- API: https://express.stitch.money/api-docs
- Webhooks (Svix): https://docs.svix.com/receiving/introduction

Related files:
- `md-files/financial-architecture.md` — ledger mechanics, idempotency, reconciliation engine
- `md-files/admin-dashboard.md` — Finance Reconciliation dashboard UI
- `md-files/knowledge-base.md` — payment incident history
- `claude.md` §Financial Non-Negotiables — non-negotiable rules

---

## 1. Overview

Stitch Express handles inbound payments (brand funding) and outbound payouts (hunter withdrawals). The platform holds funds in controlled custody between those two events, applies tier-based and global fees, enforces clearance periods, and produces a full double-entry ledger for reconciliation.

**Key principle**: all funds flow through platform-controlled custody. No direct brand-to-hunter payments. Every transaction is ledger-backed, traceable, and auditable.

---

## 2. End-to-End Payment Flow

1. Brand funds bounty via Stitch Express hosted checkout.
2. Funds captured and recorded in ledger.
3. Bounty face value moved into `brand_reserve` (escrow).
4. Hunter claims bounty, completes work, submits proof.
5. Business Admin approves submission.
6. Earnings move to `hunter_pending`.
7. Clearance period applies (tier-based).
8. Earnings move to `hunter_available`.
9. Automated payout job initiates outbound transfer.
10. On Stitch success webhook, earnings settle to `hunter_paid`.

---

## 3. Subscription Tiers

Plan snapshot is captured on the transaction at the time of bounty funding (brand) and at the time of submission approval (hunter). Subsequent tier changes do not alter in-flight transactions.

### Hunters

| Plan | Price / month | Commission | Clearance | Access | Badge |
|------|---------------|------------|-----------|--------|-------|
| Free Hunter | R0 | 20% | 72 hours | Public bounties only | — |
| Pro Hunter  | R350 | 10% | Same day | Closed bounties included | Verified |

### Brands

| Plan | Price / month | Admin fee | Access |
|------|---------------|-----------|--------|
| Free Brand | R0 | 15% | Public bounties only |
| Pro Brand  | R950 | 5% | Closed bounties enabled |

---

## 4. Global Platform Fee

A **3.5% global platform fee** applies to every transaction. It is:
- calculated independently of the tier admin fee / commission;
- stored in its own ledger account (`global_fee_revenue`);
- shown as a separate line in all UI, exports, and reports.

It is never merged into admin fee or commission figures.

---

## 5. Fee Calculations

All amounts in integer minor units (cents). Rounding: half-even (banker's) at each fee calculation, before summation.

### Brand inbound

```
brand_admin_rate   = 0.15 (Free) | 0.05 (Pro)
brand_admin_fee    = bounty_face_value * brand_admin_rate
global_fee_brand   = bounty_face_value * 0.035
brand_total_charge = bounty_face_value
                   + brand_admin_fee
                   + global_fee_brand
                   + processing_fee
                   + bank_charge
```

`processing_fee` and `bank_charge` are pass-through from Stitch.

### Hunter outbound

```
commission_rate  = 0.20 (Free) | 0.10 (Pro)
hunter_gross     = bounty_face_value
commission       = hunter_gross * commission_rate
global_fee_hunter= hunter_gross * 0.035
hunter_net       = hunter_gross
                 - commission
                 - global_fee_hunter
                 - payout_fee
                 - bank_charge
```

---

## 6. Ledger Accounts

Double-entry. All account names are canonical; do not invent variants.

### Brand-side
- `brand_cash_received`
- `brand_reserve`
- `brand_refundable`

### Hunter-side
- `hunter_pending`
- `hunter_clearing`
- `hunter_available`
- `hunter_paid`

### Platform
- `commission_revenue`
- `admin_fee_revenue`
- `global_fee_revenue`
- `processing_expense`
- `payout_fee_recovery`
- `bank_charges`

### Clearing
- `gateway_clearing` — Stitch inbound holding
- `payout_in_transit` — Stitch outbound in flight

---

## 7. Payment States

### Brand
`initiated → captured → settled → reserved → refunded`

### Hunter
`pending → clearing → available → payout_initiated → paid | failed`

State transitions are append-only ledger events. The state is a projection from the ledger, not a mutable field.

---

## 8. Double-Entry Flows

Every flow is one `transactionGroupId` inside one DB transaction.

### 8.1 Brand funding (on Stitch `payment.settled`)

```
Dr gateway_clearing       brand_total_charge
Cr brand_reserve          bounty_face_value
Cr admin_fee_revenue      brand_admin_fee
Cr global_fee_revenue     global_fee_brand
Cr processing_expense     processing_fee      (expense carried as liability then offset)
Cr bank_charges           bank_charge
```

### 8.2 Submission approval

```
Dr brand_reserve          bounty_face_value
Cr hunter_pending         bounty_face_value
```

### 8.3 Earnings split (at approval, computed against hunter plan snapshot)

```
Dr hunter_pending         hunter_gross
Cr hunter_net_payable     hunter_net
Cr commission_revenue     commission
Cr global_fee_revenue     global_fee_hunter
Cr payout_fee_recovery    payout_fee
Cr bank_charges           bank_charge
```

### 8.4 Clearance release

```
Dr hunter_pending         hunter_net
Cr hunter_available       hunter_net
```

(Pro Hunter: executes immediately. Free Hunter: executes after 72h via scheduled job.)

### 8.5 Payout initiation

```
Dr hunter_available       hunter_net
Cr payout_in_transit      hunter_net
```

### 8.6 Payout success (on Stitch `payout.settled`)

```
Dr payout_in_transit      hunter_net
Cr hunter_paid            hunter_net
```

### 8.7 Payout failure (on Stitch `payout.failed`)

```
Dr payout_in_transit      hunter_net
Cr hunter_available       hunter_net
```
Hunter returns to available; retry job picks up per retry policy.

---

## 9. Clearance Logic

```
clearance_hours =
    0   if hunter.plan_snapshot == 'PRO'
    72  otherwise
```

Clearance deadline is stored on the `hunter_pending` ledger entry at approval time. The clearance-release job runs every 15 minutes and promotes all eligible entries.

---

## 10. Stitch Express Integration

### Inbound
- Hosted checkout session created per bounty funding.
- `metadata.bountyId`, `metadata.brandId`, `metadata.internalRef` carried end-to-end.
- Webhooks via Svix: `payment.initiated`, `payment.captured`, `payment.settled`, `payment.failed`.
- Every inbound webhook must be signature-verified (Svix) and recorded in `WebhookEvent` with the external event id as the unique key.
- Idempotency key for ledger write: `stitch_payment_settled:{stitchPaymentId}`.

### Outbound
- Beneficiary created for hunter on first payout; cached thereafter.
- `payout.initiated → payout.settled | payout.failed` — same Svix verification and idempotency pattern.
- Idempotency key for ledger write: `stitch_payout_settled:{stitchPayoutId}`.

### Svix webhook handling
- Verify `svix-id`, `svix-timestamp`, `svix-signature`.
- Reject stale timestamps (> 5 minutes).
- Insert into `WebhookEvent` — unique constraint on `(provider, externalEventId)`.
- On conflict, acknowledge immediately with no side effects (safe replay).
- Process handler inside DB transaction with deterministic idempotency key.

---

## 11. Refunds

| When | Behaviour |
|------|-----------|
| Before approval | Full refund to brand — reverse `brand_reserve` and all fee accounts; return funds via Stitch to original method or `brand_refundable` balance. |
| After approval, before payout | Reverse earnings split: debit hunter accounts, credit back `brand_reserve` or refund to brand. Requires Super Admin approval. |
| After payout | Manual intervention only. Super Admin dual-approval. KB entry mandatory. |

Refund states: `requested → approved → processing → completed | failed`.

Every refund writes compensating ledger entries. No row in `LedgerEntry` is ever updated or deleted.

---

## 12. Subscription Handling

- Monthly recurring via Stitch.
- **Prepaid**: billing happens at period start; access granted only after successful capture.
- **Plan snapshot**: on every bounty creation and submission approval, the active plan is captured onto the transaction. In-flight transactions are not re-priced when a plan changes.
- **Failed billing**: grace period 3 days, then automatic downgrade to Free tier. In-flight transactions keep their snapshotted plan.

---

## 13. Automation Jobs

| Job | Cadence | Purpose |
|-----|---------|---------|
| Settlement reconciliation | Every 15 min | Match Stitch settlements vs ledger |
| Clearance release | Every 15 min | Promote pending → available where deadline passed |
| Payout execution | Every 15 min | Initiate payouts for hunters with `hunter_available > 0` |
| Payout retry | Hourly | Retry failed payouts per retry policy (3 attempts, exponential backoff, then admin review) |
| Refund processor | Every 15 min | Drive approved refunds through Stitch |
| Expired bounty release | Daily | Return unapproved reserve after bounty expiry |

All jobs are idempotent. Each run writes a `JobRun` audit row.

---

## 14. Admin Controls

Super Admin capabilities (RBAC-gated, AuditLog required):
- Approve / reject submissions
- Trigger refunds (pre-approval, post-approval, post-payout paths)
- Retry payouts
- Override fees (with reason and approval)
- Place holds on payouts
- View full ledger traces for any bounty, user, or `transactionGroupId`
- Activate / deactivate Financial Kill Switch

Every admin action requires a confirmation dialog (Hard Rule #6) and writes an AuditLog entry (Hard Rule #3) capturing actor, before state, after state, timestamp, and reason.

---

## 15. Finance Reconciliation Dashboard

Super Admin surface. Full spec and UI details in `md-files/admin-dashboard.md`. Summary below:

**Modules**: Overview Summary · Inbound Reconciliation · Reserve Monitoring · Hunter Earnings & Payouts · Refunds & Reversals · Overrides & Adjustments · Exceptions & Alerts · Audit Trail · Exports

**Overview metrics**: total collected, reserve balance, refundable balance, pending earnings, available earnings, paid out, platform revenue, failed payouts, failed refunds, overrides, unreconciled balance.

**Reconciliation rules** (each mismatch raises an exception):
- Inbound: Stitch settlements vs ledger `gateway_clearing`
- Reserve: funded vs allocated vs ledger `brand_reserve`
- Payouts: `hunter_available` → `payout_in_transit` → `hunter_paid` continuity
- Refunds: requested vs completed
- Revenue: fee calculations vs `*_revenue` accounts

**KPIs**: gross platform volume, total bounty volume, platform margin, payout time, refund rate, failure rate, reconciliation accuracy.

**Exceptions** (severity: info | warning | critical):
- Payment mismatch · Failed payout · Refund failure · Negative balance · Missing webhook · Reserve mismatch

---

## 16. Acceptance Criteria

- Stitch records match ledger records daily.
- Reserves always equal sum of open bounty face values.
- Payouts only initiate from `hunter_available` funds.
- Every failure (payment, payout, refund) is handled without ledger drift.
- Full audit trail exists for every state change.
- Finance can reconcile daily from the dashboard.
- Every admin action is logged with actor, before/after state, and reason.

---

## 17. Non-Negotiables (pointer to `claude.md` §Financial)

1. Double-entry on every mutation.
2. Idempotency enforced at DB via `UNIQUE(referenceId, actionType)`.
3. Transaction group integrity — all or nothing.
4. Integer minor units only.
5. Append-only ledger — corrections via compensating entries.
6. AuditLog entry on every mutation.
7. Retry-safe handlers for every webhook and every job.

Any PR violating these without written justification is a blocker.

---

## 18. What Claude Must Do Before Touching Payment Code

1. Read this file end to end.
2. Read `md-files/financial-architecture.md` for ledger mechanics.
3. Read `md-files/knowledge-base.md` for prior payment incidents.
4. Verify the change against §17 non-negotiables.
5. State root cause (if a fix) and cite affected ledger accounts.
6. Route implementation via `md-files/agent-team-lead.md`.
