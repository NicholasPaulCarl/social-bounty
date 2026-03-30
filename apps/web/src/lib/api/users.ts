import { apiClient } from './client';
import type {
  UserProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  MessageResponse,
  SocialLinkResponse,
  UpsertSocialLinkRequest,
} from '@social-bounty/shared';

export const userApi = {
  getMe: (): Promise<UserProfileResponse> =>
    apiClient.get('/users/me'),

  updateMe: (data: UpdateProfileRequest): Promise<UpdateProfileResponse> =>
    apiClient.patch('/users/me', data),

  changePassword: (data: ChangePasswordRequest): Promise<MessageResponse> =>
    apiClient.post('/users/me/change-password', data),

  // Profile picture
  uploadProfilePicture: (file: File): Promise<{ profilePictureUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/users/me/profile-picture', formData);
  },

  deleteProfilePicture: (): Promise<MessageResponse> =>
    apiClient.delete('/users/me/profile-picture'),

  // Social links
  getSocialLinks: (): Promise<SocialLinkResponse[]> =>
    apiClient.get('/users/me/social-links'),

  upsertSocialLink: (data: UpsertSocialLinkRequest): Promise<SocialLinkResponse> =>
    apiClient.post('/users/me/social-links', data),

  deleteSocialLink: (id: string): Promise<MessageResponse> =>
    apiClient.delete(`/users/me/social-links/${id}`),
};
