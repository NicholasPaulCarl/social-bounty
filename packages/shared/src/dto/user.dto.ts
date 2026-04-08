import { UserRole, UserStatus, SocialChannel } from '../enums';

// ─────────────────────────────────────
// User DTOs
// ─────────────────────────────────────

// GET /users/me
export interface UserOrganisationInfo {
  id: string;
  name: string;
  role: string;
}

export interface UserSocialLinkInfo {
  id: string;
  platform: SocialChannel;
  url: string;
  handle: string | null;
  followerCount: number | null;
  postCount: number | null;
  isVerified: boolean;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  bio: string | null;
  profilePictureUrl: string | null;
  interests: string[];
  socialLinks: UserSocialLinkInfo[];
  organisation: UserOrganisationInfo | null;
  createdAt: string;
  updatedAt: string;
}

// GET /users/search
export interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profilePictureUrl: string | null;
}

// PATCH /users/me
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  interests?: string[];
}

export interface UpdateProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  bio: string | null;
  profilePictureUrl: string | null;
  interests: string[];
  updatedAt: string;
}
