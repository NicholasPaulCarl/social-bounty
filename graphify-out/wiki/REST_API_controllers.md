# REST API controllers

> 155 nodes · cohesion 0.03

## Key Concepts

- **.update()** (74 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **FinanceAdminService** (26 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- **.dispatch()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **UpgradeService** (21 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.postTransactionGroup()** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/ledger.service.ts`
- **ReconciliationService** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **.run()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- **BrandFundingHandler** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **TradeSafeWebhookHandler** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.postApproval()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- **PayoutsService** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.extractPayoutId()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.constructor()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.processRecurringCharge()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.systemActorId()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **.onPaymentSettled()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- **ConversationsService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- **.releaseEligible()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.service.ts`
- **WebhookRouterService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **ApprovalLedgerService** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- **.upsertForUser()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/beneficiary.service.ts`
- **.initiatePayout()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.onPayoutFailed()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- **.dispatchTradeSafe()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/webhook-router.service.ts`
- **runBench()** (7 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- *... and 130 more nodes in this community*

## Relationships

- [[Webhook handlers & triggers]] (306 shared connections)
- [[API service layer]] (293 shared connections)
- [[Reconciliation engine]] (57 shared connections)
- [[User & brand profile services]] (41 shared connections)
- [[Finance admin dashboard]] (37 shared connections)
- [[Subscription & auth lifecycle]] (36 shared connections)
- [[Ledger & payment services]] (12 shared connections)
- [[Controllers & RBAC guards]] (11 shared connections)
- [[Next.js page routes]] (8 shared connections)
- [[Bounty access & mutation]] (7 shared connections)
- [[Inbox & notifications]] (5 shared connections)
- [[Bounty service & tests]] (3 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/notifications.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/clearance.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/ledger.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/brand-funding.handler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/stitch-payments.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/beneficiary.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refunds.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refunds.service.ts`

## Audit Trail

- EXTRACTED: 437 (53%)
- INFERRED: 388 (47%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*