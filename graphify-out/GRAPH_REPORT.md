# Graph Report - /Users/nicholasschreiber/social-bounty  (2026-04-23)

## Corpus Check
- 714 files · ~582,971 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2450 nodes · 4870 edges · 60 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1949 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin operations & overrides|Admin operations & overrides]]
- [[_COMMUNITY_Admin page routes|Admin page routes]]
- [[_COMMUNITY_Agent team roster|Agent team roster]]
- [[_COMMUNITY_Auth & webhook verification|Auth & webhook verification]]
- [[_COMMUNITY_Bounties & Stitch payments|Bounties & Stitch payments]]
- [[_COMMUNITY_Finance admin & KB|Finance admin & KB]]
- [[_COMMUNITY_Apify post scraping|Apify post scraping]]
- [[_COMMUNITY_Bounty access & users|Bounty access & users]]
- [[_COMMUNITY_App layouts & shells|App layouts & shells]]
- [[_COMMUNITY_Wallet & withdrawals|Wallet & withdrawals]]
- [[_COMMUNITY_ADRs & audit log|ADRs & audit log]]
- [[_COMMUNITY_Brand funding & form state|Brand funding & form state]]
- [[_COMMUNITY_Bounty form & disputes|Bounty form & disputes]]
- [[_COMMUNITY_Reconciliation engine|Reconciliation engine]]
- [[_COMMUNITY_TradeSafe client & payouts|TradeSafe client & payouts]]
- [[_COMMUNITY_ADR headline docs|ADR headline docs]]
- [[_COMMUNITY_Bounty UI components|Bounty UI components]]
- [[_COMMUNITY_Admin withdrawals UI|Admin withdrawals UI]]
- [[_COMMUNITY_AdminService class|AdminService class]]
- [[_COMMUNITY_Admin brand & user tabs|Admin brand & user tabs]]
- [[_COMMUNITY_Design system components|Design system components]]
- [[_COMMUNITY_BrandsService class|BrandsService class]]
- [[_COMMUNITY_Inbox & notifications|Inbox & notifications]]
- [[_COMMUNITY_Wallet controller & projection|Wallet controller & projection]]
- [[_COMMUNITY_apify.mappers.ts|apify.mappers.ts]]
- [[_COMMUNITY_Health, Redis, URL verification|Health, Redis, URL verification]]
- [[_COMMUNITY_kb-context.ts|kb-context.ts]]
- [[_COMMUNITY_useManageFilters.ts|useManageFilters.ts]]
- [[_COMMUNITY_Signup (OTP + optional brand)|Signup (OTP + optional brand)]]
- [[_COMMUNITY_tradesafe.client.ts|tradesafe.client.ts]]
- [[_COMMUNITY_makeContext()|makeContext()]]
- [[_COMMUNITY_.callback()|.callback()]]
- [[_COMMUNITY_feeCents()|feeCents()]]
- [[_COMMUNITY_client.ts|client.ts]]
- [[_COMMUNITY_submissions.validators.ts|submissions.validators.ts]]
- [[_COMMUNITY_bounties.validators.ts|bounties.validators.ts]]
- [[_COMMUNITY_middleware.ts|middleware.ts]]
- [[_COMMUNITY_auth.validators.ts|auth.validators.ts]]
- [[_COMMUNITY_disputes.validators.ts|disputes.validators.ts]]
- [[_COMMUNITY_KybController|KybController]]
- [[_COMMUNITY_compute-verification-checks.ts|compute-verification-checks.ts]]
- [[_COMMUNITY_Social Bounty Wordmark|Social Bounty Wordmark]]
- [[_COMMUNITY_seedOtpInRedis()|seedOtpInRedis()]]
- [[_COMMUNITY_pickInRange()|pickInRange()]]
- [[_COMMUNITY_SanitizePipe|SanitizePipe]]
- [[_COMMUNITY_kb.module.ts|kb.module.ts]]
- [[_COMMUNITY_reconciliation.fault-injection.spec.ts|reconciliation.fault-injection.spec.ts]]
- [[_COMMUNITY_TradeSafeApiError|TradeSafeApiError]]
- [[_COMMUNITY_app.module.ts|app.module.ts]]
- [[_COMMUNITY_settings.module.ts|settings.module.ts]]
- [[_COMMUNITY_inbox.module.ts|inbox.module.ts]]
- [[_COMMUNITY_health.module.ts|health.module.ts]]
- [[_COMMUNITY_audit.module.ts|audit.module.ts]]
- [[_COMMUNITY_wallet.module.ts|wallet.module.ts]]
- [[_COMMUNITY_submissions.module.ts|submissions.module.ts]]
- [[_COMMUNITY_webhooks.module.ts|webhooks.module.ts]]
- [[_COMMUNITY_apify.module.ts|apify.module.ts]]
- [[_COMMUNITY_Double-entry ledger (CLAUDE.md §4.1)|Double-entry ledger (CLAUDE.md §4.1)]]
- [[_COMMUNITY_UNIQUE(referenceId, actionType) idempote|UNIQUE(referenceId, actionType) idempote]]
- [[_COMMUNITY_QA Known Issues and Checks|QA Known Issues and Checks]]

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
- `ReconciliationService` --semantically_similar_to--> `ClearanceService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/clearance.service.ts
- `ReconciliationService` --semantically_similar_to--> `ApprovalLedgerService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/ledger/approval-ledger.service.ts
- `ReconciliationService` --semantically_similar_to--> `UpgradeService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/subscriptions/upgrade.service.ts
- `ReconciliationService` --semantically_similar_to--> `FinanceAdminService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/finance-admin/finance-admin.service.ts
- `ReconciliationService` --semantically_similar_to--> `ExpiredBountyService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/reconciliation/reconciliation.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/bounties/expired-bounty.service.ts

## Communities

### Community 0 - "Admin operations & overrides"
Cohesion: 0.01
Nodes (48): handleClickOutside(), AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto, ApifySocialScheduler (+40 more)

### Community 1 - "Admin page routes"
Cohesion: 0.02
Nodes (46): ApprovalLedgerService, AuditService, AuthService, BeneficiaryService, ClearanceScheduler, ClearanceService, DisputeSchedulerService, DisputesService (+38 more)

### Community 2 - "Agent team roster"
Cohesion: 0.02
Nodes (82): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+74 more)

### Community 3 - "Auth & webhook verification"
Cohesion: 0.02
Nodes (150): Finance Overview admin page, /admin/finance/overrides, /admin/finance/refunds, Brand Reserves page, Subscriptions admin page, Visibility Failures admin page, Payments Health page, System Health / Troubleshooting page (+142 more)

### Community 4 - "Bounties & Stitch payments"
Cohesion: 0.02
Nodes (17): AdminController, BountiesController, BountyAccessController, BrandsController, DisputesController, FilesController, resolveAndValidatePath(), FilesModule (+9 more)

### Community 5 - "Finance admin & KB"
Cohesion: 0.05
Nodes (122): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+114 more)

### Community 6 - "Apify post scraping"
Cohesion: 0.03
Nodes (23): csvFilename(), saveBlob(), FinanceExportsController, FinanceExportsService, DevSeedPayableDto, FinanceAdminController, KillSwitchDto, OverrideDto (+15 more)

### Community 7 - "Bounty access & users"
Cohesion: 0.05
Nodes (14): makeConfig(), makePrisma(), makeRedis(), makeConfig(), BountiesModule, BountyAccessModule, BusinessService, HttpExceptionFilter (+6 more)

### Community 8 - "App layouts & shells"
Cohesion: 0.04
Nodes (14): AdminModule, AuthModule, ConversationsService, DisputesModule, doc:md-files/brand-profile-and-signup.md, JwtAuthGuard, JwtStrategy, buildFeaturesDto() (+6 more)

### Community 9 - "Wallet & withdrawals"
Cohesion: 0.04
Nodes (14): FinanceAdminModule, FinanceModule, LedgerModule, KillSwitchActiveError, LedgerImbalanceError, PaymentsModule, PayoutProviderFactory, PayoutsModule (+6 more)

### Community 10 - "ADRs & audit log"
Cohesion: 0.08
Nodes (72): concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1, concept:Phase2 (+64 more)

### Community 11 - "Brand funding & form state"
Cohesion: 0.04
Nodes (11): BrandsService, handleSwitch(), PayoutsController, UpsertBeneficiaryDto, ApproveRefundDto, RefundsController, RequestRefundAfterPayoutDto, RequestRefundDto (+3 more)

### Community 12 - "Bounty form & disputes"
Cohesion: 0.06
Nodes (11): handleSelectHunter(), BrandFundingHandler, handleSelect(), toggleChannel(), toggleFormat(), PaymentsHealthController, PayoutsService, StitchPaymentsService (+3 more)

### Community 13 - "Reconciliation engine"
Cohesion: 0.05
Nodes (9): AdminService, AuthController, clearRefreshCookie(), setRefreshCookie(), HealthController, handleSignup(), handleVerifyOtp(), SettingsService (+1 more)

### Community 14 - "TradeSafe client & payouts"
Cohesion: 0.06
Nodes (6): approxDelta(), WalletController, WalletProjectionService, FakeDecimal, WalletService, FakeDecimal

### Community 15 - "ADR headline docs"
Cohesion: 0.13
Nodes (4): runCi(), BountiesService, BountyAccessService, main()

### Community 16 - "Bounty UI components"
Cohesion: 0.06
Nodes (7): BusinessController, KbController, ReconciliationController, ReconciliationScheduler, RolesGuard, AddSocialHandleDto, FinanceAdminSubscriptionsController

### Community 17 - "Admin withdrawals UI"
Cohesion: 0.06
Nodes (15): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), rewardBody(), formatDisputeReason(), formatBytes() (+7 more)

### Community 18 - "AdminService class"
Cohesion: 0.12
Nodes (18): applyMigrations(), bigintReplacer(), buildBenchDbConfig(), createBenchDb(), detectPgVersion(), dropBenchDb(), formatTable(), main() (+10 more)

### Community 19 - "Admin brand & user tabs"
Cohesion: 0.11
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 20 - "Design system components"
Cohesion: 0.09
Nodes (11): derivePreviewChecks(), hasAnyPreviewChecks(), pairKey(), buildCreateBountyRequest(), makeFilledState(), makeState(), channelFormatErrors(), getSectionErrors() (+3 more)

### Community 21 - "BrandsService class"
Cohesion: 0.15
Nodes (19): buildBountyRow(), buildLedgerStub(), buildPrismaStub(), buildService(), buildStitchStub(), buildSubmissionRow(), buildBountyRow(), buildLedgerStub() (+11 more)

### Community 22 - "Inbox & notifications"
Cohesion: 0.13
Nodes (7): InstagramIcon(), TwitterIcon(), FadeUp(), InstagramIcon(), Reveal(), TwitterIcon(), useInView()

### Community 23 - "Wallet controller & projection"
Cohesion: 0.11
Nodes (2): InboxController, NotificationsService

### Community 24 - "apify.mappers.ts"
Cohesion: 0.26
Nodes (13): emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem(), mapTiktokItem() (+5 more)

### Community 25 - "Health, Redis, URL verification"
Cohesion: 0.15
Nodes (20): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+12 more)

### Community 26 - "kb-context.ts"
Cohesion: 0.2
Nodes (15): buildKbEntry(), compact(), deriveGuidance(), describeQuery(), extractMetaSystem(), parseArgs(), parseKbFile(), printUsage() (+7 more)

### Community 27 - "useManageFilters.ts"
Cohesion: 0.22
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 28 - "Signup (OTP + optional brand)"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 29 - "tradesafe.client.ts"
Cohesion: 0.15
Nodes (7): BusinessModule, RedisModule, buildClient(), respond(), StitchModule, buildClient(), respond()

### Community 30 - "makeContext()"
Cohesion: 0.28
Nodes (7): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 31 - ".callback()"
Cohesion: 0.19
Nodes (5): firstHeader(), isValidStateParam(), sanitizeForLog(), sanitizeQuery(), TradeSafeCallbackController

### Community 32 - "feeCents()"
Cohesion: 0.29
Nodes (3): FeeCalculatorService, feeCents(), halfEven()

### Community 33 - "client.ts"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 34 - "submissions.validators.ts"
Cohesion: 0.2
Nodes (6): EnvironmentVariables, CreateSubmissionDto, ProofLinkInputDto, ReviewSubmissionDto, UpdatePayoutDto, UpdateSubmissionDto

### Community 35 - "bounties.validators.ts"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 36 - "middleware.ts"
Cohesion: 0.28
Nodes (5): getDashboardUrl(), decodeTokenPayload(), getDashboardUrl(), evaluateRoute(), getDashboardUrl()

### Community 37 - "auth.validators.ts"
Cohesion: 0.22
Nodes (8): LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, VerifyEmailChangeDto, VerifyOtpDto

### Community 38 - "disputes.validators.ts"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 39 - "KybController"
Cohesion: 0.29
Nodes (3): KybController, RejectKybDto, SubmitKybDto

### Community 41 - "compute-verification-checks.ts"
Cohesion: 0.5
Nodes (2): computeVerificationChecks(), normalize()

### Community 43 - "Social Bounty Wordmark"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 44 - "seedOtpInRedis()"
Cohesion: 0.67
Nodes (2): loginAs(), seedOtpInRedis()

### Community 45 - "pickInRange()"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 46 - "SanitizePipe"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 47 - "kb.module.ts"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 53 - "reconciliation.fault-injection.spec.ts"
Cohesion: 1.0
Nodes (2): buildService(), makeQueryRawRouter()

### Community 54 - "TradeSafeApiError"
Cohesion: 0.67
Nodes (1): TradeSafeApiError

### Community 78 - "app.module.ts"
Cohesion: 1.0
Nodes (1): AppModule

### Community 81 - "settings.module.ts"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 82 - "inbox.module.ts"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 83 - "health.module.ts"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 85 - "audit.module.ts"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 86 - "wallet.module.ts"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 87 - "submissions.module.ts"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 89 - "webhooks.module.ts"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 90 - "apify.module.ts"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 139 - "Double-entry ledger (CLAUDE.md §4.1)"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 140 - "UNIQUE(referenceId, actionType) idempote"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 141 - "QA Known Issues and Checks"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **175 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Wallet controller & projection`** (21 nodes): `inbox.controller.ts`, `InboxController`, `.constructor()`, `.createConversation()`, `.deleteMessage()`, `.editMessage()`, `.getConversation()`, `.getUnreadCount()`, `.listConversations()`, `.listNotifications()`, `.markAllNotificationsAsRead()`, `.markConversationRead()`, `.markNotificationAsRead()`, `NotificationsService`, `.constructor()`, `.formatResponse()`, `.getUnreadCount()`, `.getUnreadMessageCount()`, `.listNotifications()`, `.markAllAsRead()`, `.markAsRead()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `compute-verification-checks.ts`** (5 nodes): `compute-verification-checks.ts`, `compute-verification-checks.spec.ts`, `computeVerificationChecks()`, `normalize()`, `noRules()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `seedOtpInRedis()`** (4 nodes): `helpers.ts`, `loginAs()`, `logout()`, `seedOtpInRedis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SanitizePipe`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `kb.module.ts`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `reconciliation.fault-injection.spec.ts`** (3 nodes): `reconciliation.fault-injection.spec.ts`, `buildService()`, `makeQueryRawRouter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TradeSafeApiError`** (3 nodes): `tradesafe.types.ts`, `TradeSafeApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `app.module.ts`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `settings.module.ts`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `inbox.module.ts`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `health.module.ts`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `audit.module.ts`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `wallet.module.ts`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `submissions.module.ts`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `webhooks.module.ts`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `apify.module.ts`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Double-entry ledger (CLAUDE.md §4.1)`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UNIQUE(referenceId, actionType) idempote`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `QA Known Issues and Checks`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR 0009 — TradeSafe Integration Skeleton` connect `Auth & webhook verification` to `Admin page routes`, `ADRs & audit log`, `Bounty form & disputes`, `.callback()`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `ADR 0006 — Compensating Entries Bypass the Financial Kill Switch` connect `Auth & webhook verification` to `Wallet & withdrawals`, `ADRs & audit log`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ADR 0010 — Auto-Refund on PostVisibility Failure` connect `Auth & webhook verification` to `Admin operations & overrides`, `Wallet & withdrawals`, `Finance admin & KB`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `BrandFundingHandler`) actually correct?**
  _`FinanceAdminService` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._