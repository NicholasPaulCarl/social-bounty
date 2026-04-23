# Graph Report - /Users/nicholasschreiber/social-bounty/.claude/worktrees/agent-a45e3e50  (2026-04-23)

## Corpus Check
- 714 files · ~582,971 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2450 nodes · 4911 edges · 57 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1970 edges (avg confidence: 0.85)
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
- [[_COMMUNITY_Dispute DTO validators|Dispute DTO validators]]
- [[_COMMUNITY_KYB brand verification|KYB brand verification]]
- [[_COMMUNITY_App sidebar navigation|App sidebar navigation]]
- [[_COMMUNITY_Verification check computation|Verification check computation]]
- [[_COMMUNITY_Scrape recovery scheduler|Scrape recovery scheduler]]
- [[_COMMUNITY_Wordmark asset|Wordmark asset]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]

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
- `SocialHandlesService` --semantically_similar_to--> `DisputesService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/social-handles/social-handles.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts
- `BrandsService` --semantically_similar_to--> `DisputesService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/brands/brands.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts
- `DisputeSchedulerService` --semantically_similar_to--> `DisputesService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/dispute-scheduler.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts
- `DisputesService` --semantically_similar_to--> `SubmissionsService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/disputes/disputes.service.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts
- `SubmissionScrapeRecoveryScheduler` --semantically_similar_to--> `SubmissionsService`  [INFERRED] [semantically similar]
  /Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submission-scrape-recovery.scheduler.ts → /Users/nicholasschreiber/social-bounty/apps/api/src/modules/submissions/submissions.service.ts

## Hyperedges (group relationships)
- **Bounty funding flow** — apps_web_src_app_business_bounties_new_page_tsx, apps_api_src_modules_bounties_bounties_controller_ts, apps_api_src_modules_payments_payments_controller_ts, apps_api_src_modules_payments_stitch_payments_service_ts, apps_api_src_modules_stitch_stitch_client_ts, apps_api_src_modules_payments_brand_funding_handler_ts, apps_api_src_modules_ledger_ledger_service_ts, adr_0005_ledger_idempotency_header [EXTRACTED 0.90]
- **Hunter submission lifecycle** — apps_web_src_app_participant_bounties_id_submit_page_tsx, apps_api_src_modules_submissions_submissions_controller_ts, apps_api_src_modules_submissions_submission_coverage_validator_ts, apps_api_src_modules_submissions_submission_scraper_service_ts, apps_api_src_modules_submissions_compute_verification_checks_ts, apps_api_src_modules_submissions_submissions_service_ts, apps_web_src_app_business_review_center_id_page_tsx [EXTRACTED 0.90]
- **Kill-switch override bypass** — apps_api_src_modules_finance_admin_finance_admin_service_ts, adr_0006_compensating_entries_bypass_kill_switch, apps_api_src_modules_ledger_ledger_service_ts, admin_finance_overrides [EXTRACTED 0.90]
- **Subscription upgrade flow** — apps_web_src_app_business_brands_subscription_page_tsx, apps_api_src_modules_subscriptions_subscriptions_controller_ts, apps_api_src_modules_subscriptions_upgrade_service_ts, apps_api_src_modules_stitch_stitch_client_ts, apps_api_src_modules_webhooks_webhook_router_upgrade_spec_ts [EXTRACTED 0.90]
- **Brand onboarding flow** — apps_web_src_app_shared_create_brand_page_tsx, apps_api_src_modules_brands_brands_controller_ts, apps_api_src_modules_brands_brands_service_ts, apps_api_src_modules_brands_kyb_controller_ts, apps_api_src_modules_brands_kyb_service_ts [EXTRACTED 0.90]
- **Auto-refund on visibility failure** — adr_0010_auto_refund_visibility_failure, apps_api_src_modules_submissions_submission_visibility_scheduler_ts, apps_api_src_modules_refunds_refunds_service_ts, apps_api_src_modules_ledger_ledger_service_ts, admin_finance_visibility_failures [EXTRACTED 0.90]
- **TradeSafe outbound payout rail** — adr_0008_tradesafe_payouts, adr_0009_tradesafe_integration_skeleton, apps_api_src_modules_tradesafe_tradesafe_client_ts, apps_api_src_modules_payouts_tradesafe_payout_adapter_ts, apps_api_src_modules_tradesafe_tradesafe_callback_controller_ts, apps_api_src_modules_webhooks_tradesafe_webhook_controller_ts, apps_api_src_modules_tradesafe_tradesafe_webhook_handler_ts, apps_api_src_modules_payouts_payout_provider_factory_ts [EXTRACTED 0.90]

## Communities

### Community 0 - "Next.js page routes"
Cohesion: 0.01
Nodes (48): handleClickOutside(), ApifySocialScheduler, ApplyToBountyDto, CreateInvitationsDto, InvitationItemDto, ReviewApplicationDto, CreateBrandDto, InviteMemberDto (+40 more)

### Community 1 - "API service layer"
Cohesion: 0.02
Nodes (50): emptyCounters(), emptyScrapedPost(), isoOrNull(), mapFacebookItem(), mapFacebookPostItem(), mapInstagramItem(), mapInstagramPostItem(), mapTiktokItem() (+42 more)

### Community 2 - "React query hooks"
Cohesion: 0.04
Nodes (165): /admin/audit-logs, /admin/audit-logs/[id], /admin/bounties, /admin/bounties/[id], /admin/brands, /admin/brands/[id], /admin/brands/new, /admin/component-library (+157 more)

### Community 3 - "Project charter & ADRs"
Cohesion: 0.02
Nodes (81): AdminLayout(), AuthGroupLayout(), BrandsLayout(), BusinessLayout(), HuntersLayout(), ParticipantLayout(), SharedLayout(), getNavItems() (+73 more)

### Community 4 - "REST API controllers"
Cohesion: 0.03
Nodes (29): handleSelectHunter(), ApprovalLedgerService, runBench(), BeneficiaryService, BrandFundingHandler, handleSelect(), toggleChannel(), toggleFormat() (+21 more)

### Community 5 - "Page spec documentation"
Cohesion: 0.02
Nodes (14): AdminController, BountiesController, BountyAccessController, BrandsController, DisputesController, FilesController, resolveAndValidatePath(), FilesModule (+6 more)

### Community 6 - "Finance admin dashboard"
Cohesion: 0.03
Nodes (15): AuditService, runCi(), BountiesService, BountyAccessService, BrandsService, handleSwitch(), DisputeSchedulerService, PaymentsService (+7 more)

### Community 7 - "Bounty service & tests"
Cohesion: 0.03
Nodes (110): ADR 0001 — Stripe Retirement Timing, ADR 0003 — TradeSafe Escrow Layer Out of Scope, ADR 0004 — Feature Flag Inventory for Stitch Rollout, ADR 0007 — Peach Payments for Hunter Payouts, ADR 0008 — TradeSafe for Hunter Payouts, ADR 0009 — TradeSafe Integration Skeleton, Agent Architect, Agent Back-End (+102 more)

### Community 8 - "Subscription & auth lifecycle"
Cohesion: 0.03
Nodes (22): BusinessController, FinanceExportsController, FinanceExportsService, DevSeedPayableDto, FinanceAdminController, KillSwitchDto, OverrideDto, OverrideLegDto (+14 more)

### Community 9 - "Ledger & payment services"
Cohesion: 0.05
Nodes (14): makeConfig(), makePrisma(), makeRedis(), makeConfig(), BountiesModule, BountyAccessModule, ExpiredBountyScheduler, HttpExceptionFilter (+6 more)

### Community 10 - "Roadmap & risk concepts"
Cohesion: 0.04
Nodes (14): AdminModule, AuthModule, DisputesModule, doc:md-files/brand-profile-and-signup.md, JwtAuthGuard, JwtStrategy, PaymentsModule, PayoutProviderFactory (+6 more)

### Community 11 - "User & brand profile services"
Cohesion: 0.08
Nodes (72): concept:AuditLog, concept:FinancialNonNegotiables, concept:GlobalFee, concept:KB, concept:KillSwitch, concept:Ledger, concept:Phase1, concept:Phase2 (+64 more)

### Community 12 - "Webhook handlers & triggers"
Cohesion: 0.04
Nodes (8): InboxController, NotificationsService, buildFeaturesDto(), getClearanceDays(), getCommissionRate(), SubscriptionLifecycleScheduler, SubscriptionsController, SubscriptionsService

### Community 13 - "Auth & settings admin"
Cohesion: 0.04
Nodes (25): getDashboardUrl(), derivePreviewChecks(), hasAnyPreviewChecks(), pairKey(), EnvironmentVariables, decodeTokenPayload(), getDashboardUrl(), middleware() (+17 more)

### Community 14 - "Wallet service"
Cohesion: 0.06
Nodes (6): AdminService, handleStatusConfirm(), CreateBountyFundingDto, PaymentsController, redirectToHostedCheckout(), SettingsService

### Community 15 - "Bounty access & mutation"
Cohesion: 0.09
Nodes (9): FinanceAdminModule, FinanceModule, LedgerModule, KillSwitchActiveError, LedgerImbalanceError, ReconciliationModule, RefundsModule, SubscriptionsModule (+1 more)

### Community 16 - "Controllers & RBAC guards"
Cohesion: 0.06
Nodes (15): formatRewardZAR(), hashHue(), rewardBody(), BrandAvatar(), display(), rewardBody(), formatDisputeReason(), formatBytes() (+7 more)

### Community 17 - "Frontend formatters & badges"
Cohesion: 0.09
Nodes (31): .avatar, .badge, .btn (button), .card, .chip, .input / .textarea / .select, .progress, .table (+23 more)

### Community 18 - "Reconciliation engine"
Cohesion: 0.11
Nodes (4): approxDelta(), FakeDecimal, WalletService, FakeDecimal

### Community 19 - "Design system handoff"
Cohesion: 0.15
Nodes (19): buildBountyRow(), buildLedgerStub(), buildPrismaStub(), buildService(), buildStitchStub(), buildSubmissionRow(), buildBountyRow(), buildLedgerStub() (+11 more)

### Community 20 - "Bounty creation form"
Cohesion: 0.1
Nodes (7): AuthController, clearRefreshCookie(), setRefreshCookie(), HealthController, handleSignup(), handleVerifyOtp(), handleBlur()

### Community 21 - "Refund flow test fixtures"
Cohesion: 0.13
Nodes (7): InstagramIcon(), TwitterIcon(), FadeUp(), InstagramIcon(), Reveal(), TwitterIcon(), useInView()

### Community 22 - "Marketing site pages"
Cohesion: 0.1
Nodes (8): makeSecret(), sign(), StitchWebhookController, sign(), SvixVerificationError, makeSecret(), sign(), TradeSafeWebhookController

### Community 23 - "Inbox & notifications"
Cohesion: 0.16
Nodes (19): GET /wallet/dashboard, GET /wallet/ledger-snapshot, GET /wallet/transactions, POST /wallet/withdrawals, LedgerEntry, StitchPayout, TradeSafeBeneficiary, Transaction history (+11 more)

### Community 24 - "Apify scraping integration"
Cohesion: 0.2
Nodes (15): buildKbEntry(), compact(), deriveGuidance(), describeQuery(), extractMetaSystem(), parseArgs(), parseKbFile(), printUsage() (+7 more)

### Community 25 - "Wallet page specs"
Cohesion: 0.22
Nodes (14): isValidCategory(), isValidReward(), isValidSort(), isValidView(), mapSortToApi(), readFromUrl(), useBrowseFilters(), isValidReward() (+6 more)

### Community 26 - "KB context CLI"
Cohesion: 0.22
Nodes (18): TermsAndConditions, Auth Layout (centered glass card), JWT Auth (access + refresh), Marketing Pages (public layout), OTP (Passwordless 6-digit), Signup Flow (2-step OTP), Subscription, SubscriptionTier (FREE/PRO) (+10 more)

### Community 27 - "Bounty browse & manage filters"
Cohesion: 0.14
Nodes (5): KybController, RejectKybDto, SubmitKybDto, KybService, SubmissionDetailPage()

### Community 28 - "Marketing page specs"
Cohesion: 0.28
Nodes (7): makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext(), makeContext()

### Community 29 - "External API clients"
Cohesion: 0.19
Nodes (6): BusinessModule, RedisModule, buildClient(), respond(), buildClient(), respond()

### Community 30 - "RBAC controller spec harness"
Cohesion: 0.29
Nodes (3): FeeCalculatorService, feeCents(), halfEven()

### Community 31 - "TradeSafe OAuth callback"
Cohesion: 0.24
Nodes (5): ApiError, buildQueryString(), getAccessToken(), onUnauthorized(), request()

### Community 32 - "Fee calculator & rounding"
Cohesion: 0.2
Nodes (8): CreateBountyDto, EngagementRequirementsDto, PayoutMetricsDto, PostVisibilityDto, RewardLineDto, StructuredEligibilityDto, UpdateBountyDto, UpdateBountyStatusDto

### Community 33 - "Web API fetch client"
Cohesion: 0.22
Nodes (8): AssignDisputeDto, CreateDisputeDto, EscalateDisputeDto, ResolveDisputeDto, SendMessageDto, TransitionDisputeDto, UpdateDisputeDto, WithdrawDisputeDto

### Community 34 - "Submission & env validators"
Cohesion: 0.22
Nodes (8): LogoutDto, RefreshTokenDto, RequestEmailChangeDto, RequestOtpDto, SignupWithOtpDto, SwitchBrandDto, VerifyEmailChangeDto, VerifyOtpDto

### Community 35 - "Bounty DTO validators"
Cohesion: 0.33
Nodes (3): buildCreateBountyRequest(), makeFilledState(), makeState()

### Community 36 - "Web auth middleware"
Cohesion: 0.29
Nodes (6): AdminCreateOrgDto, AdminOverrideBountyDto, AdminOverrideSubmissionDto, AdminUpdateBrandStatusDto, AdminUpdateSettingsDto, AdminUpdateUserStatusDto

### Community 38 - "Dispute DTO validators"
Cohesion: 0.5
Nodes (2): computeVerificationChecks(), normalize()

### Community 39 - "KYB brand verification"
Cohesion: 0.4
Nodes (5): Social Bounty Wordmark, Wordmark Pink Fill, Wordmark Layout, Wordmark Text: 'Social Bounty', Wordmark Typography Style

### Community 40 - "App sidebar navigation"
Cohesion: 0.67
Nodes (2): loginAs(), seedOtpInRedis()

### Community 41 - "Verification check computation"
Cohesion: 0.83
Nodes (3): djb2(), getMockBrandSocialAnalytics(), pickInRange()

### Community 42 - "Scrape recovery scheduler"
Cohesion: 0.67
Nodes (1): SanitizePipe

### Community 43 - "Wordmark asset"
Cohesion: 0.5
Nodes (2): BrandsModule, KbModule

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (2): buildService(), makeQueryRawRouter()

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (1): TradeSafeApiError

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): AppModule

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): SettingsModule

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): InboxModule

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): HealthModule

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (1): AuditModule

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (1): WalletModule

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (1): SubmissionsModule

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): WebhooksModule

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): ApifyModule

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (1): Double-entry ledger (CLAUDE.md §4.1)

### Community 125 - "Community 125"
Cohesion: 1.0
Nodes (1): UNIQUE(referenceId, actionType) idempotency

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): QA Known Issues and Checks

## Knowledge Gaps
- **173 isolated node(s):** `AppModule`, `EnvironmentVariables`, `ReconciliationModule`, `SettingsModule`, `CreateBountyFundingDto` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Dispute DTO validators`** (5 nodes): `compute-verification-checks.ts`, `compute-verification-checks.spec.ts`, `computeVerificationChecks()`, `normalize()`, `noRules()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App sidebar navigation`** (4 nodes): `helpers.ts`, `loginAs()`, `logout()`, `seedOtpInRedis()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scrape recovery scheduler`** (4 nodes): `sanitize.pipe.ts`, `SanitizePipe`, `.sanitize()`, `.transform()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Wordmark asset`** (4 nodes): `brands.module.ts`, `kb.module.ts`, `BrandsModule`, `KbModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (3 nodes): `reconciliation.fault-injection.spec.ts`, `buildService()`, `makeQueryRawRouter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `tradesafe.types.ts`, `TradeSafeApiError`, `.constructor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `settings.module.ts`, `SettingsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `inbox.module.ts`, `InboxModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `health.module.ts`, `HealthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `audit.module.ts`, `AuditModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `wallet.module.ts`, `WalletModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (2 nodes): `submissions.module.ts`, `SubmissionsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `webhooks.module.ts`, `WebhooksModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `ApifyModule`, `apify.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `Double-entry ledger (CLAUDE.md §4.1)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `UNIQUE(referenceId, actionType) idempotency`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `QA Known Issues and Checks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR 0009 — TradeSafe Integration Skeleton` connect `Bounty service & tests` to `React query hooks`, `User & brand profile services`, `Auth & settings admin`, `Bounty access & mutation`, `Marketing site pages`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `ADR 0006 — Compensating Entries Bypass the Financial Kill Switch` connect `React query hooks` to `User & brand profile services`, `Bounty service & tests`, `Bounty access & mutation`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ADR 0010 — Auto-Refund on PostVisibility Failure` connect `React query hooks` to `Webhook handlers & triggers`, `Bounty service & tests`, `Bounty access & mutation`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Social Bounty MVP` (e.g. with `claude.md` and `Participant`) actually correct?**
  _`Social Bounty MVP` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `FinanceAdminService` (e.g. with `ReconciliationService` and `BrandFundingHandler`) actually correct?**
  _`FinanceAdminService` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `risk:R18` (e.g. with `concept:StitchExpress` and `concept:TradeSafe`) actually correct?**
  _`risk:R18` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `BountiesService` (e.g. with `BountyAccessService` and `SubmissionsService`) actually correct?**
  _`BountiesService` has 2 INFERRED edges - model-reasoned connections that need verification._