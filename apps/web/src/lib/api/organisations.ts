import { apiClient } from './client';
import type {
  CreateOrganisationRequest,
  OrganisationResponse,
  OrganisationDetailResponse,
  UpdateOrganisationRequest,
  OrgMemberResponse,
  InviteMemberRequest,
  InviteMemberResponse,
  PaginatedResponse,
  MessageResponse,
  BrandProfileResponse,
  BrandListItem,
  BrandListParams,
  MyBrandListItem,
} from '@social-bounty/shared';

export const organisationApi = {
  create: (data: CreateOrganisationRequest, logo?: File): Promise<OrganisationResponse> => {
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
      return apiClient.post('/organisations', formData);
    }
    return apiClient.post('/organisations', data);
  },

  getById: (id: string): Promise<OrganisationDetailResponse> =>
    apiClient.get(`/organisations/${id}`),

  update: (id: string, data: UpdateOrganisationRequest, logo?: File | null): Promise<OrganisationResponse> => {
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
      return apiClient.patch(`/organisations/${id}`, formData);
    }
    return apiClient.patch(`/organisations/${id}`, data);
  },

  listMembers: (id: string, params?: Record<string, unknown>): Promise<PaginatedResponse<OrgMemberResponse>> =>
    apiClient.get(`/organisations/${id}/members`, params),

  inviteMember: (id: string, data: InviteMemberRequest): Promise<InviteMemberResponse> =>
    apiClient.post(`/organisations/${id}/members`, data),

  removeMember: (orgId: string, userId: string): Promise<MessageResponse> =>
    apiClient.delete(`/organisations/${orgId}/members/${userId}`),

  listMine: (): Promise<MyBrandListItem[]> =>
    apiClient.get('/organisations/mine'),

  listPublic: (params?: BrandListParams): Promise<PaginatedResponse<BrandListItem>> =>
    apiClient.get('/organisations/public', params as Record<string, unknown> | undefined),

  getPublicProfile: (idOrHandle: string): Promise<BrandProfileResponse> =>
    apiClient.get(`/organisations/public/${idOrHandle}`),

  checkHandle: (handle: string): Promise<{ available: boolean; handle: string }> =>
    apiClient.get(`/organisations/check-handle/${handle}`),

  uploadCoverPhoto: (id: string, file: File): Promise<OrganisationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/organisations/${id}/cover-photo`, formData);
  },
};
