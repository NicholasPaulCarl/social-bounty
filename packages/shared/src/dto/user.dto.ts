import { UserRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// User DTOs
// ─────────────────────────────────────

// GET /users/me
export interface UserOrganisationInfo {
  id: string;
  name: string;
  role: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  organisation: UserOrganisationInfo | null;
  createdAt: string;
  updatedAt: string;
}

// PATCH /users/me
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}

export interface UpdateProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  updatedAt: string;
}

// POST /users/me/change-password
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
