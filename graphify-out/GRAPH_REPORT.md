# Graph Report - social-bounty  (2026-04-25)

## Corpus Check
- 537 files · ~639,868 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2393 nodes · 4321 edges · 60 communities detected
- Extraction: 59% EXTRACTED · 41% INFERRED · 0% AMBIGUOUS · INFERRED: 1760 edges (avg confidence: 0.85)
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
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 205|Community 205]]
- [[_COMMUNITY_Community 206|Community 206]]
- [[_COMMUNITY_Community 207|Community 207]]

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
- `runCi()` --calls--> `main()`  [INFERRED]
  scripts/bench-reconciliation.ci.ts → packages/prisma/seed-production.ts
- `SocialHandlesService` --semantically_similar_to--> `BrandsService`  [INFERRED] [semantically similar]
  apps/api/src/modules/social-handles/social-handles.service.ts → apps/api/src/modules/brands/brands.service.ts
- `SocialHandlesService` --semantically_similar_to--> `SubmissionsService`  [INFERRED] [semantically similar]
  apps/api/src/modules/social-handles/social-handles.service.ts → apps/api/src/modules/submissions/submissions.service.ts
- `SocialHandlesService` --semantically_similar_to--> `DisputesService`  [INFERRED] [semantically similar]
  apps/api/src/modules/social-handles/social-handles.service.ts → apps/api/src/modules/disputes/disputes.service.ts
- `SocialHandlesService` --semantically_similar_to--> `DisputeSchedulerService`  [INFERRED] [semantically similar]
  apps/api/src/modules/social-handles/social-handles.service.ts → apps/api/src/modules/disputes/dispute-scheduler.service.ts

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
Nodes (31): AuditService, bigintReplacer(), runCi(), BountiesService, BountyAccessService, derivePreviewChecks(), hasAnyPreviewChecks(), pairKey() (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (47): emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem(), mapTiktokItem() (+39 more)

### Community 2 - "Community 2"
Cohesion: 0.02
Nodes (80): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+72 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (35): ApprovalLedgerService, runBench(), ClearanceScheduler, ClearanceService, ExpiredBountyScheduler, ExpiredBountyService, FinanceExportsController, FinanceExportsService (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (146): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+138 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (129): ADR 0001 — Stripe Retirement Timing, ADR 0003 — TradeSafe Escrow Layer Out of Scope, ADR 0004 — Feature Flag Inventory for Stitch Rollout, ADR 0005 — Ledger Idempotency via Header Table, ADR 0006 — Compensating Entries Bypass the Financial Kill Switch, ADR 0007 — Peach Payments for Hunter Payouts, ADR 0008 — TradeSafe for Hunter Payouts, ADR 0009 — TradeSafe Integration Skeleton (+121 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (29): handleClickOutside(), InstagramIcon(), TwitterIcon(), handleClickOutside(), handleClose(), resetForm(), emptyLeg(), FadeUp() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (19): makeConfig(), makePrisma(), makeRedis(), BountiesModule, BountyAccessModule, FinanceAdminModule, FinanceModule, HttpExceptionFilter (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (12): BeneficiaryService, BountiesController, ConversationsService, DisputesController, InboxController, KbService, KybController, RejectKybDto (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.03
Nodes (6): AdminController, AdminService, BountyAccessController, SettingsService, SubmissionsController, useHunters()

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (72): concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1, concept:Phase2 (+64 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (13): PaymentsModule, PayoutProviderFactory, PayoutSchedulerService, PayoutsController, PayoutsModule, PayoutsScheduler, PayoutsService, ApproveRefundDto (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (10): AuthController, clearRefreshCookie(), setRefreshCookie(), BrandsController, HealthController, handleVerifyOtp(), uploadStagedFiles(), SocialHandlesController (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (13): AdminModule, AuthModule, sha256Nfc(), computeVerificationChecks(), normalize(), DisputesModule, doc:md-files/brand-profile-and-signup.md, JwtAuthGuard (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (21): handleSwitch(), FilesController, resolveAndValidatePath(), FilesModule, buildKbEntry(), compact(), deriveGuidance(), describeQuery() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (7): disputeNumberTemplate(), handleSelectSubmission(), handleStatusConfirm(), suggestCategory(), CreateBountyFundingDto, PaymentsController, redirectToHostedCheckout()

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (7): BusinessController, KbController, RolesGuard, AddSocialHandleDto, useSystemInsights(), WalletController, WalletProjectionService

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (4): FakeDecimal, WalletService, FakeDecimal, WithdrawalService

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (5): csvFilename(), saveBlob(), dateTemplate(), handleDownload(), handleDownloadLedger()

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (15): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), rewardBody(), formatDisputeReason(), formatBytes() (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (8): handleSelectHunter(), handleSelect(), toggleChannel(), toggleFormat(), isSecretMatch(), TradeSafeTransactionCallbackController, WebhookEventService, WebhookRouterService

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (11): getDashboardUrl(), decodeTokenPayload(), getDashboardUrl(), middleware(), evaluateRoute(), getDashboardUrl(), firstHeader(), isValidStateParam() (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (19): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.28
Nodes (6): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 27 - "Community 27"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 28 - "Community 28"
Cohesion: 0.2
Nodes (9): LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, SwitchOtpChannelDto, VerifyEmailChangeDto (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 30 - "Community 30"
Cohesion: 0.2
Nodes (6): EnvironmentVariables, CreateSubmissionDto, ProofLinkInputDto, ReviewSubmissionDto, UpdatePayoutDto, UpdateSubmissionDto

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (2): baseBountyRewardRecord(), createMockPrisma()

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (3): buildCreateBountyRequest(), makeFilledState(), makeState()

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto

### Community 36 - "Community 36"
Cohesion: 0.4
Nodes (4): ApplyToBountyDto, CreateInvitationsDto, InvitationItemDto, ReviewApplicationDto

### Community 37 - "Community 37"
Cohesion: 0.4
Nodes (3): CreateBrandDto, InviteMemberDto, UpdateBrandDto

### Community 38 - "Community 38"
Cohesion: 0.4
Nodes (4): AdminAdjustWalletDto, AdminCompleteWithdrawalDto, AdminFailWithdrawalDto, RequestWithdrawalDto

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (2): mockTokenAndResponse(), respond()

### Community 40 - "Community 40"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 42 - "Community 42"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 44 - "Community 44"
Cohesion: 0.5
Nodes (3): CreateConversationDto, EditMessageDto, SendMessageDto

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): ' '()

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (2): UpdateProfileDto, UpsertSocialLinkDto

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): TradeSafeApiError

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): AppModule

### Community 95 - "Community 95"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 97 - "Community 97"
Cohesion: 1.0
Nodes (1): SmsModule

### Community 98 - "Community 98"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 100 - "Community 100"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 101 - "Community 101"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 104 - "Community 104"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 105 - "Community 105"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 106 - "Community 106"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 205 - "Community 205"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 206 - "Community 206"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 207 - "Community 207"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **175 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 32`** (8 nodes): `test-fixtures.ts`, `baseBountyRecord()`, `baseBountyRewardRecord()`, `baseBrandAssetRecord()`, `createMockAuditService()`, `createMockMailService()`, `createMockPrisma()`, `validCreateBountyData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `tradesafe-graphql.client.spec.ts`, `buildClient()`, `buildConfig()`, `mockTokenAndResponse()`, `respond()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `page.tsx`, `page.tsx`, `' '()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `users.validators.ts`, `UpdateProfileDto`, `UpsertSocialLinkDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (3 nodes): `tradesafe.types.ts`, `TradeSafeApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (2 nodes): `sms.module.ts`, `SmsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 205`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 206`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 207`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handleSubmit()` connect `Community 6` to `Community 0`, `Community 12`, `Community 15`, `Community 17`, `Community 19`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Browse Bounties page` connect `Community 4` to `Community 2`, `Community 12`, `Community 6`, `Community 15`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `ADR 0010 — Auto-Refund on PostVisibility Failure` connect `Community 5` to `Community 11`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `ApprovalLedgerService`) actually correct?**
  _`FinanceAdminService` has 5 INFERRED edges - model-reasoned connections that need verification._