import { apiClient } from './client';
import type {
  BountyListItem,
  BountyListParams,
  BountyDetailResponse,
  CreateBountyRequest,
  CreateBountyResponse,
  UpdateBountyRequest,
  UpdateBountyStatusRequest,
  UpdateBountyStatusResponse,
  PaginatedResponse,
  MessageResponse,
} from '@social-bounty/shared';

export const bountyApi = {
  list: (params: BountyListParams): Promise<PaginatedResponse<BountyListItem>> =>
    apiClient.get('/bounties', params as Record<string, unknown>),

  getById: (id: string): Promise<BountyDetailResponse> =>
    apiClient.get(`/bounties/${id}`),

  create: (data: CreateBountyRequest): Promise<CreateBountyResponse> =>
    apiClient.post('/bounties', data),

  update: (id: string, data: UpdateBountyRequest): Promise<BountyDetailResponse> =>
    apiClient.patch(`/bounties/${id}`, data),

  updateStatus: (id: string, data: UpdateBountyStatusRequest): Promise<UpdateBountyStatusResponse> =>
    apiClient.patch(`/bounties/${id}/status`, data),

  delete: (id: string): Promise<MessageResponse> =>
    apiClient.delete(`/bounties/${id}`),
};
