# Subscription & auth lifecycle

> 78 nodes · cohesion 0.04

## Key Concepts

- **SubscriptionsService** (20 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **users.service.spec.ts** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.service.spec.ts`
- **auth.service.ts** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- **ConversationsService** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- **SubscriptionsController** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.controller.ts`
- **wallet-service.spec.ts** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.sendMessage()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- **.getActiveTier()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.performCancel()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.postChargeLedger()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.subscribe()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **auth.module.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.module.ts`
- **brands.service.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.ts`
- **disputes-service.spec.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/__tests__/disputes-service.spec.ts`
- **submissions.service.spec.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.spec.ts`
- **subscriptions.service.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **users.module.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.module.ts`
- **users.service.ts** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/users/users.service.ts`
- **.getSubscription()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.reactivate()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **auth.service.spec.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.spec.ts`
- **brands.service.spec.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.spec.ts`
- **subscription.constants.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription.constants.ts`
- **subscriptions.controller.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.controller.ts`
- **subscriptions.service.spec.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.spec.ts`
- *... and 53 more nodes in this community*

## Relationships

- [[API service layer]] (25 shared connections)
- [[Next.js page routes]] (8 shared connections)
- [[Ledger & payment services]] (4 shared connections)
- [[Bounty service & tests]] (4 shared connections)
- [[User & brand profile services]] (3 shared connections)
- [[Controllers & RBAC guards]] (2 shared connections)
- [[Webhook handlers & triggers]] (2 shared connections)
- [[REST API controllers]] (1 shared connections)
- [[Wallet service]] (1 shared connections)
- [[Bounty creation form]] (1 shared connections)
- [[Inbox & notifications]] (1 shared connections)
- [[Roadmap & risk concepts]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/jwt-auth.guard.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/user-status.guard.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/user-status.guard.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.module.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/__tests__/auth-refresh-race.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.module.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/jwt.strategy.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/__tests__/disputes-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.module.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/__tests__/conversations-service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/__tests__/submission-edge-cases.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscription.constants.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.spec.ts`

## Audit Trail

- EXTRACTED: 158 (56%)
- INFERRED: 122 (44%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*