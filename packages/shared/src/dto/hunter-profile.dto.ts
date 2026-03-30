import { SocialChannel } from '../enums';

// ─────────────────────────────────────
// Social Link Types
// ─────────────────────────────────────

export interface SocialLinkResponse {
  id: string;
  platform: SocialChannel;
  url: string;
  handle: string | null;
  followerCount: number | null;
  postCount: number | null;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface UpsertSocialLinkRequest {
  platform: SocialChannel;
  url: string;
  handle?: string;
  followerCount?: number;
  postCount?: number;
}

// ─────────────────────────────────────
// Profile Update
// ─────────────────────────────────────

export interface UpdateHunterProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  interests?: string[];
}

// ─────────────────────────────────────
// Public Hunter Profile
// ─────────────────────────────────────

export interface PublicHunterProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  profilePictureUrl: string | null;
  interests: string[];
  socialLinks: SocialLinkResponse[];
  role: string;
  emailVerified: boolean;
  createdAt: string;
  stats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    completedBounties: number;
  };
}

// ─────────────────────────────────────
// Hunter Directory (list)
// ─────────────────────────────────────

export interface HunterListItem {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  profilePictureUrl: string | null;
  interests: string[];
  socialLinks: { platform: SocialChannel; followerCount: number | null }[];
  createdAt: string;
}

export interface HunterListParams {
  page?: number;
  limit?: number;
  interest?: string;
  search?: string;
}
