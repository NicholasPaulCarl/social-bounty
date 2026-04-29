# Graph Report - social-bounty  (2026-04-30)

## Corpus Check
- 557 files · ~681,132 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2475 nodes · 4395 edges · 72 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1754 edges (avg confidence: 0.85)
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
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 236|Community 236]]
- [[_COMMUNITY_Community 237|Community 237]]
- [[_COMMUNITY_Community 238|Community 238]]

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
Nodes (45): ApifySocialScheduler, ApprovalLedgerService, AuditService, AuthService, runSimulatedProgress(), ClearanceScheduler, ClearanceService, DisputeSchedulerService (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (81): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+73 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (149): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+141 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (31): handleClickOutside(), InstagramIcon(), TwitterIcon(), handleClickOutside(), handleClose(), resetForm(), emptyLeg(), FadeUp() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.02
Nodes (13): AdminController, BountiesController, BountyAccessController, BrandsController, DisputesController, FilesController, resolveAndValidatePath(), FilesModule (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (114): Admin Withdrawals page, ADR 0001 — Stripe Retirement Timing, ADR 0003 — TradeSafe Escrow Layer Out of Scope, ADR 0004 — Feature Flag Inventory for Stitch Rollout, ADR 0007 — Peach Payments for Hunter Payouts, ADR 0008 — TradeSafe for Hunter Payouts, ADR 0009 — TradeSafe Integration Skeleton, Agent Architect (+106 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (83): BeneficiaryService, concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1 (+75 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (16): AdminModule, AuthModule, sha256Nfc(), computeVerificationChecks(), normalize(), DisputesModule, doc:md-files/brand-profile-and-signup.md, JwtAuthGuard (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (19): FinanceExportsController, FinanceExportsService, DevSeedPayableDto, FinanceAdminController, KillSwitchDto, OverrideDto, OverrideLegDto, FinanceAdminService (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (14): runCi(), BountiesService, BountyAccessService, derivePreviewChecks(), hasAnyPreviewChecks(), pairKey(), PlatformChips(), main() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (10): AdminService, makePrisma(), makeRedis(), HttpExceptionFilter, PrismaModule, PrismaService, SettingsService, makeRedis() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (12): BountiesModule, BountyAccessModule, BusinessService, FinanceAdminModule, FinanceModule, LedgerModule, KillSwitchActiveError, LedgerImbalanceError (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (10): BrandsService, handleSwitch(), PayoutsController, ApproveRefundDto, RefundsController, RequestRefundAfterPayoutDto, RequestRefundDto, SocialHandlesModule (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (9): disputeNumberTemplate(), handleDuplicate(), handleSelectSubmission(), handleStatusConfirm(), suggestCategory(), CreateBountyFundingDto, PaymentsController, redirectToHostedCheckout() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (8): BusinessController, KbController, ReconciliationController, RolesGuard, AddSocialHandleDto, useSystemInsights(), WalletController, WalletProjectionService

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (5): csvFilename(), saveBlob(), dateTemplate(), handleDownload(), handleDownloadLedger()

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (17): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), formatDisputeReason(), formatBytes(), formatCents() (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (3): ConversationsService, InboxController, NotificationsService

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (11): AuthController, clearRefreshCookie(), clearRefreshCookiePaths(), refreshCookieOptions(), setRefreshCookie(), clearFilters(), onChange(), HealthController (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (18): applyMigrations(), bigintReplacer(), buildBenchDbConfig(), createBenchDb(), detectPgVersion(), dropBenchDb(), formatTable(), main() (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (3): FakeDecimal, WalletService, FakeDecimal

### Community 22 - "Community 22"
Cohesion: 0.1
Nodes (5): handleSelectHunter(), toggleChannel(), toggleFormat(), TradeSafeWebhookHandler, WebhookRouterService

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (11): getDashboardUrl(), decodeTokenPayload(), getDashboardUrl(), middleware(), evaluateRoute(), getDashboardUrl(), firstHeader(), isValidStateParam() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (6): buildContentDisposition(), KybController, RejectKybDto, SubmitKybDto, UploadKybDocumentDto, KybDocumentsService

### Community 25 - "Community 25"
Cohesion: 0.26
Nodes (13): emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem(), mapTiktokItem() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (19): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+11 more)

### Community 27 - "Community 27"
Cohesion: 0.2
Nodes (15): buildKbEntry(), compact(), deriveGuidance(), describeQuery(), extractMetaSystem(), parseArgs(), parseKbFile(), printUsage() (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (11): Badge(), Button(), Card(), cx(), FilterChip(), KPI(), Modal(), Skeleton() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.28
Nodes (6): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (3): FeeCalculatorService, feeCents(), halfEven()

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (7): buildCreateBountyRequest(), computePerClaimRewardValue(), computeTotalRewardValue(), formReducer(), initBountyFormState(), makeFilledState(), makeState()

### Community 34 - "Community 34"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 35 - "Community 35"
Cohesion: 0.2
Nodes (9): LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, SwitchOtpChannelDto, VerifyEmailChangeDto (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 37 - "Community 37"
Cohesion: 0.2
Nodes (6): EnvironmentVariables, CreateSubmissionDto, ProofLinkInputDto, ReviewSubmissionDto, UpdatePayoutDto, UpdateSubmissionDto

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (2): baseBountyRewardRecord(), createMockPrisma()

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (2): BusinessModule, RedisModule

### Community 43 - "Community 43"
Cohesion: 0.5
Nodes (3): buildItemLabels(), getStatusActionLabels(), getManageMenuPolicy()

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (4): ApplyToBountyDto, CreateInvitationsDto, InvitationItemDto, ReviewApplicationDto

### Community 45 - "Community 45"
Cohesion: 0.4
Nodes (3): CreateBrandDto, InviteMemberDto, UpdateBrandDto

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (4): AdminAdjustWalletDto, AdminCompleteWithdrawalDto, AdminFailWithdrawalDto, RequestWithdrawalDto

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (2): mockTokenAndResponse(), respond()

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (2): loginAs(), seedOtpInRedis()

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (1): runSimulatedProgress()

### Community 55 - "Community 55"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 57 - "Community 57"
Cohesion: 0.5
Nodes (3): CreateConversationDto, EditMessageDto, SendMessageDto

### Community 58 - "Community 58"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 60 - "Community 60"
Cohesion: 0.83
Nodes (3): makeController(), makeTransaction(), setupForState()

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (1): ' '()

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (2): UpdateProfileDto, UpsertSocialLinkDto

### Community 111 - "Community 111"
Cohesion: 1.0
Nodes (1): AppModule

### Community 115 - "Community 115"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 116 - "Community 116"
Cohesion: 1.0
Nodes (1): PaymentsModule

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 118 - "Community 118"
Cohesion: 1.0
Nodes (1): SmsModule

### Community 121 - "Community 121"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): PayoutsModule

### Community 236 - "Community 236"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 237 - "Community 237"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 238 - "Community 238"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **176 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 39`** (8 nodes): `test-fixtures.ts`, `baseBountyRecord()`, `baseBountyRewardRecord()`, `baseBrandAssetRecord()`, `createMockAuditService()`, `createMockMailService()`, `createMockPrisma()`, `validCreateBountyData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (6 nodes): `business.module.ts`, `redis.module.ts`, `redis.service.spec.ts`, `redis.service.ts`, `BusinessModule`, `RedisModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (5 nodes): `tradesafe-graphql.client.spec.ts`, `buildClient()`, `buildConfig()`, `mockTokenAndResponse()`, `respond()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (4 nodes): `helpers.ts`, `loginAs()`, `logout()`, `seedOtpInRedis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (4 nodes): `BrandAssetsSection.tsx`, `formatBytes()`, `nextSlotId()`, `runSimulatedProgress()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (3 nodes): `page.tsx`, `page.tsx`, `' '()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (3 nodes): `users.validators.ts`, `UpdateProfileDto`, `UpsertSocialLinkDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (2 nodes): `payments.module.ts`, `PaymentsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `sms.module.ts`, `SmsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (2 nodes): `payouts.module.ts`, `PayoutsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 236`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 237`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 238`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Browse Bounties page` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 13`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `handleSubmit()` connect `Community 3` to `Community 0`, `Community 4`, `Community 9`, `Community 13`, `Community 16`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `FinanceAdminService` connect `Community 8` to `Community 0`, `Community 9`, `Community 11`, `Community 19`, `Community 22`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `ApprovalLedgerService`) actually correct?**
  _`FinanceAdminService` has 5 INFERRED edges - model-reasoned connections that need verification._