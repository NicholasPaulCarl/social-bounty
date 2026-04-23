# `SocialHandlesService`

> Manages hunter social-handle registration, validation, and the `UserSocialHandle` cache used by the submission verifier.

## What it does

`SocialHandlesService` validates and stores per-user social handles for X, Instagram, Facebook, TikTok. `.addHandle(userId, platform, handle)` normalizes the handle (lowercase, strips leading `@`), validates against platform-specific regex (`HANDLE_PATTERNS` — `X: ^[a-zA-Z0-9_]{1,15}$`, `INSTAGRAM: ^[a-zA-Z0-9_.]{1,30}$`, `FACEBOOK: ^[a-zA-Z0-9.]{5,50}$`, `TIKTOK: ^[a-zA-Z0-9_.]{1,24}$`), checks for per-user-per-platform uniqueness via the `userId_platform` compound-unique, builds the canonical profile URL via `SOCIAL_HANDLE_CONSTANTS.PROFILE_URL_TEMPLATES`, and inserts the `UserSocialHandle` row. `.removeHandle(userId, platform)`, `.listHandles(userId)`, `.refreshFromLogin(userId)` (refreshes cached follower/post-count data at hunter-login time via Apify scraper). The service also manages the handle-verification state (`SocialHandleStatus.PENDING / VERIFIED / FAILED`).

## Why it exists

Phase 1 of the bounty-submission verification work (commit `88dffcf`) locked three product decisions: (1) per-format URL coverage, (2) eligibility verified from cached `UserSocialHandle` (no extra Apify cost per submission), (3) hard approval gate. This service is the single source for decision (2) — the hunter's social-handle data is refreshed at login and read back by `SubmissionScraperService.scrapeAndVerify` during every submission. Normalizing handles and validating format here means the downstream verifier doesn't have to handle junk input. The URL-building helper ensures profile links rendered in brand reviews are always canonical.

## How it connects

- **`UserSocialHandle`** (Prisma entity) — the DB rows this service manages.
- **`PrismaService`** — injected.
- **`AuditService.log()`** — every add/remove emits an audit row (Hard Rule #3).
- **`SOCIAL_HANDLE_CONSTANTS`, `PROFILE_LIMITS`, `SocialPlatform`, `SocialHandleStatus` (shared)** — the shape contract.
- **`SubmissionScraperService`** — the consumer; reads cached handles during submission verification to check eligibility rules (e.g. `minFollowers`, `publicProfile`).
- **`AuthService`** — calls `.refreshFromLogin(userId)` at login time, via the fire-and-forget `setImmediate` pattern (matches `auth.service.ts:155-165`).
- **`ApifyService`** — the profile-scraper backend; `.refreshFromLogin` triggers a scrape per configured handle.
- **`UserRole.PARTICIPANT`** — only participants register social handles.

---
**degree:** 16 • **community:** "User & brand profile services" (ID 11) • **source:** `apps/api/src/modules/social-handles/social-handles.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the handle-refresh-at-login pattern is load-bearing for the cost model. Doing a per-submission fetch of hunter eligibility would multiply Apify costs by submission volume; caching at login trades staleness (hunter changes handle → until next login, stale cache) for cost predictability. The trade-off is conscious.
