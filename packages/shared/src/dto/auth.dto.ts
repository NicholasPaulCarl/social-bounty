import { UserRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────

// POST /auth/signup
export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignupResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

// POST /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  organisationId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: LoginUserResponse;
}

// POST /auth/logout (refresh token read from httpOnly cookie)
export interface LogoutRequest {
  // empty — token in cookie
}

// POST /auth/forgot-password
export interface ForgotPasswordRequest {
  email: string;
}

// POST /auth/reset-password
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// POST /auth/verify-email
export interface VerifyEmailRequest {
  token: string;
}

// POST /auth/refresh (refresh token read from httpOnly cookie)
export interface RefreshTokenRequest {
  // empty — token in cookie
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// JWT Payload
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  organisationId: string | null;
  firstName?: string;
  lastName?: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat: number;
  exp: number;
}
