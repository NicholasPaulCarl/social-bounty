# Webhook handlers & triggers

> 66 nodes · cohesion 0.04

## Key Concepts

- **SubscriptionsService** (20 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **InboxController** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/inbox.controller.ts`
- **submission-visibility.scheduler.ts** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-visibility.scheduler.ts`
- **NotificationsService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/notifications.service.ts`
- **SubscriptionsController** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.controller.ts`
- **.createNotification()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/notifications.service.ts`
- **SubscriptionLifecycleScheduler** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.ts`
- **.getActiveTier()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.performCancel()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.postChargeLedger()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.subscribe()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.processExpiries()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.ts`
- **.getSubscription()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.reactivate()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.renewSubscription()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.cancelMandate()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`
- **payouts.scheduler.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.scheduler.ts`
- **payout-scheduler.service.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/payout-scheduler.service.ts`
- **subscription.constants.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription.constants.ts`
- **subscription-lifecycle.scheduler.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.ts`
- **buildFeaturesDto()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription.constants.ts`
- **.processGracePeriod()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.ts`
- **.processRenewals()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.ts`
- **.autoDowngradeToFree()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.expireSubscription()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- *... and 41 more nodes in this community*

## Relationships

- [[Subscription & auth lifecycle]] (88 shared connections)
- [[API service layer]] (59 shared connections)
- [[Inbox & notifications]] (45 shared connections)
- [[Next.js page routes]] (29 shared connections)
- [[Ledger & payment services]] (1 shared connections)
- [[Project charter & ADRs]] (1 shared connections)
- [[REST API controllers]] (1 shared connections)
- [[Bounty service & tests]] (1 shared connections)
- [[Controllers & RBAC guards]] (1 shared connections)
- [[Bounty access & mutation]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/inbox.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/notifications.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/__tests__/submission-visibility.scheduler.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/payout-scheduler.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-visibility.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription-lifecycle.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription.constants.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts`

## Audit Trail

- EXTRACTED: 162 (70%)
- INFERRED: 68 (30%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*