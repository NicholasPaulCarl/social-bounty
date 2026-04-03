import { apiClient } from './client';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenResponse,
  MessageResponse,
} from '@social-bounty/shared';

export const authApi = {
  signup: (data: SignupRequest): Promise<SignupResponse> =>
    apiClient.post('/auth/signup', data),

  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/auth/login', data),

  logout: (): Promise<MessageResponse> =>
    apiClient.post('/auth/logout', {}),

  forgotPassword: (data: ForgotPasswordRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/reset-password', data),

  verifyEmail: (data: VerifyEmailRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/verify-email', data),

  resendVerification: (): Promise<MessageResponse> =>
    apiClient.post('/auth/resend-verification'),

  refresh: (): Promise<RefreshTokenResponse> =>
    apiClient.post('/auth/refresh', {}),
};
