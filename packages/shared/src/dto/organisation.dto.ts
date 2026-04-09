import { OrgStatus, OrgMemberRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// Organisation DTOs
// ─────────────────────────────────────

export interface BrandSocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  x?: string;
  website?: string;
}

// POST /organisations
export interface CreateOrganisationRequest {
  name: string;
  contactEmail: string;
  handle?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: BrandSocialLinks;
  targetInterests?: string[];
}

export interface OrganisationResponse {
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
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
}

// GET /organisations/:id
export interface OrganisationDetailResponse {
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
  status: OrgStatus;
  memberCount: number;
  bountyCount: number;
  createdAt: string;
  updatedAt: string;
}

// PATCH /organisations/:id
export interface UpdateOrganisationRequest {
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
  status: OrgStatus;
  role: OrgMemberRole;
  bountiesPosted: number;
}

// ─── Members ──────────────────────────

// GET /organisations/:id/members
export interface OrgMemberUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
}

export interface OrgMemberResponse {
  id: string;
  userId: string;
  user: OrgMemberUserInfo;
  role: OrgMemberRole;
  joinedAt: string;
}

// POST /organisations/:id/members
export interface InviteMemberRequest {
  email: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  organisationId: string;
  status: string;
  createdAt: string;
}

export interface InviteMemberResponse {
  message: string;
  invitation: InvitationResponse;
}
