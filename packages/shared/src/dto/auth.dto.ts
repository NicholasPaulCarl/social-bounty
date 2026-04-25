import { UserRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// Auth DTOs
// ─────────────────────────────────────

export enum OtpChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// POST /auth/request-otp
export interface RequestOtpRequest {
  email: string;
  channel?: OtpChannel;
}

// POST /auth/verify-otp
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// POST /auth/switch-otp-channel
export interface SwitchOtpChannelRequest {
  email: string;
}

// Marketing channel opt-in choices captured at signup. Each boolean is the user's
// active consent for that channel; absence/false means no row is written and no
// marketing send-path will fire. POPIA §69 — consent must be specific, informed,
// and freely given.
export interface MarketingConsentInput {
  email: boolean;
  sms: boolean;
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
  termsAccepted: true;
  // Required marketing-consent object. Individual channel booleans may be false.
  marketingConsent: MarketingConsentInput;
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
