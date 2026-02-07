import { apiClient } from './client';
import type {
  UserProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  MessageResponse,
} from '@social-bounty/shared';

export const userApi = {
  getMe: (): Promise<UserProfileResponse> =>
    apiClient.get('/users/me'),

  updateMe: (data: UpdateProfileRequest): Promise<UpdateProfileResponse> =>
    apiClient.patch('/users/me', data),

  changePassword: (data: ChangePasswordRequest): Promise<MessageResponse> =>
    apiClient.post('/users/me/change-password', data),
};
