# Graph Report - /Users/nicholasschreiber/social-bounty  (2026-04-23)

## Corpus Check
- 714 files · ~582,971 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2450 nodes · 4870 edges · 60 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1949 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Next.js page routes|Next.js page routes]]
- [[_COMMUNITY_API service layer|API service layer]]
- [[_COMMUNITY_React query hooks|React query hooks]]
- [[_COMMUNITY_Project charter & ADRs|Project charter & ADRs]]
- [[_COMMUNITY_REST API controllers|REST API controllers]]
- [[_COMMUNITY_Page spec documentation|Page spec documentation]]
- [[_COMMUNITY_Finance admin dashboard|Finance admin dashboard]]
- [[_COMMUNITY_Bounty service & tests|Bounty service & tests]]
- [[_COMMUNITY_Subscription & auth lifecycle|Subscription & auth lifecycle]]
- [[_COMMUNITY_Ledger & payment services|Ledger & payment services]]
- [[_COMMUNITY_Roadmap & risk concepts|Roadmap & risk concepts]]
- [[_COMMUNITY_User & brand profile services|User & brand profile services]]
- [[_COMMUNITY_Webhook handlers & triggers|Webhook handlers & triggers]]
- [[_COMMUNITY_Auth & settings admin|Auth & settings admin]]
- [[_COMMUNITY_Wallet service|Wallet service]]
- [[_COMMUNITY_Bounty access & mutation|Bounty access & mutation]]
- [[_COMMUNITY_Controllers & RBAC guards|Controllers & RBAC guards]]
- [[_COMMUNITY_Frontend formatters & badges|Frontend formatters & badges]]
- [[_COMMUNITY_Reconciliation engine|Reconciliation engine]]
- [[_COMMUNITY_Design system handoff|Design system handoff]]
- [[_COMMUNITY_Bounty creation form|Bounty creation form]]
- [[_COMMUNITY_Refund flow test fixtures|Refund flow test fixtures]]
- [[_COMMUNITY_Marketing site pages|Marketing site pages]]
- [[_COMMUNITY_Inbox & notifications|Inbox & notifications]]
- [[_COMMUNITY_Apify scraping integration|Apify scraping integration]]
- [[_COMMUNITY_Wallet page specs|Wallet page specs]]
- [[_COMMUNITY_KB context CLI|KB context CLI]]
- [[_COMMUNITY_Bounty browse & manage filters|Bounty browse & manage filters]]
- [[_COMMUNITY_Marketing page specs|Marketing page specs]]
- [[_COMMUNITY_External API clients|External API clients]]
- [[_COMMUNITY_RBAC controller spec harness|RBAC controller spec harness]]
- [[_COMMUNITY_TradeSafe OAuth callback|TradeSafe OAuth callback]]
- [[_COMMUNITY_Fee calculator & rounding|Fee calculator & rounding]]
- [[_COMMUNITY_Web API fetch client|Web API fetch client]]
- [[_COMMUNITY_Submission & env validators|Submission & env validators]]
- [[_COMMUNITY_Bounty DTO validators|Bounty DTO validators]]
- [[_COMMUNITY_Web auth middleware|Web auth middleware]]
- [[_COMMUNITY_Auth DTO validators|Auth DTO validators]]
- [[_COMMUNITY_Dispute DTO validators|Dispute DTO validators]]
- [[_COMMUNITY_KYB brand verification|KYB brand verification]]
- [[_COMMUNITY_Verification check computation|Verification check computation]]
- [[_COMMUNITY_Wordmark asset|Wordmark asset]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]

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

### Community 0 - "Next.js page routes"
Cohesion: 0.01
Nodes (48): handleClickOutside(), AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto, ApifySocialScheduler (+40 more)

### Community 1 - "API service layer"
Cohesion: 0.02
Nodes (46): ApprovalLedgerService, AuditService, AuthService, BeneficiaryService, ClearanceScheduler, ClearanceService, DisputeSchedulerService, DisputesService (+38 more)

### Community 2 - "React query hooks"
Cohesion: 0.02
Nodes (82): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+74 more)

### Community 3 - "Project charter & ADRs"
Cohesion: 0.02
Nodes (150): Finance Overview admin page, /admin/finance/overrides, /admin/finance/refunds, Brand Reserves page, Subscriptions admin page, Visibility Failures admin page, Payments Health page, System Health / Troubleshooting page (+142 more)

### Community 4 - "REST API controllers"
Cohesion: 0.02
Nodes (17): AdminController, BountiesController, BountyAccessController, BrandsController, DisputesController, FilesController, resolveAndValidatePath(), FilesModule (+9 more)

### Community 5 - "Page spec documentation"
Cohesion: 0.05
Nodes (122): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+114 more)

### Community 6 - "Finance admin dashboard"
Cohesion: 0.03
Nodes (23): csvFilename(), saveBlob(), FinanceExportsController, FinanceExportsService, DevSeedPayableDto, FinanceAdminController, KillSwitchDto, OverrideDto (+15 more)

### Community 7 - "Bounty service & tests"
Cohesion: 0.05
Nodes (14): makeConfig(), makePrisma(), makeRedis(), makeConfig(), BountiesModule, BountyAccessModule, BusinessService, HttpExceptionFilter (+6 more)

### Community 8 - "Subscription & auth lifecycle"
Cohesion: 0.04
Nodes (14): AdminModule, AuthModule, ConversationsService, DisputesModule, doc:md-files/brand-profile-and-signup.md, JwtAuthGuard, JwtStrategy, buildFeaturesDto() (+6 more)

### Community 9 - "Ledger & payment services"
Cohesion: 0.04
Nodes (14): FinanceAdminModule, FinanceModule, LedgerModule, KillSwitchActiveError, LedgerImbalanceError, PaymentsModule, PayoutProviderFactory, PayoutsModule (+6 more)

### Community 10 - "Roadmap & risk concepts"
Cohesion: 0.08
Nodes (72): concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1, concept:Phase2 (+64 more)

### Community 11 - "User & brand profile services"
Cohesion: 0.04
Nodes (11): BrandsService, handleSwitch(), PayoutsController, UpsertBeneficiaryDto, ApproveRefundDto, RefundsController, RequestRefundAfterPayoutDto, RequestRefundDto (+3 more)

### Community 12 - "Webhook handlers & triggers"
Cohesion: 0.06
Nodes (11): handleSelectHunter(), BrandFundingHandler, handleSelect(), toggleChannel(), toggleFormat(), PaymentsHealthController, PayoutsService, StitchPaymentsService (+3 more)

### Community 13 - "Auth & settings admin"
Cohesion: 0.05
Nodes (9): AdminService, AuthController, clearRefreshCookie(), setRefreshCookie(), HealthController, handleSignup(), handleVerifyOtp(), SettingsService (+1 more)

### Community 14 - "Wallet service"
Cohesion: 0.06
Nodes (6): approxDelta(), WalletController, WalletProjectionService, FakeDecimal, WalletService, FakeDecimal

### Community 15 - "Bounty access & mutation"
Cohesion: 0.13
Nodes (4): runCi(), BountiesService, BountyAccessService, main()

### Community 16 - "Controllers & RBAC guards"
Cohesion: 0.06
Nodes (7): BusinessController, KbController, ReconciliationController, ReconciliationScheduler, RolesGuard, AddSocialHandleDto, FinanceAdminSubscriptionsController

### Community 17 - "Frontend formatters & badges"
Cohesion: 0.06
Nodes (15): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), rewardBody(), formatDisputeReason(), formatBytes() (+7 more)

### Community 18 - "Reconciliation engine"
Cohesion: 0.12
Nodes (18): applyMigrations(), bigintReplacer(), buildBenchDbConfig(), createBenchDb(), detectPgVersion(), dropBenchDb(), formatTable(), main() (+10 more)

### Community 19 - "Design system handoff"
Cohesion: 0.11
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 20 - "Bounty creation form"
Cohesion: 0.09
Nodes (11): derivePreviewChecks(), hasAnyPreviewChecks(), pairKey(), buildCreateBountyRequest(), makeFilledState(), makeState(), channelFormatErrors(), getSectionErrors() (+3 more)

### Community 21 - "Refund flow test fixtures"
Cohesion: 0.15
Nodes (19): buildBountyRow(), buildLedgerStub(), buildPrismaStub(), buildService(), buildStitchStub(), buildSubmissionRow(), buildBountyRow(), buildLedgerStub() (+11 more)

### Community 22 - "Marketing site pages"
Cohesion: 0.13
Nodes (7): InstagramIcon(), TwitterIcon(), FadeUp(), InstagramIcon(), Reveal(), TwitterIcon(), useInView()

### Community 23 - "Inbox & notifications"
Cohesion: 0.11
Nodes (2): InboxController, NotificationsService

### Community 24 - "Apify scraping integration"
Cohesion: 0.26
Nodes (13): emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem(), mapTiktokItem() (+5 more)

### Community 25 - "Wallet page specs"
Cohesion: 0.15
Nodes (20): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+12 more)

### Community 26 - "KB context CLI"
Cohesion: 0.2
Nodes (15): buildKbEntry(), compact(), deriveGuidance(), describeQuery(), extractMetaSystem(), parseArgs(), parseKbFile(), printUsage() (+7 more)

### Community 27 - "Bounty browse & manage filters"
Cohesion: 0.22
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 28 - "Marketing page specs"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 29 - "External API clients"
Cohesion: 0.15
Nodes (7): BusinessModule, RedisModule, buildClient(), respond(), StitchModule, buildClient(), respond()

### Community 30 - "RBAC controller spec harness"
Cohesion: 0.28
Nodes (7): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 31 - "TradeSafe OAuth callback"
Cohesion: 0.19
Nodes (5): firstHeader(), isValidStateParam(), sanitizeForLog(), sanitizeQuery(), TradeSafeCallbackController

### Community 32 - "Fee calculator & rounding"
Cohesion: 0.29
Nodes (3): FeeCalculatorService, feeCents(), halfEven()

### Community 33 - "Web API fetch client"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 34 - "Submission & env validators"
Cohesion: 0.2
Nodes (6): EnvironmentVariables, CreateSubmissionDto, ProofLinkInputDto, ReviewSubmissionDto, UpdatePayoutDto, UpdateSubmissionDto

### Community 35 - "Bounty DTO validators"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 36 - "Web auth middleware"
Cohesion: 0.28
Nodes (5): getDashboardUrl(), decodeTokenPayload(), getDashboardUrl(), evaluateRoute(), getDashboardUrl()

### Community 37 - "Auth DTO validators"
Cohesion: 0.22
Nodes (8): LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, VerifyEmailChangeDto, VerifyOtpDto

### Community 38 - "Dispute DTO validators"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 39 - "KYB brand verification"
Cohesion: 0.29
Nodes (3): KybController, RejectKybDto, SubmitKybDto

### Community 41 - "Verification check computation"
Cohesion: 0.5
Nodes (2): computeVerificationChecks(), normalize()

### Community 43 - "Wordmark asset"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (2): loginAs(), seedOtpInRedis()

### Community 45 - "Community 45"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (2): buildService(), makeQueryRawRouter()

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (1): TradeSafeApiError

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): AppModule

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 139 - "Community 139"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 140 - "Community 140"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 141 - "Community 141"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **175 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Inbox & notifications`** (21 nodes): `inbox.controller.ts`, `InboxController`, `.constructor()`, `.createConversation()`, `.deleteMessage()`, `.editMessage()`, `.getConversation()`, `.getUnreadCount()`, `.listConversations()`, `.listNotifications()`, `.markAllNotificationsAsRead()`, `.markConversationRead()`, `.markNotificationAsRead()`, `NotificationsService`, `.constructor()`, `.formatResponse()`, `.getUnreadCount()`, `.getUnreadMessageCount()`, `.listNotifications()`, `.markAllAsRead()`, `.markAsRead()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Verification check computation`** (5 nodes): `compute-verification-checks.ts`, `compute-verification-checks.spec.ts`, `computeVerificationChecks()`, `normalize()`, `noRules()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (4 nodes): `helpers.ts`, `loginAs()`, `logout()`, `seedOtpInRedis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `reconciliation.fault-injection.spec.ts`, `buildService()`, `makeQueryRawRouter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `tradesafe.types.ts`, `TradeSafeApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR 0009 — TradeSafe Integration Skeleton` connect `Project charter & ADRs` to `API service layer`, `Roadmap & risk concepts`, `Webhook handlers & triggers`, `TradeSafe OAuth callback`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `ADR 0006 — Compensating Entries Bypass the Financial Kill Switch` connect `Project charter & ADRs` to `Ledger & payment services`, `Roadmap & risk concepts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ADR 0010 — Auto-Refund on PostVisibility Failure` connect `Project charter & ADRs` to `Next.js page routes`, `Ledger & payment services`, `Page spec documentation`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `BrandFundingHandler`) actually correct?**
  _`FinanceAdminService` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._