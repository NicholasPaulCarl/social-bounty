# API service layer

> 205 nodes · cohesion 0.02

## Key Concepts

- **.log()** (111 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- **.get()** (73 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- **.catch()** (30 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- **.set()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **DisputesService** (22 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **MailService** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **bench-reconciliation.ts** (17 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **StitchClient** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.resolve()** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **RedisService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.stringify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **.authedRequest()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.scrapeAndVerify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scraper.service.ts`
- **apify.mappers.ts** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **.sendWithRetry()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **WithdrawalService** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`
- **ApifyService** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- **.refreshForBrand()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- **AuthService** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- **main()** (11 connections) — `/Users/nicholasschreiber/social-bounty/scripts/bench-reconciliation.ts`
- **.recordRecurrence()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.service.ts`
- **.del()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.getToken()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.receive()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/webhooks/stitch-webhook.controller.ts`
- **TradeSafeClient** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- *... and 180 more nodes in this community*

## Relationships

- [[Apify scraping integration]] (111 shared connections)
- [[Reconciliation engine]] (66 shared connections)
- [[Webhook handlers & triggers]] (19 shared connections)
- [[Bounty access & mutation]] (18 shared connections)
- [[Bounty service & tests]] (10 shared connections)
- [[Auth & settings admin]] (10 shared connections)
- [[User & brand profile services]] (10 shared connections)
- [[Wallet service]] (10 shared connections)
- [[External API clients]] (9 shared connections)
- [[Scrape recovery scheduler]] (9 shared connections)
- [[Subscription & auth lifecycle]] (9 shared connections)
- [[Next.js page routes]] (8 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/main.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify-social.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/business/business.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/clearance.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.module.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/payout-provider.factory.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payouts/stitch-payout.adapter.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refunds.service.ts`

## Audit Trail

- EXTRACTED: 576 (47%)
- INFERRED: 643 (53%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*