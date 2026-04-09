import { apiClient } from './client';
import type {
  RequestOtpRequest,
  VerifyOtpRequest,
  SignupWithOtpRequest,
  LoginResponse,
  RefreshTokenResponse,
  SwitchOrganisationRequest,
} from '@social-bounty/shared';

export const authApi = {
  requestOtp: (data: RequestOtpRequest) =>
    apiClient.post<{ message: string }>('/auth/request-otp', data),
  verifyOtp: (data: VerifyOtpRequest) =>
    apiClient.post<LoginResponse>('/auth/verify-otp', data),
  signup: (data: SignupWithOtpRequest) =>
    apiClient.post<LoginResponse>('/auth/signup', data),
  logout: () => apiClient.post('/auth/logout', {}),
  refresh: () => apiClient.post<RefreshTokenResponse>('/auth/refresh', {}),
  switchOrganisation: (organisationId: string) =>
    apiClient.post<LoginResponse>('/auth/switch-organisation', { organisationId }),
};
