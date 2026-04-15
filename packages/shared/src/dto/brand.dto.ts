import { BrandStatus, BrandMemberRole, KybStatus, UserStatus } from '../enums';

// ─────────────────────────────────────
// Brand DTOs
// ─────────────────────────────────────

export interface BrandSocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  x?: string;
  website?: string;
}

// ─── Apify-sourced social analytics ──

export type ApifyPlatform = 'instagram' | 'facebook' | 'tiktok';

export interface BrandSocialAnalyticsCounters {
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  totalLikes: number | null; // TikTok heart total; null for IG/FB
  avgLikes: number | null; // computed when source data allows
  engagementRate: number | null; // percent, 1 decimal
  error: string | null; // per-platform error or "not connected"; null on success
}

export interface BrandSocialAnalyticsBlob {
  fetchedAt: string; // ISO timestamp of the last refresh
  instagram: BrandSocialAnalyticsCounters;
  facebook: BrandSocialAnalyticsCounters;
  tiktok: BrandSocialAnalyticsCounters;
}

// POST /brands
export interface CreateBrandRequest {
  name: string;
  contactEmail: string;
  handle?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: BrandSocialLinks;
  targetInterests?: string[];
}

export interface BrandResponse {
  id: string;
  name: string;
  handle: string | null;
  logo: string | null;
  coverPhotoUrl: string | null;
  contactEmail: string;
  bio: string | null;
  websiteUrl: string | null;
  socialLinks: BrandSocialLinks | null;
  targetInterests: string[] | null;
  messagingEnabled: boolean;
  status: BrandStatus;
  createdAt: string;
  updatedAt: string;
}

// GET /brands/:id
export interface BrandDetailResponse {
  id: string;
  name: string;
  handle: string | null;
  logo: string | null;
  coverPhotoUrl: string | null;
  contactEmail: string;
  bio: string | null;
  websiteUrl: string | null;
  socialLinks: BrandSocialLinks | null;
  targetInterests: string[] | null;
  messagingEnabled: boolean;
  status: BrandStatus;
  kybStatus: KybStatus;
  kybSubmittedAt: string | null;
  kybApprovedAt: string | null;
  memberCount: number;
  bountyCount: number;
  createdAt: string;
  updatedAt: string;
}

// POST /brands/:brandId/kyb
export interface SubmitKybRequest {
  registeredName: string;
  registrationNumber: string;
  vatNumber?: string;
  country: string;
  contactEmail: string;
  documentsRef?: string;
}

// POST /brands/:brandId/kyb/reject
export interface RejectKybRequest {
  reason: string;
}

// Response returned by submit / approve / reject KYB endpoints
export interface KybActionResponse {
  id: string;
  kybStatus: KybStatus;
  kybSubmittedAt: string | null;
  kybApprovedAt: string | null;
}

// PATCH /brands/:id
export interface UpdateBrandRequest {
  name?: string;
  contactEmail?: string;
  handle?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: BrandSocialLinks;
  targetInterests?: string[];
  messagingEnabled?: boolean;
}

// ─── Public Brand Profile ─────────────

export interface BrandProfileResponse {
  id: string;
  name: string;
  handle: string | null;
  logo: string | null;
  coverPhotoUrl: string | null;
  bio: string | null;
  websiteUrl: string | null;
  socialLinks: BrandSocialLinks | null;
  socialAnalytics: BrandSocialAnalyticsBlob | null;
  targetInterests: string[] | null;
  messagingEnabled: boolean;
  stats: {
    totalBountyAmount: number;
    achievementRate: number;
    bountiesPosted: number;
  };
  createdAt: string;
}

export interface BrandListItem {
  id: string;
  name: string;
  handle: string | null;
  logo: string | null;
  bio: string | null;
  targetInterests: string[] | null;
  bountiesPosted: number;
}

export interface BrandListParams {
  page?: number;
  limit?: number;
  search?: string;
  interest?: string;
}

export interface MyBrandListItem {
  id: string;
  name: string;
  handle: string | null;
  logo: string | null;
  contactEmail: string;
  status: BrandStatus;
  role: BrandMemberRole;
  bountiesPosted: number;
}

// ─── Members ──────────────────────────

// GET /brands/:id/members
export interface BrandMemberUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
}

export interface BrandMemberResponse {
  id: string;
  userId: string;
  user: BrandMemberUserInfo;
  role: BrandMemberRole;
  joinedAt: string;
}

// POST /brands/:id/members
export interface InviteMemberRequest {
  email: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  brandId: string;
  status: string;
  createdAt: string;
}

export interface InviteMemberResponse {
  message: string;
  invitation: InvitationResponse;
}
