# Webhook handlers & triggers

> 66 nodes · cohesion 0.06

## Key Concepts

- **.dispatch()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **UpgradeService** (21 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **BrandFundingHandler** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **TradeSafeWebhookHandler** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **PayoutsService** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.extractPayoutId()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.constructor()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.processRecurringCharge()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.systemActorId()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.onPaymentSettled()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **WebhookRouterService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **.dispatchTradeSafe()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **.onPayoutFailed()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.constructor()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **.extractReason()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.processChargeFailed()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.processConsentAuthorised()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.readString()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.onPaymentFailed()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **.onPayoutSettled()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.systemActorId()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **StitchPaymentsService** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/stitch-payments.service.ts`
- **.readString()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.constructor()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- **tradesafe-webhook.handler.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- *... and 41 more nodes in this community*

## Relationships

- [[API service layer]] (58 shared connections)
- [[Ledger & payment services]] (6 shared connections)
- [[Next.js page routes]] (5 shared connections)
- [[Finance admin dashboard]] (4 shared connections)
- [[User & brand profile services]] (2 shared connections)
- [[Reconciliation engine]] (2 shared connections)
- [[Subscription & auth lifecycle]] (2 shared connections)
- [[Project charter & ADRs]] (1 shared connections)
- [[REST API controllers]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/clearance.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/stitch-payments.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refunds.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-event.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/AccessTypeSection.tsx`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/BrandAssetsSection.tsx`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/bounty-form/ChannelSelectionSection.tsx`

## Audit Trail

- EXTRACTED: 211 (61%)
- INFERRED: 136 (39%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*