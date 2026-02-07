import { apiClient } from './client';
import type {
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  MySubmissionListItem,
  MySubmissionsParams,
  SubmissionReviewListItem,
  SubmissionReviewListParams,
  SubmissionDetailResponse,
  UpdateSubmissionRequest,
  ReviewSubmissionRequest,
  ReviewSubmissionResponse,
  UpdatePayoutRequest,
  UpdatePayoutResponse,
  PaginatedResponse,
} from '@social-bounty/shared';

export const submissionApi = {
  create: (bountyId: string, data: CreateSubmissionRequest, images?: File[]): Promise<CreateSubmissionResponse> => {
    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append('proofText', data.proofText);
      if (data.proofLinks) {
        data.proofLinks.forEach((link) => formData.append('proofLinks', link));
      }
      images.forEach((file) => formData.append('proofImages', file));
      return apiClient.post(`/bounties/${bountyId}/submissions`, formData);
    }
    return apiClient.post(`/bounties/${bountyId}/submissions`, data);
  },

  listMine: (params: MySubmissionsParams): Promise<PaginatedResponse<MySubmissionListItem>> =>
    apiClient.get('/submissions/me', params as Record<string, unknown>),

  listForBounty: (bountyId: string, params: SubmissionReviewListParams): Promise<PaginatedResponse<SubmissionReviewListItem>> =>
    apiClient.get(`/bounties/${bountyId}/submissions`, params as Record<string, unknown>),

  getById: (id: string): Promise<SubmissionDetailResponse> =>
    apiClient.get(`/submissions/${id}`),

  update: (id: string, data: UpdateSubmissionRequest, images?: File[]): Promise<SubmissionDetailResponse> => {
    if (images && images.length > 0) {
      const formData = new FormData();
      if (data.proofText) formData.append('proofText', data.proofText);
      if (data.proofLinks) {
        data.proofLinks.forEach((link) => formData.append('proofLinks', link));
      }
      if (data.removeImageIds) {
        data.removeImageIds.forEach((id) => formData.append('removeImageIds', id));
      }
      images.forEach((file) => formData.append('proofImages', file));
      return apiClient.patch(`/submissions/${id}`, formData);
    }
    return apiClient.patch(`/submissions/${id}`, data);
  },

  review: (id: string, data: ReviewSubmissionRequest): Promise<ReviewSubmissionResponse> =>
    apiClient.patch(`/submissions/${id}/review`, data),

  updatePayout: (id: string, data: UpdatePayoutRequest): Promise<UpdatePayoutResponse> =>
    apiClient.patch(`/submissions/${id}/payout`, data),
};
