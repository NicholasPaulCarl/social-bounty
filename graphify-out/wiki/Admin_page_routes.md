# Admin page routes

> 250 nodes · cohesion 0.02

## Key Concepts

- **.log()** (110 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- **.get()** (73 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- **.update()** (72 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **.toString()** (44 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.create()** (36 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.catch()** (30 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- **.set()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **SubscriptionsService** (20 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/subscriptions.service.ts`
- **.postTransactionGroup()** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/ledger.service.ts`
- **MailService** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **RedisService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.resolve()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **.stringify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **.scrapeAndVerify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scraper.service.ts`
- **SubmissionsService** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.sendWithRetry()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **.createBountyFunding()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/stitch-payments.service.ts`
- **.recordRecurrence()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.service.ts`
- **.del()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **WithdrawalService** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`
- **PayoutsService** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payouts.service.ts`
- **.getToken()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.receive()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/stitch-webhook.controller.ts`
- **.receive()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/tradesafe-webhook.controller.ts`
- **TradeSafeWebhookHandler** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- *... and 225 more nodes in this community*

## Relationships

- [[Reconciliation engine]] (27 shared connections)
- [[ADRs & audit log]] (23 shared connections)
- [[Admin operations & overrides]] (21 shared connections)
- [[Wallet & withdrawals]] (20 shared connections)
- [[Admin withdrawals UI]] (18 shared connections)
- [[BrandsService class]] (16 shared connections)
- [[Bounty access & users]] (16 shared connections)
- [[AdminService class]] (14 shared connections)
- [[Auth & webhook verification]] (11 shared connections)
- [[Wallet controller & projection]] (11 shared connections)
- [[TradeSafe client & payouts]] (10 shared connections)
- [[DisputesService]] (9 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/main.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify-social.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounty-access/bounty-access.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/kyb.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/business/business.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/dispute-scheduler.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/inbox/conversations.service.ts`

## Audit Trail

- EXTRACTED: 595 (40%)
- INFERRED: 879 (60%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*