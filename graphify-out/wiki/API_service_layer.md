# API service layer

> 278 nodes · cohesion 0.02

## Key Concepts

- **.log()** (111 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/audit/audit.service.ts`
- **.update()** (74 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.controller.ts`
- **.get()** (73 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance/payments-health.controller.ts`
- **.toString()** (46 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/__tests__/wallet-service.spec.ts`
- **.create()** (36 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.catch()** (30 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/common/filters/http-exception.filter.ts`
- **.set()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **DisputesService** (22 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **SubmissionsService** (20 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts`
- **.postTransactionGroup()** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/ledger.service.ts`
- **MailService** (19 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **StitchClient** (17 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.resolve()** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- **RedisService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.stringify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **.authedRequest()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.scrapeAndVerify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scraper.service.ts`
- **.sendWithRetry()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/mail/mail.service.ts`
- **.createBountyFunding()** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/payments/stitch-payments.service.ts`
- **WithdrawalService** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/wallet/withdrawal.service.ts`
- **AuthService** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- **.recordRecurrence()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/kb/kb.service.ts`
- **.del()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.getToken()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/stitch/stitch.client.ts`
- **.postApproval()** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts`
- *... and 253 more nodes in this community*

## Relationships

- [[Webhook handlers & triggers]] (58 shared connections)
- [[Bounty access & mutation]] (44 shared connections)
- [[User & brand profile services]] (26 shared connections)
- [[Subscription & auth lifecycle]] (25 shared connections)
- [[Reconciliation engine]] (18 shared connections)
- [[Wallet service]] (16 shared connections)
- [[Auth & settings admin]] (15 shared connections)
- [[Apify scraping integration]] (14 shared connections)
- [[REST API controllers]] (14 shared connections)
- [[Ledger & payment services]] (13 shared connections)
- [[Next.js page routes]] (12 shared connections)
- [[Finance admin dashboard]] (12 shared connections)

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
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/kyb.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/kyb.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/business/business.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/dispute-scheduler.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts`

## Audit Trail

- EXTRACTED: 665 (39%)
- INFERRED: 1049 (61%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*