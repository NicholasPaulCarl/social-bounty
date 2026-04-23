# `UpgradeService`

> Owns the Free→Pro subscription upgrade flow via Stitch card-consent and the on-settle ledger writes.

## What it does

`UpgradeService` is the write-path service for subscription upgrades. `.requestUpgrade(user, orgId, targetTier)` creates a `Subscription` row in `PENDING_AUTHORISATION` state, calls `StitchClient.createSubscription(...)` to obtain the hosted card-consent redirect URL (Stitch's `/api/v1/subscriptions` POST with monthly recurrence + `initialAmountCents === amountCents` for prepaid billing), and returns the URL the frontend chains into via `redirect-to-hosted-checkout.ts`. `.onSubscriptionAuthorised(event, payload)` is the webhook-router target for Stitch's authorisation ack — transitions the subscription to `ACTIVE` and posts the first-period ledger leg pair via `LedgerService.postTransactionGroup` with `actionType: 'subscription_authorised'`. `.onSubscriptionCharged(event, payload)` handles recurring renewals. Both use `UNIQUE(referenceId, actionType)` idempotency.

## Why it exists

Phase 3 closed the subscription lifecycle per `md-files/implementation-phases.md`, wiring a live Upgrade CTA through Stitch's subscription API instead of the initial mock-only `getActiveTier()` toggle. The design matches Financial Non-Negotiable #9 (plan snapshot) — the tier in force at the time of a ledger write is captured on that transaction, so in-flight transactions aren't re-priced when the plan changes. The auto-downgrade state machine (handled by `SubscriptionsService`) complements `UpgradeService`'s up-flip with a down-flip when a Pro subscription's card-consent lapses. The `SUBSCRIPTION+AUTHORISED` and `SUBSCRIPTION+CHARGED` webhook arms in `WebhookRouterService.dispatch` are the binding between Stitch's event stream and this service.

## How it connects

- **`StitchClient.createSubscription`** — produces the hosted card-consent URL; `authRedirectUrl` is what the frontend navigates to.
- **`LedgerService.postTransactionGroup`** — posts the first-period leg pair on authorisation, recurring-period pairs on subsequent charges.
- **`WebhookRouterService.dispatch`** — routes `SUBSCRIPTION+AUTHORISED` / `SUBSCRIPTION+CHARGED` here.
- **`SubscriptionsService.getActiveTier`** / `.getActiveOrgTier()` — the read path; consulted by `BountiesService.create()` and others for feature-gate checks.
- **`AuditService.log()`** — every state transition audits (Hard Rule #3).
- **`Subscription`, `SubscriptionPayment` (Prisma entities)** — the rows this service mutates.
- **`StitchSubscriptionResponse` (shared)** — the typed client response; used to populate the new subscription row.

---
**degree:** 21 • **community:** "Webhook handlers & triggers" (ID 12) • **source:** `apps/api/src/modules/subscriptions/upgrade.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the plan-snapshot discipline is the subtle but load-bearing rule. If a tier-aware pricing function reads `SubscriptionsService.getActiveTier()` at ledger-write time instead of using the snapshot on the bounty/transaction, a mid-subscription price change will mis-bill. Every ledger-adjacent consumer must snapshot tier at creation.
