import { BountyApplicationStatus, BountyInvitationStatus, SocialPlatform } from '../enums';

// ─── Applications ────────────────────

export interface CreateBountyApplicationRequest {
  message?: string;
}

export interface ReviewApplicationRequest {
  status: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface BountyApplicationResponse {
  id: string;
  bountyId: string;
  userId: string;
  userName: string;
  userProfilePicture: string | null;
  status: BountyApplicationStatus;
  message: string | null;
  reviewNote: string | null;
  appliedAt: string;
  reviewedAt: string | null;
}

export interface BountyApplicationListParams {
  page?: number;
  limit?: number;
  status?: BountyApplicationStatus;
}

// ─── Invitations ─────────────────────

export interface CreateBountyInvitationsRequest {
  invitations: Array<{ platform: SocialPlatform; handle: string }>;
}

export interface BountyInvitationResponse {
  id: string;
  bountyId: string;
  socialPlatform: SocialPlatform;
  socialHandle: string;
  userId: string | null;
  userName: string | null;
  status: BountyInvitationStatus;
  invitedAt: string;
  respondedAt: string | null;
}

// ─── Social Handles ──────────────────

export interface AddSocialHandleRequest {
  platform: SocialPlatform;
  handle: string;
}

export interface SocialHandleResponse {
  id: string;
  platform: SocialPlatform;
  handle: string;
  normalizedHandle: string;
  profileUrl: string | null;
  profileImageUrl: string | null;
  displayName: string | null;
  followerCount: number | null;
  status: string;
  lastValidatedAt: string | null;
}
