# BountiesService

> God node · 25 connections · `/Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/bounties.service.ts`

**Community:** [[Bounty access & mutation]]

## Summary

`BountiesService` owns the full bounty lifecycle: DRAFT → LIVE → PAUSED → CLOSED. Its `.create()` + `.update()` + `.updateStatus()` methods enforce the state machine (`LIVE_EDITABLE_FIELDS` is the short whitelist of fields still mutable once a bounty is live — eligibilityRules, proofRequirements, maxSubmissions, endDate). It also runs a suite of validators — `.validateChannels()`, `.validateRewards()`, `.validatePostVisibility()`, `.validateStructuredEligibility()`, `.validateEngagementRequirements()`, `.validatePayoutMetrics()` — plus reward mapping (`.mapRewards()`), total-value computation (`.computeTotalRewardValue()`), structured-eligibility text generation, brand-asset upload/delete/download, duplication, and hard-delete.

It exists because bounty creation is the most rule-dense write path in the product: tier-snapshot (Free/Pro via `SubscriptionsService`), channel-format coverage (so the auto-verify panel knows what to scrape), reward-type sanity (CASH vs goods-in-kind), KYB gating, and POST_VISIBILITY acknowledgment all converge here. Controllers and `BountyAccessService` (access/mutation perms, applications, invitations) wrap it; `SubmissionsService` reads it; `AdminService.overrideBounty()` bypasses it; and `FinanceAdminService` reports on funded bounties through it. Its `AuditService` dependency writes to the append-only audit log on every status transition (Hard Rule #3).

## Connections by Relation

### contains
- [[bounties.service.ts]] `EXTRACTED`

### method
- [[.update()]] `EXTRACTED`
- [[.findById()]] `EXTRACTED`
- [[.create()]] `EXTRACTED`
- [[.deleteBrandAsset()]] `EXTRACTED`
- [[.updateStatus()]] `EXTRACTED`
- [[.delete()]] `EXTRACTED`
- [[.constructor()]] `EXTRACTED`
- [[.computeTotalRewardValue()]] `EXTRACTED`
- [[.acknowledgeVisibility()]] `EXTRACTED`
- [[.list()]] `EXTRACTED`
- [[.getBrandAssetForDownload()]] `EXTRACTED`
- [[.validateChannels()]] `EXTRACTED`
- [[.validateRewards()]] `EXTRACTED`
- [[.mapRewards()]] `EXTRACTED`
- [[.duplicate()]] `EXTRACTED`
- [[.uploadBrandAssets()]] `EXTRACTED`
- [[.validatePostVisibility()]] `EXTRACTED`
- [[.validateStructuredEligibility()]] `EXTRACTED`
- [[.validateEngagementRequirements()]] `EXTRACTED`
- [[.generateEligibilityText()]] `EXTRACTED`

### semantically_similar_to
- [[SubmissionsService]] `INFERRED`
- [[BountyAccessService]] `INFERRED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*