import { apiClient } from './client';
import type {
  BountyApplicationResponse,
  BountyApplicationListParams,
  CreateBountyApplicationRequest,
  ReviewApplicationRequest,
  BountyInvitationResponse,
  CreateBountyInvitationsRequest,
  PaginatedResponse,
  MessageResponse,
} from '@social-bounty/shared';

export const bountyAccessApi = {
  // ─── Applications ────────────────────────────────────────────────────────

  applyToBounty: (bountyId: string, data: CreateBountyApplicationRequest): Promise<BountyApplicationResponse> =>
    apiClient.post(`/bounties/${bountyId}/apply`, data),

  withdrawApplication: (bountyId: string): Promise<MessageResponse> =>
    apiClient.delete(`/bounties/${bountyId}/my-application`),

  getMyApplication: (bountyId: string): Promise<BountyApplicationResponse> =>
    apiClient.get(`/bounties/${bountyId}/my-application`),

  listApplications: (
    bountyId: string,
    params?: BountyApplicationListParams,
  ): Promise<PaginatedResponse<BountyApplicationResponse>> =>
    apiClient.get(`/bounties/${bountyId}/applications`, params as Record<string, unknown>),

  approveApplication: (bountyId: string, appId: string): Promise<BountyApplicationResponse> =>
    apiClient.post(`/bounties/${bountyId}/applications/${appId}/approve`),

  rejectApplication: (bountyId: string, appId: string, note?: string): Promise<BountyApplicationResponse> => {
    const payload: ReviewApplicationRequest = { status: 'REJECTED', reviewNote: note };
    return apiClient.post(`/bounties/${bountyId}/applications/${appId}/reject`, payload);
  },

  // ─── Invitations ─────────────────────────────────────────────────────────

  createInvitations: (bountyId: string, data: CreateBountyInvitationsRequest): Promise<BountyInvitationResponse[]> =>
    apiClient.post(`/bounties/${bountyId}/invitations`, data),

  listInvitations: (bountyId: string): Promise<BountyInvitationResponse[]> =>
    apiClient.get(`/bounties/${bountyId}/invitations`),

  getMyInvitations: (): Promise<BountyInvitationResponse[]> =>
    apiClient.get('/invitations/my'),

  acceptInvitation: (id: string): Promise<BountyInvitationResponse> =>
    apiClient.post(`/invitations/${id}/accept`),

  declineInvitation: (id: string): Promise<BountyInvitationResponse> =>
    apiClient.post(`/invitations/${id}/decline`),
};
