# UpgradeService

> God node · 21 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`

**Community:** [[Webhook handlers & triggers]]

## Summary

`UpgradeService` drives the live card-consent upgrade flow (Free → Pro). `.initiateUpgrade()` creates a Stitch `/api/v1/subscriptions` mandate via `StitchClient`, returns the hosted authorization URL + internal mandate id, short-circuits if the user already has an AUTHORISED mandate. Stitch then fires webhooks that land in three idempotent handlers: `.processConsentAuthorised()` (mandate accepted), `.processRecurringCharge()` (successful period charge — writes the `subscription_charged` ledger group DEBIT `gateway_clearing` / CREDIT `subscription_revenue`), and `.processChargeFailed()` (retry/downgrade pathway). `.cancelMandate()` terminates future charges. Helper extractors (`.extractStitchSubscriptionId()`, `.extractConsentId()`, `.extractStitchPaymentId()`, `.extractAmount()`, `.extractFees()`, `.extractReason()`) normalize the Stitch payload shape.

It exists because subscription money obeys every Financial Non-Negotiable in §4: balanced ledger writes, `UNIQUE(referenceId=stitchPaymentId, actionType='subscription_charged')` idempotency, single `$transaction`, integer minor units, append-only, AuditLog-in-same-tx (via `LedgerService.postTransactionGroup` + independent AUDIT writes for INITIATE/AUTHORISE/FAIL), tier-snapshotted `StitchSubscription.tierSnapshot` + `SubscriptionPayment.tierSnapshot` (#9 plan snapshot: in-flight bounties never re-priced on tier change). Unlike bounty funding, the 3.5% global fee does not apply here — subscriptions are recurring revenue, not marketplace volume (payment-gateway.md §12). It's `semantically_similar_to` the reconciliation + clearance services that close the loop on its writes.

## Connections by Relation

### contains
- [[upgrade.service.ts]] `EXTRACTED`

### method
- [[.constructor()]] `EXTRACTED`
- [[.systemActorId()]] `EXTRACTED`
- [[.processRecurringCharge()]] `EXTRACTED`
- [[.processConsentAuthorised()]] `EXTRACTED`
- [[.processChargeFailed()]] `EXTRACTED`
- [[.readString()]] `EXTRACTED`
- [[.initiateUpgrade()]] `EXTRACTED`
- [[.cancelMandate()]] `EXTRACTED`
- [[.extractStitchSubscriptionId()]] `EXTRACTED`
- [[.extractConsentId()]] `EXTRACTED`
- [[.extractReason()]] `EXTRACTED`
- [[.extractStitchPaymentId()]] `EXTRACTED`
- [[.extractFees()]] `EXTRACTED`
- [[.extractAmount()]] `EXTRACTED`
- [[.readBigInt()]] `EXTRACTED`

### semantically_similar_to
- [[FinanceAdminService]] `INFERRED`
- [[ReconciliationService]] `INFERRED`
- [[ApprovalLedgerService]] `INFERRED`
- [[ClearanceService]] `INFERRED`
- [[ExpiredBountyService]] `INFERRED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*