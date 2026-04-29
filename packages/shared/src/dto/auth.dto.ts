import { UserRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────

export enum OtpChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// POST /auth/request-otp
// Exactly one of `email` or `phoneNumber` must be provided.
export interface RequestOtpRequest {
  email?: string;
  phoneNumber?: string;
  channel?: OtpChannel;
}

// POST /auth/verify-otp
// Exactly one of `email` or `phoneNumber` must be provided.
export interface VerifyOtpRequest {
  email?: string;
  phoneNumber?: string;
  otp: string;
}

// POST /auth/switch-otp-channel
// Exactly one of `email` or `phoneNumber` must be provided.
export interface SwitchOtpChannelRequest {
  email?: string;
  phoneNumber?: string;
}

// POST /auth/signup
export interface SignupWithOtpRequest {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  interests?: string[];
  registerAsBrand?: boolean;
  brandName?: string;
  brandContactEmail?: string;
  // Required ToS + Privacy Policy acceptance. Backend rejects anything but `true`.
  // SMS + email are classified as service communications (POPIA-exempt
  // transactional channel) — no separate marketing consent is collected at
  // signup. If/when optional marketing is introduced it will be a separate
  // consent surface under POPIA §69.
  termsAccepted: true;
}

// POST /auth/switch-brand
export interface SwitchBrandRequest {
  brandId: string;
}

export interface LoginUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  brandId: string | null;
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
  brandId: string | null;
  firstName?: string;
  lastName?: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat: number;
  exp: number;
}
