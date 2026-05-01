# Graph Report - social-bounty  (2026-05-01)

## Corpus Check
- 571 files · ~690,378 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2513 nodes · 4420 edges · 72 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1755 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 248|Community 248]]
- [[_COMMUNITY_Community 249|Community 249]]
- [[_COMMUNITY_Community 250|Community 250]]

## God Nodes (most connected - your core abstractions)
1. `Social Bounty MVP` - 28 edges
2. `BountiesService` - 26 edges
3. `FinanceAdminService` - 24 edges
4. `DisputesService` - 22 edges
5. `AdminService` - 22 edges
6. `Page Specs Index` - 21 edges
7. `Design System README` - 21 edges
8. `MailService` - 20 edges
9. `SubscriptionsService` - 20 edges
10. `SubmissionsService` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Test Automation Strategy` ----> `Financial Non-Negotiables (claude.md §4)`  [EXTRACTED]
  docs/qa/automation-strategy.md → claude.md
- `runCi()` --calls--> `main()`  [INFERRED]
  scripts/bench-reconciliation.ci.ts → packages/prisma/seed-production.ts
- `ReconciliationService` --semantically_similar_to--> `ClearanceService`  [INFERRED] [semantically similar]
  apps/api/src/modules/reconciliation/reconciliation.service.ts → apps/api/src/modules/ledger/clearance.service.ts
- `ReconciliationService` --semantically_similar_to--> `ApprovalLedgerService`  [INFERRED] [semantically similar]
  apps/api/src/modules/reconciliation/reconciliation.service.ts → apps/api/src/modules/ledger/approval-ledger.service.ts
- `ReconciliationService` --semantically_similar_to--> `FinanceAdminService`  [INFERRED] [semantically similar]
  apps/api/src/modules/reconciliation/reconciliation.service.ts → apps/api/src/modules/finance-admin/finance-admin.service.ts

## Hyperedges (group relationships)
- **Bounty funding flow** — apps_web_src_app_business_bounties_new_page_tsx, apps_api_src_modules_bounties_bounties_controller_ts, apps_api_src_modules_payments_payments_controller_ts, apps_api_src_modules_payments_stitch_payments_service_ts, apps_api_src_modules_stitch_stitch_client_ts, apps_api_src_modules_payments_brand_funding_handler_ts, apps_api_src_modules_ledger_ledger_service_ts, adr_0005_ledger_idempotency_header [EXTRACTED 0.90]
- **Hunter submission lifecycle** — apps_web_src_app_participant_bounties_id_submit_page_tsx, apps_api_src_modules_submissions_submissions_controller_ts, apps_api_src_modules_submissions_submission_coverage_validator_ts, apps_api_src_modules_submissions_submission_scraper_service_ts, apps_api_src_modules_submissions_compute_verification_checks_ts, apps_api_src_modules_submissions_submissions_service_ts, apps_web_src_app_business_review_center_id_page_tsx [EXTRACTED 0.90]
- **Kill-switch override bypass** — apps_api_src_modules_finance_admin_finance_admin_service_ts, adr_0006_compensating_entries_bypass_kill_switch, apps_api_src_modules_ledger_ledger_service_ts, admin_finance_overrides [EXTRACTED 0.90]
- **Subscription upgrade flow** — apps_web_src_app_business_brands_subscription_page_tsx, apps_api_src_modules_subscriptions_subscriptions_controller_ts, apps_api_src_modules_subscriptions_upgrade_service_ts, apps_api_src_modules_stitch_stitch_client_ts, apps_api_src_modules_webhooks_webhook_router_upgrade_spec_ts [EXTRACTED 0.90]
- **Brand onboarding flow** — apps_web_src_app_shared_create_brand_page_tsx, apps_api_src_modules_brands_brands_controller_ts, apps_api_src_modules_brands_brands_service_ts, apps_api_src_modules_brands_kyb_controller_ts, apps_api_src_modules_brands_kyb_service_ts [EXTRACTED 0.90]
- **Auto-refund on visibility failure** — adr_0010_auto_refund_visibility_failure, apps_api_src_modules_submissions_submission_visibility_scheduler_ts, apps_api_src_modules_refunds_refunds_service_ts, apps_api_src_modules_ledger_ledger_service_ts, admin_finance_visibility_failures [EXTRACTED 0.90]
- **TradeSafe outbound payout rail** — adr_0008_tradesafe_payouts, adr_0009_tradesafe_integration_skeleton, apps_api_src_modules_tradesafe_tradesafe_client_ts, apps_api_src_modules_payouts_tradesafe_payout_adapter_ts, apps_api_src_modules_tradesafe_tradesafe_callback_controller_ts, apps_api_src_modules_webhooks_tradesafe_webhook_controller_ts, apps_api_src_modules_tradesafe_tradesafe_webhook_handler_ts, apps_api_src_modules_payouts_payout_provider_factory_ts [EXTRACTED 0.90]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (43): ApifySocialScheduler, ApprovalLedgerService, AuditService, AuthService, runCi(), BountiesService, BountyAccessService, ClearanceScheduler (+35 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (82): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+74 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (154): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+146 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (23): BrandsController, BrandsService, handleSwitch(), buildContentDisposition(), FilesController, resolveAndValidatePath(), FilesModule, KybController (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (28): handleClickOutside(), InstagramIcon(), TwitterIcon(), handleClickOutside(), handleClose(), resetForm(), emptyLeg(), FadeUp() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (109): ADR 0001 — Stripe Retirement Timing, ADR 0003 — TradeSafe Escrow Layer Out of Scope, ADR 0004 — Feature Flag Inventory for Stitch Rollout, ADR 0007 — Peach Payments for Hunter Payouts, ADR 0008 — TradeSafe for Hunter Payouts, ADR 0009 — TradeSafe Integration Skeleton, Agent Architect, Agent Back-End (+101 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (20): AdminModule, makePrisma(), makeRedis(), AuthModule, sha256Nfc(), computeVerificationChecks(), normalize(), DisputesModule (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (11): AdminController, AdminService, BountiesController, BountyAccessController, handleStatusConfirm(), CreateBountyFundingDto, PaymentsController, redirectToHostedCheckout() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (19): FinanceExportsController, FinanceExportsService, DevSeedPayableDto, FinanceAdminController, KillSwitchDto, OverrideDto, OverrideLegDto, FinanceAdminService (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (73): BeneficiaryService, concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1 (+65 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (14): BountiesModule, BountyAccessModule, runSimulatedProgress(), runSimulatedProgress(), ExpiredBountyScheduler, FinanceAdminModule, FinanceModule, LedgerModule (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (37): applyMigrations(), bigintReplacer(), buildBenchDbConfig(), createBenchDb(), detectPgVersion(), dropBenchDb(), formatTable(), main() (+29 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (8): BusinessController, KbController, ReconciliationController, RolesGuard, AddSocialHandleDto, FinanceAdminSubscriptionsController, WalletController, WalletProjectionService

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (4): ConversationsService, DisputesController, InboxController, NotificationsService

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (4): disputeNumberTemplate(), handleDuplicate(), handleSelectSubmission(), suggestCategory()

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (9): handleSelectHunter(), toggleChannel(), toggleFormat(), isSecretMatch(), TradeSafeTransactionCallbackController, TradeSafeTransactionCallbackHandler, TradeSafeWebhookHandler, WebhookEventService (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (17): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), formatDisputeReason(), formatBytes(), formatCents() (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (12): AuthController, clearRefreshCookie(), clearRefreshCookiePaths(), refreshCookieOptions(), setRefreshCookie(), clearFilters(), onChange(), HealthController (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (4): csvFilename(), saveBlob(), handleDownload(), handleDownloadLedger()

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (17): derivePreviewChecks(), hasAnyPreviewChecks(), pairKey(), PlatformChips(), buildCreateBountyRequest(), computePerClaimRewardValue(), computeTotalRewardValue(), formReducer() (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (3): FakeDecimal, WalletService, FakeDecimal

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (11): getDashboardUrl(), decodeTokenPayload(), getDashboardUrl(), middleware(), evaluateRoute(), getDashboardUrl(), firstHeader(), isValidStateParam() (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (13): emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem(), mapTiktokItem() (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (19): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (11): Badge(), Button(), Card(), cx(), FilterChip(), KPI(), Modal(), Skeleton() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (1): PayoutSchedulerService

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (10): ExactlyOneIdentifierConstraint, LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, SwitchOtpChannelDto (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.28
Nodes (6): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (3): FeeCalculatorService, feeCents(), halfEven()

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 33 - "Community 33"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 34 - "Community 34"
Cohesion: 0.2
Nodes (6): EnvironmentVariables, CreateSubmissionDto, ProofLinkInputDto, ReviewSubmissionDto, UpdatePayoutDto, UpdateSubmissionDto

### Community 35 - "Community 35"
Cohesion: 0.36
Nodes (10): REST API Contracts, Database Schema, Frontend Strategy, Security and RBAC Design, Sitemap, MVP Backlog, Agency & Influencer Management Feature Spec, Test Automation Strategy (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (2): baseBountyRewardRecord(), createMockPrisma()

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (2): BusinessModule, RedisModule

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (1): useStableId()

### Community 42 - "Community 42"
Cohesion: 0.5
Nodes (3): buildItemLabels(), getStatusActionLabels(), getManageMenuPolicy()

### Community 43 - "Community 43"
Cohesion: 0.4
Nodes (4): ApplyToBountyDto, CreateInvitationsDto, InvitationItemDto, ReviewApplicationDto

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (3): CreateBrandDto, InviteMemberDto, UpdateBrandDto

### Community 45 - "Community 45"
Cohesion: 0.4
Nodes (4): AdminAdjustWalletDto, AdminCompleteWithdrawalDto, AdminFailWithdrawalDto, RequestWithdrawalDto

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (2): mockTokenAndResponse(), respond()

### Community 50 - "Community 50"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 54 - "Community 54"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (3): CreateConversationDto, EditMessageDto, SendMessageDto

### Community 57 - "Community 57"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 58 - "Community 58"
Cohesion: 0.83
Nodes (3): buildFeaturesDto(), getClearanceDays(), getCommissionRate()

### Community 60 - "Community 60"
Cohesion: 0.83
Nodes (3): makeController(), makeTransaction(), setupForState()

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (1): ' '()

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (2): UpdateProfileDto, UpsertSocialLinkDto

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (1): TradeSafeApiError

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (2): isColorDark(), Swatch()

### Community 112 - "Community 112"
Cohesion: 1.0
Nodes (1): AppModule

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 118 - "Community 118"
Cohesion: 1.0
Nodes (1): PaymentsModule

### Community 119 - "Community 119"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 120 - "Community 120"
Cohesion: 1.0
Nodes (1): SmsModule

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 125 - "Community 125"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): PayoutsModule

### Community 248 - "Community 248"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 249 - "Community 249"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 250 - "Community 250"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **176 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 28`** (16 nodes): `dispute-scheduler.service.ts`, `payouts.scheduler.ts`, `payout-scheduler.service.ts`, `submission-visibility.scheduler.ts`, `submission-visibility.scheduler.spec.ts`, `subscription-lifecycle.scheduler.spec.ts`, `subscription-lifecycle.scheduler.ts`, `PayoutSchedulerService`, `.constructor()`, `.processExpiredDeadlines()`, `.constructor()`, `durationToDays()`, `intervalMs()`, `buildHarness()`, `buildSubmission()`, `buildHarness()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (8 nodes): `test-fixtures.ts`, `baseBountyRecord()`, `baseBountyRewardRecord()`, `baseBrandAssetRecord()`, `createMockAuditService()`, `createMockMailService()`, `createMockPrisma()`, `validCreateBountyData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (6 nodes): `business.module.ts`, `redis.module.ts`, `redis.service.spec.ts`, `redis.service.ts`, `BusinessModule`, `RedisModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (6 nodes): `components.generated.tsx`, `Badge()`, `Button()`, `cx()`, `getFocusableElements()`, `useStableId()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (5 nodes): `tradesafe-graphql.client.spec.ts`, `buildClient()`, `buildConfig()`, `mockTokenAndResponse()`, `respond()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (3 nodes): `page.tsx`, `page.tsx`, `' '()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (3 nodes): `users.validators.ts`, `UpdateProfileDto`, `UpsertSocialLinkDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (3 nodes): `tradesafe-graphql.client.ts`, `TradeSafeApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (3 nodes): `ColorsSection.tsx`, `isColorDark()`, `Swatch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `payments.module.ts`, `PaymentsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (2 nodes): `sms.module.ts`, `SmsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (2 nodes): `payouts.module.ts`, `PayoutsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 248`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 249`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 250`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Browse Bounties page` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 14`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `handleSubmit()` connect `Community 4` to `Community 0`, `Community 3`, `Community 14`, `Community 16`, `Community 19`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `ADR 0010 — Auto-Refund on PostVisibility Failure` connect `Community 2` to `Community 10`, `Community 28`, `Community 5`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `ApprovalLedgerService`) actually correct?**
  _`FinanceAdminService` has 5 INFERRED edges - model-reasoned connections that need verification._