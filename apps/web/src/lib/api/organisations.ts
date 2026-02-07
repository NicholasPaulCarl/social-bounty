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
} from '@social-bounty/shared';

export const organisationApi = {
  create: (data: CreateOrganisationRequest, logo?: File): Promise<OrganisationResponse> => {
    if (logo) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('contactEmail', data.contactEmail);
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
};
