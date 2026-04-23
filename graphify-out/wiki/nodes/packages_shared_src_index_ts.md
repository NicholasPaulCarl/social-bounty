# index.ts (`packages/shared`)

> The single import surface for every cross-package type, enum, DTO, and constant in the monorepo.

## What it does

`packages/shared/src/index.ts` is the barrel re-export that turns `@social-bounty/shared` into the one dependency the web, api, and script packages all share for their wire-level contract. It re-exports every domain enum (`UserRole`, `BountyStatus`, `PayoutStatus`, `SubmissionStatus`, `DisputeCategory`, `BountyAccessType`, `PostFormat`, `SubscriptionTier`, `WebhookProvider` and ~30 more), every DTO interface (request/response pairs for bounties, submissions, disputes, wallets, admin, finance, subscriptions), and every constant bundle (`PAGINATION_DEFAULTS`, `OTP_RULES`, `JWT_CONFIG`, `AUDIT_ACTIONS`, `CHANNEL_POST_FORMATS`, `CHANNEL_URL_PATTERNS`, `FIELD_LIMITS`, `BOUNTY_REWARD_LIMITS`, `DISPUTE_LIMITS`, `BRAND_PROFILE_LIMITS`). Every NestJS controller imports from it to type request bodies and responses; every TanStack Query hook imports from it for the identical request/response types on the browser side.

## Why it exists

A typed contract that sits above both sides eliminates the class of bug where the API changes a field name and the frontend silently breaks at runtime. It is the enforcement point for Hard Rule #4 (100% test pass rate) because any breaking change ripples through both apps' TypeScript compile and all 1651 tests. Enums like `BountyAccessType`, `BountyStatus`, and `SubscriptionTier` encode the state machines from `md-files/social-bounty-mvp.md` at the type level, and the `AUDIT_ACTIONS` constant is the literal source of every action string logged to the AuditLog (Hard Rule #3). This file's degree of 237 — by far the highest in the graph — reflects that status as the monorepo's contract spine.

## How it connects

- **`useAdmin.ts`, `useFinanceAdmin.ts`, `useBrand.ts`, `useWallet.ts`, `useDisputes.ts`, `useBounties.ts`, `useAuth.ts`** (TanStack Query hooks) — every hook imports request/response DTO types from here, ensuring browser-side cache shapes match API wire shapes.
- **`ledger.service.ts`** — imports `UserRole` to type the `AuthenticatedUser.role` inside ledger audit writes; the ledger's `LedgerAccount` / `LedgerEntryType` come from Prisma directly but the surrounding DTOs flow through here.
- **`SubmissionsService`, `BountiesService`, `DisputesService`** — every API service imports enums (`BountyAccessType`, `SubmissionStatus`, `DisputeCategory`) and constants (`AUDIT_ACTIONS`, `VERIFICATION_DEADLINE_HOURS`, `DISPUTE_LIMITS`) for business-rule gating.
- **`business/bounties/[id]/page.tsx`** — the bounty detail page imports `BountyAccessType` to render the PUBLIC/CLOSED padlock badge wired in commit `da71b0a` (2026-04-17).
- **Page specs** — the page-specs documentation set (`md-files/page-spec/`) cites this barrel as the canonical list of shared enums that drive RBAC gating.

Because re-exports are tree-shaken by both webpack (web) and NestJS's build, the 237-degree fan-out carries ~zero runtime cost; it's purely a compile-time hub.

---
**degree:** 237 • **community:** "Next.js page routes" (ID 0) • **source:** `packages/shared/src/index.ts`
**last touched:** 4 days ago • **commits (90d):** 25 • **commits (total):** 25

> **Architectural note:** this is the single largest god-node in the graph (degree 237, 2.1× the runner-up). Any breaking change here is effectively a whole-monorepo deployment event. The 25 commits in the last 90 days reflect heavy churn — most of it the Organisation→Brand rename sweep (2026-04-17) and the Phase-1 / Phase-2 / Phase-3 hunter-submission-verification DTO additions.
