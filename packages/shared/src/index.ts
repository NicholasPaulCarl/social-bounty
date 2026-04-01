// ─────────────────────────────────────
// @social-bounty/shared
// ─────────────────────────────────────

// Enums
export {
  UserRole,
  UserStatus,
  OrgStatus,
  OrgMemberRole,
  BountyStatus,
  RewardType,
  SubmissionStatus,
  PayoutStatus,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
  Currency,
  PaymentStatus,
  PayoutMethod,
  DisputeStatus,
  DisputeCategory,
  DisputeReason,
  DisputeResolution,
  DisputeMessageType,
  EvidenceType,
  WalletTxType,
  WithdrawalStatus,
  BountyAccessType,
  BountyApplicationStatus,
  BountyInvitationStatus,
  SocialPlatform,
  SocialHandleStatus,
  NotificationType,
  ConversationContext,
} from './enums';

// Common types
export type {
  SortOrder,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  ApiErrorDetail,
  ApiErrorResponse,
  MessageResponse,
} from './common';

// Constants
export {
  PAGINATION_DEFAULTS,
  PASSWORD_RULES,
  FILE_UPLOAD_LIMITS,
  BRAND_ASSET_LIMITS,
  FIELD_LIMITS,
  RATE_LIMITS,
  JWT_CONFIG,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  CHANNEL_POST_FORMATS,
  CHANNEL_URL_PATTERNS,
  BOUNTY_REWARD_LIMITS,
  PAYOUT_METRICS_LIMITS,
  VERIFICATION_DEADLINE_HOURS,
  BOUNTY_CATEGORIES,
  DISPUTE_LIMITS,
  DISPUTE_EVIDENCE_LIMITS,
  DISPUTE_REASON_CATEGORIES,
  PROFILE_LIMITS,
  HUNTER_INTERESTS,
  WALLET_LIMITS,
  WITHDRAWAL_LIMITS,
  BOUNTY_ACCESS_CONSTANTS,
  SOCIAL_HANDLE_CONSTANTS,
  INBOX_CONSTANTS,
} from './constants';

export type { CategoryInfo, HunterInterest } from './constants';

// Auth DTOs
export type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginUserResponse,
  LoginResponse,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  JwtPayload,
} from './dto/auth.dto';

// User DTOs
export type {
  UserOrganisationInfo,
  UserSocialLinkInfo,
  UserProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
} from './dto/user.dto';

// Hunter Profile DTOs
export type {
  SocialLinkResponse,
  UpsertSocialLinkRequest,
  UpdateHunterProfileRequest,
  PublicHunterProfile,
  HunterListItem,
  HunterListParams,
} from './dto/hunter-profile.dto';

// Wallet DTOs
export type {
  WalletBalanceResponse,
  WalletTransactionListItem,
  WalletTransactionListParams,
  WalletDashboardResponse,
  PaginatedWalletTransactions,
  RequestWithdrawalRequest,
  WithdrawalListItem,
  WithdrawalListParams,
  PaginatedWithdrawals,
  AdminWalletListItem,
  AdminWalletListParams,
  AdminWalletAdjustRequest,
  AdminWithdrawalListItem,
  AdminWithdrawalListParams,
  AdminCompleteWithdrawalRequest,
  AdminFailWithdrawalRequest,
} from './dto/wallet.dto';

// Organisation DTOs
export type {
  CreateOrganisationRequest,
  OrganisationResponse,
  OrganisationDetailResponse,
  UpdateOrganisationRequest,
  OrgMemberUserInfo,
  OrgMemberResponse,
  InviteMemberRequest,
  InvitationResponse,
  InviteMemberResponse,
} from './dto/organisation.dto';

// Bounty DTOs
export type {
  BountyOrganisationInfo,
  BountyCreatorInfo,
  BountyUserSubmissionInfo,
  BrandAssetInfo,
  StatusHistoryEntry,
  ChannelSelection,
  RewardLineInput,
  RewardLineResponse,
  StructuredEligibilityInput,
  PostVisibilityInput,
  EngagementRequirementsInput,
  PayoutMetricsInput,
  BountyListItem,
  BountyListParams,
  BountyDetailResponse,
  CreateBountyRequest,
  CreateBountyResponse,
  UpdateBountyRequest,
  UpdateBountyStatusRequest,
  UpdateBountyStatusResponse,
} from './dto/bounty.dto';

// Submission DTOs
export type {
  PayoutResponse,
  ReviewHistoryEntry,
  ReportedMetricsInput,
  FileUploadInfo,
  SubmissionBountyInfo,
  SubmissionBountyWithOrgInfo,
  SubmissionUserInfo,
  SubmissionReviewerInfo,
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  MySubmissionListItem,
  MySubmissionsParams,
  SubmissionReviewListItem,
  SubmissionReviewListParams,
  SubmissionDetailResponse,
  UpdateSubmissionRequest,
  ReviewSubmissionRequest,
  ReviewSubmissionResponse,
  UpdatePayoutRequest,
  UpdatePayoutResponse,
  ReviewQueueStats,
  ReviewQueueResponse,
  EarningsSummaryResponse,
} from './dto/submission.dto';

// Admin DTOs
export type {
  AdminUserListItem,
  AdminUserListParams,
  AdminUserDetailResponse,
  AdminUpdateUserStatusRequest,
  AdminUpdateUserStatusResponse,
  AdminForcePasswordResetRequest,
  AdminOrgListItem,
  AdminOrgListParams,
  AdminCreateOrgRequest,
  AdminCreateOrgOwnerInfo,
  AdminCreateOrgResponse,
  AdminUpdateOrgStatusRequest,
  AdminUpdateOrgStatusResponse,
  AdminOverrideBountyRequest,
  AdminOverrideBountyResponse,
  AdminOverrideSubmissionRequest,
  AdminOverrideSubmissionResponse,
  AuditLogActorInfo,
  AuditLogListItem,
  AuditLogListParams,
  AuditLogDetailResponse,
  AdminDashboardResponse,
  ServiceHealthInfo,
  AdminSystemHealthResponse,
  AdminRecentErrorItem,
  AdminRecentErrorsParams,
  AdminSettingsResponse,
  AdminUpdateSettingsRequest,
} from './dto/admin.dto';

// Business DTOs
export type {
  BusinessDashboardResponse,
} from './dto/business.dto';

// Health DTOs
export type {
  HealthCheckResponse,
} from './dto/health.dto';

// Dispute DTOs
export type {
  CreateDisputeRequest,
  UpdateDisputeRequest,
  SendDisputeMessageRequest,
  AdminResolveDisputeRequest,
  AdminAssignDisputeRequest,
  AdminTransitionDisputeRequest,
  EscalateDisputeRequest,
  WithdrawDisputeRequest,
  DisputeUserInfo,
  DisputeSubmissionInfo,
  DisputeListItem,
  DisputeDetailResponse,
  DisputeMessageResponse,
  DisputeEvidenceResponse,
  DisputeStatusHistoryResponse,
  DisputeListParams,
  AdminDisputeListParams,
  DisputeStatsResponse,
  PaginatedDisputeListResponse,
} from './dto/dispute.dto';

// Bounty Access DTOs
export type {
  CreateBountyApplicationRequest,
  ReviewApplicationRequest,
  BountyApplicationResponse,
  BountyApplicationListParams,
  CreateBountyInvitationsRequest,
  BountyInvitationResponse,
  AddSocialHandleRequest,
  SocialHandleResponse,
} from './dto/bounty-access.dto';

// Inbox DTOs
export type {
  NotificationResponse,
  NotificationListParams,
  PaginatedNotifications,
  UnreadCountResponse,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  ConversationListItem,
  ConversationDetailResponse,
  InboxMessageResponse,
  ConversationListParams,
} from './dto/inbox.dto';
