import { apiClient } from './client';
import type {
  AdminUserListItem,
  AdminUserListParams,
  AdminUserDetailResponse,
  AdminUpdateUserStatusRequest,
  AdminUpdateUserStatusResponse,
  AdminOrgListItem,
  AdminOrgListParams,
  AdminCreateOrgRequest,
  AdminCreateOrgResponse,
  AdminUpdateOrgStatusRequest,
  AdminUpdateOrgStatusResponse,
  AdminOverrideBountyRequest,
  AdminOverrideBountyResponse,
  AdminOverrideSubmissionRequest,
  AdminOverrideSubmissionResponse,
  AuditLogListItem,
  AuditLogListParams,
  AuditLogDetailResponse,
  AdminDashboardResponse,
  AdminSystemHealthResponse,
  AdminRecentErrorItem,
  AdminRecentErrorsParams,
  AdminSettingsResponse,
  AdminUpdateSettingsRequest,
  PaginatedResponse,
  BountyListItem,
  BountyListParams,
  BountyDetailResponse,
  SubmissionDetailResponse,
} from '@social-bounty/shared';

export const adminApi = {
  // Dashboard
  getDashboard: (): Promise<AdminDashboardResponse> =>
    apiClient.get('/admin/dashboard'),

  // Users
  listUsers: (params: AdminUserListParams): Promise<PaginatedResponse<AdminUserListItem>> =>
    apiClient.get('/admin/users', params as Record<string, unknown>),

  getUserById: (id: string): Promise<AdminUserDetailResponse> =>
    apiClient.get(`/admin/users/${id}`),

  updateUserStatus: (id: string, data: AdminUpdateUserStatusRequest): Promise<AdminUpdateUserStatusResponse> =>
    apiClient.patch(`/admin/users/${id}/status`, data),

  // Organisations
  listOrganisations: (params: AdminOrgListParams): Promise<PaginatedResponse<AdminOrgListItem>> =>
    apiClient.get('/admin/organisations', params as Record<string, unknown>),

  createOrganisation: (data: AdminCreateOrgRequest): Promise<AdminCreateOrgResponse> =>
    apiClient.post('/admin/organisations', data),

  getOrgById: (id: string): Promise<AdminOrgListItem> =>
    apiClient.get(`/admin/organisations/${id}`),

  updateOrgStatus: (id: string, data: AdminUpdateOrgStatusRequest): Promise<AdminUpdateOrgStatusResponse> =>
    apiClient.patch(`/admin/organisations/${id}/status`, data),

  // Bounties
  listBounties: (params: BountyListParams): Promise<PaginatedResponse<BountyListItem>> =>
    apiClient.get('/bounties', params as Record<string, unknown>),

  getBountyById: (id: string): Promise<BountyDetailResponse> =>
    apiClient.get(`/bounties/${id}`),

  overrideBountyStatus: (id: string, data: AdminOverrideBountyRequest): Promise<AdminOverrideBountyResponse> =>
    apiClient.patch(`/admin/bounties/${id}/override`, data),

  // Submissions
  listSubmissions: (params: Record<string, unknown>): Promise<PaginatedResponse<SubmissionDetailResponse>> =>
    apiClient.get('/admin/submissions', params),

  getSubmissionById: (id: string): Promise<SubmissionDetailResponse> =>
    apiClient.get(`/submissions/${id}`),

  overrideSubmissionStatus: (id: string, data: AdminOverrideSubmissionRequest): Promise<AdminOverrideSubmissionResponse> =>
    apiClient.patch(`/admin/submissions/${id}/override`, data),

  overridePayoutStatus: (id: string, data: { payoutStatus: string; reason: string }): Promise<AdminOverrideSubmissionResponse> =>
    apiClient.patch(`/admin/submissions/${id}/override`, data),

  // Audit Logs
  listAuditLogs: (params: AuditLogListParams): Promise<PaginatedResponse<AuditLogListItem>> =>
    apiClient.get('/admin/audit-logs', params as Record<string, unknown>),

  getAuditLogById: (id: string): Promise<AuditLogDetailResponse> =>
    apiClient.get(`/admin/audit-logs/${id}`),

  // System
  getSystemHealth: (): Promise<AdminSystemHealthResponse> =>
    apiClient.get('/admin/system-health'),

  getRecentErrors: (params: AdminRecentErrorsParams): Promise<PaginatedResponse<AdminRecentErrorItem>> =>
    apiClient.get('/admin/recent-errors', params as Record<string, unknown>),

  // Settings
  getSettings: (): Promise<AdminSettingsResponse> =>
    apiClient.get('/admin/settings'),

  updateSettings: (data: AdminUpdateSettingsRequest): Promise<AdminSettingsResponse> =>
    apiClient.patch('/admin/settings', data),
};
