import { apiClient } from './client';
import type {
  RequestOtpRequest,
  VerifyOtpRequest,
  SignupWithOtpRequest,
  LoginResponse,
  RefreshTokenResponse,
  SwitchBrandRequest,
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
  switchBrand: (brandId: string) =>
    apiClient.post<LoginResponse>('/auth/switch-brand', { brandId }),
  requestEmailChange: (newEmail: string) =>
    apiClient.post<{ message: string }>('/auth/request-email-change', { newEmail }),
  verifyEmailChange: (otp: string) =>
    apiClient.post<{ message: string; email: string }>('/auth/verify-email-change', { otp }),
};
