import { UserRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────

// POST /auth/request-otp
export interface RequestOtpRequest {
  email: string;
}

// POST /auth/verify-otp
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// POST /auth/signup
export interface SignupWithOtpRequest {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
  interests?: string[];
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
