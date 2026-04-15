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
  BrandAssetInfo,
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

  acknowledgeVisibility: (id: string): Promise<{ id: string; visibilityAcknowledged: boolean; updatedAt: string }> =>
    apiClient.post(`/bounties/${id}/acknowledge-visibility`),

  createPaymentIntent: (bountyId: string): Promise<{ clientSecret: string }> =>
    apiClient.post(`/bounties/${bountyId}/payment-intent`),

  fundBounty: (
    bountyId: string,
    payer: { payerName: string; payerEmail?: string },
  ): Promise<{
    paymentLinkId: string;
    hostedUrl: string;
    amountCents: string;
    faceValueCents: string;
    brandAdminFeeCents: string;
    globalFeeCents: string;
  }> => apiClient.post(`/bounties/${bountyId}/fund`, payer),

  requestRefundBeforeApproval: (
    bountyId: string,
    reason: string,
  ): Promise<{ id: string; state: string }> =>
    apiClient.post(`/refunds/bounties/${bountyId}/before-approval`, { reason }),

  uploadBrandAssets: (bountyId: string, files: File[]): Promise<BrandAssetInfo[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.post(`/bounties/${bountyId}/brand-assets`, formData);
  },

  deleteBrandAsset: (bountyId: string, assetId: string): Promise<MessageResponse> =>
    apiClient.delete(`/bounties/${bountyId}/brand-assets/${assetId}`),
};
