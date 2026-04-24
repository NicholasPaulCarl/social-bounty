# Graph Report - social-bounty  (2026-04-24)

## Corpus Check
- 543 files · ~599,509 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2498 nodes · 4728 edges · 64 communities detected
- Extraction: 58% EXTRACTED · 42% INFERRED · 0% AMBIGUOUS · INFERRED: 1998 edges (avg confidence: 0.85)
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
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 196|Community 196]]
- [[_COMMUNITY_Community 197|Community 197]]
- [[_COMMUNITY_Community 198|Community 198]]

## God Nodes (most connected - your core abstractions)
1. `Social Bounty MVP` - 28 edges
2. `FinanceAdminService` - 26 edges
3. `BountiesService` - 25 edges
4. `DisputesService` - 22 edges
5. `AdminService` - 22 edges
6. `UpgradeService` - 21 edges
7. `Page Specs Index` - 21 edges
8. `Design System README` - 21 edges
9. `SubscriptionsService` - 20 edges
10. `SubmissionsService` - 20 edges

## Surprising Connections (you probably didn't know these)
- `runCi()` --calls--> `main()`  [INFERRED]
  scripts/bench-reconciliation.ci.ts → packages/prisma/seed-production.ts
- `ReconciliationService` --semantically_similar_to--> `FinanceAdminService`  [INFERRED] [semantically similar]
  apps/api/src/modules/reconciliation/reconciliation.service.ts → apps/api/src/modules/finance-admin/finance-admin.service.ts
- `ReconciliationService` --semantically_similar_to--> `ExpiredBountyService`  [INFERRED] [semantically similar]
  apps/api/src/modules/reconciliation/reconciliation.service.ts → apps/api/src/modules/bounties/expired-bounty.service.ts
- `BrandFundingHandler` --semantically_similar_to--> `FinanceAdminService`  [INFERRED] [semantically similar]
  apps/api/src/modules/payments/brand-funding.handler.ts → apps/api/src/modules/finance-admin/finance-admin.service.ts
- `ApprovalLedgerService` --semantically_similar_to--> `FinanceAdminService`  [INFERRED] [semantically similar]
  apps/api/src/modules/ledger/approval-ledger.service.ts → apps/api/src/modules/finance-admin/finance-admin.service.ts

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
Nodes (47): ApifySocialScheduler, AuditService, AuthService, runCi(), BeneficiaryService, BountiesService, BountyAccessService, ClearanceScheduler (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (82): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+74 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (143): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+135 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (130): Visibility Failures admin page, ADR 0001 — Stripe Retirement Timing, ADR 0003 — TradeSafe Escrow Layer Out of Scope, ADR 0004 — Feature Flag Inventory for Stitch Rollout, ADR 0005 — Ledger Idempotency via Header Table, ADR 0006 — Compensating Entries Bypass the Financial Kill Switch, ADR 0007 — Peach Payments for Hunter Payouts, ADR 0008 — TradeSafe for Hunter Payouts (+122 more)

### Community 4 - "Community 4"
Cohesion: 0.02
Nodes (15): BountiesController, BrandsController, BrandsService, handleSwitch(), DisputesController, FilesController, resolveAndValidatePath(), FilesModule (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.02
Nodes (24): AdminModule, makeConfig(), makePrisma(), makeRedis(), AuthModule, makeConfig(), DisputesModule, doc:md-files/brand-profile-and-signup.md (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (28): handleClickOutside(), handleSelectHunter(), InstagramIcon(), TwitterIcon(), handleClickOutside(), handleClose(), resetForm(), emptyLeg() (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.02
Nodes (14): AdminController, BountyAccessController, BusinessController, KbController, CreateBountyFundingDto, PaymentsController, ReconciliationController, ReconciliationScheduler (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (31): applyMigrations(), bigintReplacer(), buildBenchDbConfig(), createBenchDb(), dropBenchDb(), formatTable(), main(), mulberry32() (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (15): ApprovalLedgerService, detectPgVersion(), runBench(), BrandFundingHandler, handleSelect(), toggleChannel(), toggleFormat(), ClearanceService (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.03
Nodes (18): FinanceExportsController, FinanceExportsService, DevSeedPayableDto, FinanceAdminController, KillSwitchDto, OverrideDto, OverrideLegDto, FinanceAdminService (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (34): AdminService, emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem() (+26 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (11): BountiesModule, BountyAccessModule, FinanceAdminModule, FinanceModule, LedgerModule, KillSwitchActiveError, LedgerImbalanceError, ReconciliationModule (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (72): concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1, concept:Phase2 (+64 more)

### Community 14 - "Community 14"
Cohesion: 0.04
Nodes (9): ConversationsService, InboxController, NotificationsService, buildFeaturesDto(), getClearanceDays(), getCommissionRate(), SubscriptionLifecycleScheduler, SubscriptionsController (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (3): disputeNumberTemplate(), handleSelectSubmission(), suggestCategory()

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (7): csvFilename(), saveBlob(), dateTemplate(), handleDownload(), handleDownloadLedger(), HistoryDialog(), useAdminVisibilityHistory()

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (15): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), rewardBody(), formatDisputeReason(), formatBytes() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (4): approxDelta(), FakeDecimal, WalletService, FakeDecimal

### Community 20 - "Community 20"
Cohesion: 0.1
Nodes (7): AuthController, clearRefreshCookie(), setRefreshCookie(), HealthController, handleSignup(), handleVerifyOtp(), handleBlur()

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (11): getDashboardUrl(), decodeTokenPayload(), getDashboardUrl(), middleware(), evaluateRoute(), getDashboardUrl(), firstHeader(), isValidStateParam() (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (19): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (15): buildKbEntry(), compact(), deriveGuidance(), describeQuery(), extractMetaSystem(), parseArgs(), parseKbFile(), printUsage() (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (6): PayoutsController, UpsertBeneficiaryDto, ApproveRefundDto, RefundsController, RequestRefundAfterPayoutDto, RequestRefundDto

### Community 27 - "Community 27"
Cohesion: 0.28
Nodes (7): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 28 - "Community 28"
Cohesion: 0.24
Nodes (5): channelFormatErrors(), getSectionErrors(), hasChannelSelection(), isSectionComplete(), validateFull()

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (3): FeeCalculatorService, feeCents(), halfEven()

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 31 - "Community 31"
Cohesion: 0.2
Nodes (6): EnvironmentVariables, CreateSubmissionDto, ProofLinkInputDto, ReviewSubmissionDto, UpdatePayoutDto, UpdateSubmissionDto

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (8): LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, VerifyEmailChangeDto, VerifyOtpDto

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (3): buildCreateBountyRequest(), makeFilledState(), makeState()

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (3): KybController, RejectKybDto, SubmitKybDto

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto

### Community 38 - "Community 38"
Cohesion: 0.47
Nodes (3): derivePreviewChecks(), hasAnyPreviewChecks(), pairKey()

### Community 40 - "Community 40"
Cohesion: 0.4
Nodes (4): ApplyToBountyDto, CreateInvitationsDto, InvitationItemDto, ReviewApplicationDto

### Community 41 - "Community 41"
Cohesion: 0.4
Nodes (3): CreateBrandDto, InviteMemberDto, UpdateBrandDto

### Community 42 - "Community 42"
Cohesion: 0.4
Nodes (4): AdminAdjustWalletDto, AdminCompleteWithdrawalDto, AdminFailWithdrawalDto, RequestWithdrawalDto

### Community 43 - "Community 43"
Cohesion: 0.5
Nodes (2): mockTokenAndResponse(), respond()

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (2): computeVerificationChecks(), normalize()

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 48 - "Community 48"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 50 - "Community 50"
Cohesion: 0.5
Nodes (3): CreateConversationDto, EditMessageDto, SendMessageDto

### Community 51 - "Community 51"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (2): buildService(), makeQueryRawRouter()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (2): UpdateProfileDto, UpsertSocialLinkDto

### Community 62 - "Community 62"
Cohesion: 0.67
Nodes (1): TradeSafeApiError

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (1): AppModule

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 97 - "Community 97"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 98 - "Community 98"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 100 - "Community 100"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 101 - "Community 101"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 102 - "Community 102"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 104 - "Community 104"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 105 - "Community 105"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 196 - "Community 196"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 197 - "Community 197"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 198 - "Community 198"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **175 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 43`** (5 nodes): `tradesafe-graphql.client.spec.ts`, `buildClient()`, `buildConfig()`, `mockTokenAndResponse()`, `respond()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (5 nodes): `compute-verification-checks.ts`, `compute-verification-checks.spec.ts`, `computeVerificationChecks()`, `normalize()`, `noRules()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (3 nodes): `reconciliation.fault-injection.spec.ts`, `buildService()`, `makeQueryRawRouter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (3 nodes): `users.validators.ts`, `UpdateProfileDto`, `UpsertSocialLinkDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (3 nodes): `tradesafe.types.ts`, `TradeSafeApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 196`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 197`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 198`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handleSubmit()` connect `Community 6` to `Community 0`, `Community 17`, `Community 4`, `Community 15`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Browse Bounties page` connect `Community 2` to `Community 1`, `Community 4`, `Community 6`, `Community 15`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `Brand Directory page` connect `Community 2` to `Community 1`, `Community 6`, `Community 25`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `BrandFundingHandler`) actually correct?**
  _`FinanceAdminService` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._