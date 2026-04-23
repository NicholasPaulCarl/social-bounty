# Auth & webhook verification

> 109 nodes · cohesion 0.03

## Key Concepts

- **.set()** (23 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **RedisService** (15 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.stringify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- **.scrapeAndVerify()** (14 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scraper.service.ts`
- **apify.mappers.ts** (13 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **SettingsService** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **ApifyService** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- **.refreshForBrand()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- **.del()** (11 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **TradeSafeClient** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.setNxEx()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- **.getToken()** (9 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **.verifyEmailChange()** (8 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- **emptyCounters()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **numberOrNull()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **.refreshStaleBrands()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify-social.scheduler.ts`
- **refund-after-approval.spec.ts** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refund-after-approval.spec.ts`
- **.authedRequest()** (7 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- **mapFacebookPostItem()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **mapInstagramPostItem()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **mapTiktokPostItem()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- **buildService()** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refund-after-approval.spec.ts`
- **.scrapeFacebook()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- **.scrapeInstagram()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- **.scrapeTiktok()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- *... and 84 more nodes in this community*

## Relationships

- [[Admin operations & overrides]] (334 shared connections)
- [[Brand funding & form state]] (40 shared connections)
- [[NewConversationDialog.tsx]] (25 shared connections)
- [[submission-scraper.service.spec.ts]] (19 shared connections)
- [[SectionPanel.tsx]] (7 shared connections)
- [[Admin page routes]] (6 shared connections)
- [[Bounty access & users]] (3 shared connections)
- [[Reconciliation engine]] (2 shared connections)
- [[DisputesController]] (1 shared connections)
- [[Inbox & notifications]] (1 shared connections)
- [[Admin withdrawals UI]] (1 shared connections)
- [[HealthController]] (1 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/common/guards/user-status.guard.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify-social.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.mappers.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/apify/apify.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/business/business.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/exports.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refund-after-approval.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/refunds/refund-approval-flow.spec.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/compute-verification-checks.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scrape-recovery.scheduler.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scraper.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/tradesafe/tradesafe.client.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/e2e/helpers.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/app/admin/finance/groups/[transactionGroupId]/page.tsx`

## Audit Trail

- EXTRACTED: 301 (67%)
- INFERRED: 146 (33%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*