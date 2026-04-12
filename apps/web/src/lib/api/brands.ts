import { apiClient } from './client';
import type {
  CreateBrandRequest,
  BrandResponse,
  BrandDetailResponse,
  UpdateBrandRequest,
  BrandMemberResponse,
  InviteMemberRequest,
  InviteMemberResponse,
  PaginatedResponse,
  MessageResponse,
  BrandProfileResponse,
  BrandListItem,
  BrandListParams,
  MyBrandListItem,
} from '@social-bounty/shared';

export const brandsApi = {
  create: (data: CreateBrandRequest, logo?: File): Promise<BrandResponse> => {
    if (logo) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('contactEmail', data.contactEmail);
      if (data.handle) formData.append('handle', data.handle);
      if (data.bio) formData.append('bio', data.bio);
      if (data.websiteUrl) formData.append('websiteUrl', data.websiteUrl);
      if (data.socialLinks) formData.append('socialLinks', JSON.stringify(data.socialLinks));
      if (data.targetInterests) formData.append('targetInterests', JSON.stringify(data.targetInterests));
      formData.append('logo', logo);
      return apiClient.post('/brands', formData);
    }
    return apiClient.post('/brands', data);
  },

  getById: (id: string): Promise<BrandDetailResponse> =>
    apiClient.get(`/brands/${id}`),

  update: (id: string, data: UpdateBrandRequest, logo?: File | null): Promise<BrandResponse> => {
    if (logo !== undefined) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
      if (data.handle !== undefined) formData.append('handle', data.handle || '');
      if (data.bio !== undefined) formData.append('bio', data.bio || '');
      if (data.websiteUrl !== undefined) formData.append('websiteUrl', data.websiteUrl || '');
      if (data.socialLinks) formData.append('socialLinks', JSON.stringify(data.socialLinks));
      if (data.targetInterests) formData.append('targetInterests', JSON.stringify(data.targetInterests));
      if (data.messagingEnabled !== undefined) formData.append('messagingEnabled', String(data.messagingEnabled));
      if (logo) formData.append('logo', logo);
      return apiClient.patch(`/brands/${id}`, formData);
    }
    return apiClient.patch(`/brands/${id}`, data);
  },

  listMembers: (id: string, params?: Record<string, unknown>): Promise<PaginatedResponse<BrandMemberResponse>> =>
    apiClient.get(`/brands/${id}/members`, params),

  inviteMember: (id: string, data: InviteMemberRequest): Promise<InviteMemberResponse> =>
    apiClient.post(`/brands/${id}/members`, data),

  removeMember: (orgId: string, userId: string): Promise<MessageResponse> =>
    apiClient.delete(`/brands/${orgId}/members/${userId}`),

  listMine: (): Promise<MyBrandListItem[]> =>
    apiClient.get('/brands/mine'),

  listPublic: (params?: BrandListParams): Promise<PaginatedResponse<BrandListItem>> =>
    apiClient.get('/brands/public', params as Record<string, unknown> | undefined),

  getPublicProfile: (idOrHandle: string): Promise<BrandProfileResponse> =>
    apiClient.get(`/brands/public/${idOrHandle}`),

  checkHandle: (handle: string): Promise<{ available: boolean; handle: string }> =>
    apiClient.get(`/brands/check-handle/${handle}`),

  uploadCoverPhoto: (id: string, file: File): Promise<BrandResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/brands/${id}/cover-photo`, formData);
  },
};
