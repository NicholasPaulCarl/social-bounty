# `SubscriptionsService`

> Tier resolution and lifecycle state-machine for Free/Pro subscriptions, plus the auto-downgrade + grace-period logic.

## What it does

`SubscriptionsService` is the read-path (and partial write-path) service for subscription state. `.getActiveTier(userId)` and `.getActiveOrgTier(orgId)` return the currently-in-force `SubscriptionTier` (FREE or PRO) for a user or brand, consulting the `Subscription` table ordered by `endDate DESC LIMIT 1` with status filter. `.isFeatureEnabled(entityId, feature)` checks the `FEATURE_MATRIX` constant map (e.g. `SubscriptionFeature.CLOSED_BOUNTIES`, `SubscriptionFeature.CUSTOM_BRAND_ASSETS`) against the active tier. `.cancelAtPeriodEnd(subscriptionId)` flips the `cancelAtPeriodEnd` flag; the scheduled cron reads this at period boundaries and either renews or downgrades. `.listSubscriptions()` is the admin-surface read. The auto-downgrade state machine (Free after failed renewal with grace period) runs on a scheduler that calls `.handleRenewal(subscriptionId)` and conditionally transitions to `EXPIRED` or `ACTIVE` depending on card-consent state from Stitch.

## Why it exists

Plan-snapshot discipline (Financial Non-Negotiable #9) requires every ledger-touching write to capture the tier in force at write time. This service is the canonical read for "what tier is in force right now?" and every `BountiesService.create`, `SubmissionsService.approve`, etc. consults it to compute the plan-specific fee structure and feature access. The `FEATURE_MATRIX` indirection means adding a new Pro-only feature is a one-file change. The service is optional-injected into `LedgerService` via `@Optional() @Inject(forwardRef(() => SubscriptionsService))` to avoid a circular dep at module-init time — a pattern matched elsewhere in the codebase.

## How it connects

- **`UpgradeService`** — the write-path sibling that creates PENDING subscriptions and transitions them to ACTIVE via webhooks.
- **`LedgerService`** — consumes `getActiveTier` to compute plan-dependent fee splits.
- **`BountiesService.create`** — checks `isFeatureEnabled(CLOSED_BOUNTIES)` before letting a Free brand create a CLOSED bounty.
- **`AuditService.log`** — every subscription state change audits (Hard Rule #3).
- **`StitchClient.createSubscription`** — via `UpgradeService`, produces the hosted card-consent redirect.
- **`PRICING`, `FEATURE_MATRIX`, `buildFeaturesDto` (subscription.constants)** — the feature-matrix lookup; imported from the colocated constants file.
- **`SUBSCRIPTION_CONSTANTS` (shared)** — tier names, billing periods, currency.
- **`SubscriptionEntityType.USER` / `.ORG`** — the two-entity subscription model; separate rows for user subscriptions vs brand/org subscriptions.

---
**degree:** 20 • **community:** "Subscription & auth lifecycle" (ID 8) • **source:** `apps/api/src/modules/subscriptions/subscriptions.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `@Optional()` + `forwardRef(() => LedgerService)` pattern in the constructor is the DI structure that avoids the circular dep between subscriptions and ledger. If you add a third module that both imports `SubscriptionsService` and is imported by it, expect a similar forwardRef — the cleaner fix is extracting a `SubscriptionsReader` interface.
