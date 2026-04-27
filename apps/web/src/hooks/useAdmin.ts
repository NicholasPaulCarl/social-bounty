'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type {
  AdminUserListParams,
  AdminUpdateUserStatusRequest,
  AdminBrandListParams,
  AdminCreateBrandRequest,
  AdminUpdateBrandStatusRequest,
  AdminOverrideBountyRequest,
  AdminOverrideSubmissionRequest,
  AuditLogListParams,
  AdminRecentErrorsParams,
  AdminUpdateSettingsRequest,
  BountyListParams,
  RejectKybRequest,
} from '@social-bounty/shared';

// Dashboard
export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => adminApi.getDashboard(),
  });
}

// Users
export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminApi.listUsers(params),
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.userDetail(id),
    queryFn: () => adminApi.getUserById(id),
    enabled: !!id,
  });
}

export function useUpdateUserStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminUpdateUserStatusRequest) => adminApi.updateUserStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.userDetail(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// Brands
export function useAdminBrands(params: AdminBrandListParams) {
  return useQuery({
    queryKey: queryKeys.admin.brands(params),
    queryFn: () => adminApi.listBrands(params),
  });
}

export function useAdminBrandDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.brandDetail(id),
    queryFn: () => adminApi.getBrandById(id),
    enabled: !!id,
  });
}

export function useAdminCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminCreateBrandRequest) => adminApi.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] });
    },
  });
}

export function useUpdateBrandStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminUpdateBrandStatusRequest) => adminApi.updateBrandStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.brandDetail(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organisations'] });
    },
  });
}

// KYB Review (SUPER_ADMIN)
export function useAdminPendingKyb(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.admin.pendingKyb(params),
    queryFn: () => adminApi.listPendingKyb(params),
  });
}

export function useAdminKybReview(brandId: string) {
  return useQuery({
    queryKey: queryKeys.admin.kybReview(brandId),
    queryFn: () => adminApi.getKybReview(brandId),
    enabled: !!brandId,
  });
}

export function useApproveKyb(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.approveKyb(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kybReview(brandId) });
      // The pending queue keys vary by params — invalidate the whole "kyb" admin namespace.
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyb', 'pending'] });
    },
  });
}

export function useRejectKyb(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RejectKybRequest) => adminApi.rejectKyb(brandId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kybReview(brandId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyb', 'pending'] });
    },
  });
}

// Bounties (admin view)
export function useAdminBounties(params: BountyListParams) {
  return useQuery({
    queryKey: queryKeys.bounties.list(params),
    queryFn: () => adminApi.listBounties(params),
  });
}

export function useAdminBountyDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.bounties.detail(id),
    queryFn: () => adminApi.getBountyById(id),
    enabled: !!id,
  });
}

export function useOverrideBountyStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminOverrideBountyRequest) => adminApi.overrideBountyStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['bounties'] });
    },
  });
}

// Submissions (admin view)
export function useAdminSubmissions(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'submissions', params],
    queryFn: () => adminApi.listSubmissions(params),
  });
}

export function useAdminSubmissionDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.submissions.detail(id),
    queryFn: () => adminApi.getSubmissionById(id),
    enabled: !!id,
  });
}

export function useOverrideSubmissionStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminOverrideSubmissionRequest) => adminApi.overrideSubmissionStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useOverridePayoutStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { payoutStatus: string; reason: string }) => adminApi.overridePayoutStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// Audit Logs
export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(params),
    queryFn: () => adminApi.listAuditLogs(params),
  });
}

export function useAuditLogDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogDetail(id),
    queryFn: () => adminApi.getAuditLogById(id),
    enabled: !!id,
  });
}

// System Health
export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.admin.systemHealth,
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30000,
  });
}

// Payments Health (TradeSafe)
export function usePaymentsHealth() {
  return useQuery({
    queryKey: ['admin', 'paymentsHealth'] as const,
    queryFn: () => adminApi.getPaymentsHealth(),
    refetchInterval: 30000,
  });
}

export function useRecentErrors(params: AdminRecentErrorsParams) {
  return useQuery({
    queryKey: queryKeys.admin.recentErrors(params),
    queryFn: () => adminApi.getRecentErrors(params),
  });
}

// Settings
export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: () => adminApi.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminUpdateSettingsRequest) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
    },
  });
}
