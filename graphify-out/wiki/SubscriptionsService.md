# SubscriptionsService

> God node · 20 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`

**Community:** [[Subscription & auth lifecycle]]

## Summary

`SubscriptionsService` is the read + lifecycle layer for the two subscription entity kinds (`USER` and `BRAND`) and the two tiers (`FREE`, `PRO`). It exposes tier-lookup (`.getActiveTier()`, `.getActiveOrgTier()`, `.findActiveSubscription()`), feature gating (`.isFeatureEnabled()` reads from `FEATURE_MATRIX`), the end-to-end state machine (`.subscribe()`, `.cancel()` / `.cancelById()` / `.performCancel()`, `.reactivate()`, `.expireSubscription()`, `.autoDowngradeToFree()`, `.renewSubscription()`), and the payment/ledger hook `.postChargeLedger()` which writes the `subscription_charged` group (DEBIT `gateway_clearing` / CREDIT `subscription_revenue`) idempotently on `(paymentId, 'subscription_charged')`. Admin-side `.listAll()` and `.getPaymentHistory()` feed SUPER_ADMIN surfaces.

It exists because every other service needs to know "what tier is this entity right now?" — `BountiesService` reads it to snapshot `tierSnapshot` onto each bounty (Non-Negotiable #9 plan snapshot), `SubmissionsService` reads it to snapshot `COMMISSION_RATES` per approved submission, `BrandsService` reads it for feature-flag gates. `UpgradeService` (its live-upgrade sibling in `Webhook handlers & triggers` community) calls into the `performCancel` + shared pricing constants. The `.systemActorId()` helper resolves `STITCH_SYSTEM_ACTOR_ID` — required because `AuditLog.actorId` is a FK to `users.id` so ledger writes from background billing need a real user row. Dependencies: `PrismaService`, optional `LedgerService` (via `forwardRef` to break cycles), optional `ConfigService`, optional `AuditService` (so unit tests without `AuditModule` still pass).

## Connections by Relation

### contains
- [[subscriptions.service.ts]] `EXTRACTED`

### method
- [[.postChargeLedger()]] `EXTRACTED`
- [[.getActiveTier()]] `EXTRACTED`
- [[.subscribe()]] `EXTRACTED`
- [[.performCancel()]] `EXTRACTED`
- [[.getSubscription()]] `EXTRACTED`
- [[.reactivate()]] `EXTRACTED`
- [[.renewSubscription()]] `EXTRACTED`
- [[.systemActorId()]] `EXTRACTED`
- [[.getActiveOrgTier()]] `EXTRACTED`
- [[.expireSubscription()]] `EXTRACTED`
- [[.autoDowngradeToFree()]] `EXTRACTED`
- [[.cancel()]] `EXTRACTED`
- [[.getPaymentHistory()]] `EXTRACTED`
- [[.findActiveSubscription()]] `EXTRACTED`
- [[.findSubscriptionRecord()]] `EXTRACTED`
- [[.constructor()]] `EXTRACTED`
- [[.isFeatureEnabled()]] `EXTRACTED`
- [[.cancelById()]] `EXTRACTED`
- [[.listAll()]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*