import {
  UserRole,
  UserStatus,
  OrgStatus,
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
} from '../enums';

// ─────────────────────────────────────
// Admin DTOs
// ─────────────────────────────────────

// GET /admin/users (list item)
export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  organisation: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// GET /admin/users (query params)
export interface AdminUserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// GET /admin/users/:id
export interface AdminUserDetailResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  organisation: { id: string; name: string } | null;
  submissionCount: number;
  approvedSubmissionCount: number;
  createdAt: string;
  updatedAt: string;
}

// PATCH /admin/users/:id/status
export interface AdminUpdateUserStatusRequest {
  status: UserStatus;
  reason: string;
}

export interface AdminUpdateUserStatusResponse {
  id: string;
  status: UserStatus;
  updatedAt: string;
}

// POST /admin/users/:id/force-password-reset
export interface AdminForcePasswordResetRequest {
  reason: string;
}

// GET /admin/organisations (list item)
export interface AdminOrgListItem {
  id: string;
  name: string;
  logo: string | null;
  contactEmail: string;
  status: OrgStatus;
  memberCount: number;
  bountyCount: number;
  createdAt: string;
}

// GET /admin/organisations (query params)
export interface AdminOrgListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: OrgStatus;
  search?: string;
}

// POST /admin/organisations
export interface AdminCreateOrgRequest {
  name: string;
  contactEmail: string;
  logo?: string | null;
  ownerUserId: string;
}

export interface AdminCreateOrgOwnerInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AdminCreateOrgResponse {
  id: string;
  name: string;
  contactEmail: string;
  logo: string | null;
  status: OrgStatus;
  owner: AdminCreateOrgOwnerInfo;
  createdAt: string;
}

// PATCH /admin/organisations/:id/status
export interface AdminUpdateOrgStatusRequest {
  status: OrgStatus;
  reason: string;
}

export interface AdminUpdateOrgStatusResponse {
  id: string;
  status: OrgStatus;
  updatedAt: string;
}

// PATCH /admin/bounties/:id/override
export interface AdminOverrideBountyRequest {
  status: BountyStatus;
  reason: string;
}

export interface AdminOverrideBountyResponse {
  id: string;
  status: BountyStatus;
  updatedAt: string;
}

// PATCH /admin/submissions/:id/override
export interface AdminOverrideSubmissionRequest {
  status: SubmissionStatus;
  reason: string;
}

export interface AdminOverrideSubmissionResponse {
  id: string;
  status: SubmissionStatus;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  updatedAt: string;
}

// GET /admin/audit-logs (list item)
export interface AuditLogActorInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditLogListItem {
  id: string;
  actorId: string;
  actor: AuditLogActorInfo;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

// GET /admin/audit-logs (query params)
export interface AuditLogListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

// GET /admin/audit-logs/:id
export interface AuditLogDetailResponse extends AuditLogListItem {}

// GET /admin/dashboard
export interface AdminDashboardResponse {
  users: {
    total: number;
    active: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  };
  organisations: {
    total: number;
    active: number;
    suspended: number;
  };
  bounties: {
    total: number;
    byStatus: Record<BountyStatus, number>;
  };
  submissions: {
    total: number;
    byStatus: Record<SubmissionStatus, number>;
    byPayoutStatus: Record<PayoutStatus, number>;
  };
}

// GET /admin/system-health
export interface ServiceHealthInfo {
  status: 'ok' | 'error';
  responseTime: number;
}

export interface AdminSystemHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealthInfo;
    fileStorage: ServiceHealthInfo;
    email: ServiceHealthInfo;
  };
  memory: {
    used: number;
    total: number;
  };
}

// GET /admin/recent-errors
export interface AdminRecentErrorItem {
  id: string;
  timestamp: string;
  message: string;
  stackTrace: string;
  endpoint: string;
  userId: string | null;
  severity: string;
}

export interface AdminRecentErrorsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// GET/PATCH /admin/settings
export interface AdminSettingsResponse {
  signupsEnabled: boolean;
  submissionsEnabled: boolean;
  updatedAt: string;
  updatedBy: {
    id: string;
    email: string;
  };
}

export interface AdminUpdateSettingsRequest {
  signupsEnabled?: boolean;
  submissionsEnabled?: boolean;
}
