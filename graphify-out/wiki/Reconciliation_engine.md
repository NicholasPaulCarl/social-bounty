# Reconciliation engine

> 53 nodes · cohesion 0.05

## Key Concepts

- **AdminService** (22 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- **SettingsService** (12 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **AuthController** (10 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.controller.ts`
- **auth.controller.ts** (6 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.controller.ts`
- **.isSignupEnabled()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- **.updateSettings()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- **.signup()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.controller.ts`
- **setRefreshCookie()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.controller.ts`
- **.getSetting()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.seedDefaults()** (5 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **brands.controller.ts** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.controller.ts`
- **.verifyOtp()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.controller.ts`
- **HealthController** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/health/health.controller.ts`
- **.getBoolean()** (4 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.getSettings()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- **.isSubmissionEnabled()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- **health.controller.ts** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/health/health.controller.ts`
- **.getAllSettings()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.getSettings()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.isSignupEnabled()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.isSubmissionEnabled()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.setSetting()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.updateSettings()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- **.create()** (3 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- **.createBrand()** (2 connections) — `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- *... and 28 more nodes in this community*

## Relationships

- [[Bounty access & users]] (50 shared connections)
- [[ADRs & audit log]] (42 shared connections)
- [[Admin withdrawals UI]] (40 shared connections)
- [[Social Bounty Wordmark]] (18 shared connections)
- [[Admin page routes]] (13 shared connections)
- [[ADR headline docs]] (3 shared connections)
- [[Admin operations & overrides]] (2 shared connections)

## Source Files

- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/admin/admin.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/auth/auth.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/health/health.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/redis/redis.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/settings/settings.service.ts`
- `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.controller.ts`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/app/(auth)/login/page.tsx`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/app/(auth)/signup/page.tsx`
- `/Users/nicholasschreiber/social-bounty/apps/web/src/components/common/VerifiedLinkInput.tsx`

## Audit Trail

- EXTRACTED: 126 (75%)
- INFERRED: 42 (25%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*