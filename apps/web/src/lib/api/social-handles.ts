import { apiClient } from './client';
import type { SocialHandleResponse, AddSocialHandleRequest, MessageResponse } from '@social-bounty/shared';

export const socialHandlesApi = {
  listMyHandles: (): Promise<SocialHandleResponse[]> =>
    apiClient.get('/profile/social-handles'),

  addHandle: (data: AddSocialHandleRequest): Promise<SocialHandleResponse> =>
    apiClient.post('/profile/social-handles', data),

  removeHandle: (id: string): Promise<MessageResponse> =>
    apiClient.delete(`/profile/social-handles/${id}`),

  getUserHandles: (userId: string): Promise<SocialHandleResponse[]> =>
    apiClient.get(`/users/${userId}/social-handles`),
};
