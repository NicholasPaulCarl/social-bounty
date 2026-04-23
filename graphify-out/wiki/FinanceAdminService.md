# FinanceAdminService

> God node · 26 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`

**Community:** [[Finance admin dashboard]]

## Summary

`FinanceAdminService` is the SUPER_ADMIN-only read + limited-mutation layer for the platform's money. It powers the `/admin/finance/*` surfaces — the overview tile grid, inbound Stitch payments list, reserve drill-down, earnings-and-payouts view, refund and exception tables, the kill-switch toggle, per-transaction-group audit trail, override entry, and the Phase-3 visibility-failure + Phase-3D analytics surfaces. Methods include `.overview()`, `.reserves()`, `.inboundList()`, `.earningsPayouts()`, `.listPayouts()`, `.listRefunds()`, `.listExceptions()`, `.auditTrail()`, `.toggleKillSwitch()`, `.postOverride()`, `.getTransactionGroup()`, `.listVisibilityFailures()`, `.listVisibilityHistory()`, and `.getVisibilityAnalytics()` (with `.computeFailureRate()` + `.computeVisibilityAlerts()` helpers).

It exists because finance integrity lives in Postgres ledger rows — but humans need an auditable window into them that never violates §4. It strictly reads from the append-only ledger and composes (never rewrites) `LedgerService.postTransactionGroup` for the one mutation path (manual overrides). It's `semantically_similar_to` the writers it reports on — `BrandFundingHandler` (Stitch inbound), `UpgradeService` (subscription charges), `ApprovalLedgerService` + `ClearanceService` (hunter payout lifecycle), and `ReconciliationService` (which writes the exceptions it surfaces). The Phase-3D visibility analytics (ADR 0010) uses two-tier thresholds with sample-size floors so `computeFailureRate()` never trips a critical alert on noisy 1/2 samples.

## Connections by Relation

### contains
- [[finance-admin.service.ts]] `EXTRACTED`

### method
- [[.getVisibilityAnalytics()]] `EXTRACTED`
- [[.reserves()]] `EXTRACTED`
- [[.overview()]] `EXTRACTED`
- [[.devSeedPayable()]] `EXTRACTED`
- [[.inboundList()]] `EXTRACTED`
- [[.earningsPayouts()]] `EXTRACTED`
- [[.listRefunds()]] `EXTRACTED`
- [[.toggleKillSwitch()]] `EXTRACTED`
- [[.listVisibilityHistory()]] `EXTRACTED`
- [[.postOverride()]] `EXTRACTED`
- [[.constructor()]] `EXTRACTED`
- [[.listPayouts()]] `EXTRACTED`
- [[.listExceptions()]] `EXTRACTED`
- [[.getTransactionGroup()]] `EXTRACTED`
- [[.listVisibilityFailures()]] `EXTRACTED`
- [[.computeFailureRate()]] `EXTRACTED`
- [[.computeVisibilityAlerts()]] `EXTRACTED`
- [[.auditTrail()]] `EXTRACTED`

### semantically_similar_to
- [[UpgradeService]] `INFERRED`
- [[ReconciliationService]] `INFERRED`
- [[BrandFundingHandler]] `INFERRED`
- [[TradeSafeWebhookHandler]] `INFERRED`
- [[ApprovalLedgerService]] `INFERRED`
- [[ClearanceService]] `INFERRED`
- [[ExpiredBountyService]] `INFERRED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*