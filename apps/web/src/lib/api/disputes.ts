import { apiClient } from './client';
import type {
  CreateDisputeRequest,
  UpdateDisputeRequest,
  SendDisputeMessageRequest,
  AdminResolveDisputeRequest,
  AdminAssignDisputeRequest,
  AdminTransitionDisputeRequest,
  EscalateDisputeRequest,
  WithdrawDisputeRequest,
  DisputeDetailResponse,
  DisputeListItem,
  DisputeStatsResponse,
  PaginatedDisputeListResponse,
  DisputeListParams,
  AdminDisputeListParams,
} from '@social-bounty/shared';

export const disputeApi = {
  create: (data: CreateDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.post('/disputes', data),

  listMine: (params: DisputeListParams): Promise<PaginatedDisputeListResponse> =>
    apiClient.get('/disputes/me', params as Record<string, unknown>),

  listForOrg: (params: DisputeListParams): Promise<PaginatedDisputeListResponse> =>
    apiClient.get('/disputes/organisation', params as Record<string, unknown>),

  getById: (id: string): Promise<DisputeDetailResponse> =>
    apiClient.get(`/disputes/${id}`),

  update: (id: string, data: UpdateDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.patch(`/disputes/${id}`, data),

  submitDraft: (id: string): Promise<DisputeDetailResponse> =>
    apiClient.post(`/disputes/${id}/submit`),

  sendMessage: (id: string, data: SendDisputeMessageRequest): Promise<DisputeDetailResponse> =>
    apiClient.post(`/disputes/${id}/messages`, data),

  escalate: (id: string, data: EscalateDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.post(`/disputes/${id}/escalate`, data),

  withdraw: (id: string, data?: WithdrawDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.post(`/disputes/${id}/withdraw`, data),

  adminListAll: (params: AdminDisputeListParams): Promise<PaginatedDisputeListResponse> =>
    apiClient.get('/admin/disputes', params as Record<string, unknown>),

  adminGetStats: (): Promise<DisputeStatsResponse> =>
    apiClient.get('/admin/disputes/stats'),

  adminTransition: (id: string, data: AdminTransitionDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.patch(`/admin/disputes/${id}/transition`, data),

  adminAssign: (id: string, data: AdminAssignDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.patch(`/admin/disputes/${id}/assign`, data),

  adminResolve: (id: string, data: AdminResolveDisputeRequest): Promise<DisputeDetailResponse> =>
    apiClient.patch(`/admin/disputes/${id}/resolve`, data),
};
