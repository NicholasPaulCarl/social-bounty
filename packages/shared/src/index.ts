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
} from './constants';

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
  UserProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
} from './dto/user.dto';

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
