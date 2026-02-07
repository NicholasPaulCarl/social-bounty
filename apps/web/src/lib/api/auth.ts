import { apiClient } from './client';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MessageResponse,
  LogoutRequest,
} from '@social-bounty/shared';

export const authApi = {
  signup: (data: SignupRequest): Promise<SignupResponse> =>
    apiClient.post('/auth/signup', data),

  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/auth/login', data),

  logout: (data: LogoutRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/logout', data),

  forgotPassword: (data: ForgotPasswordRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/reset-password', data),

  verifyEmail: (data: VerifyEmailRequest): Promise<MessageResponse> =>
    apiClient.post('/auth/verify-email', data),

  resendVerification: (): Promise<MessageResponse> =>
    apiClient.post('/auth/resend-verification'),

  refresh: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> =>
    apiClient.post('/auth/refresh', data),
};
