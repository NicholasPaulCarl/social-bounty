import { OrgStatus, OrgMemberRole, UserStatus } from '../enums';

// ─────────────────────────────────────
// Organisation DTOs
// ─────────────────────────────────────

// POST /organisations
export interface CreateOrganisationRequest {
  name: string;
  contactEmail: string;
}

export interface OrganisationResponse {
  id: string;
  name: string;
  logo: string | null;
  contactEmail: string;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
}

// GET /organisations/:id
export interface OrganisationDetailResponse {
  id: string;
  name: string;
  logo: string | null;
  contactEmail: string;
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
}

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
