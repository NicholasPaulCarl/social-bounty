import { BrandStatus, BrandMemberRole, KybStatus, UserStatus } from '../enums';

// ─────────────────────────────────────
// KYB-related shared types
// ─────────────────────────────────────

// Mirrors the Prisma `KybOrgType` enum + TradeSafe's `OrganizationType`. Kept
// as a TS string-union (not an enum) so the enum stays single-source-of-truth
// in `packages/prisma/schema.prisma` — this just gives the API DTOs a
// well-typed shape without a Prisma import in shared types.
export type KybOrgType =
  | 'PRIVATE'
  | 'PUBLIC'
  | 'NGO'
  | 'GOVERNMENT'
  | 'SOLE_PROPRIETOR';

// Mirrors Prisma `KybDocumentType`. The South African company-registration
// document set TradeSafe expects during go-live (see `docs/deployment/
// tradesafe-live-readiness.md`).
export type KybDocumentType =
  | 'COR_14_3'
  | 'COR_15_1'
  | 'BANK_PROOF'
  | 'ID_DOC'
  | 'LETTER_OF_AUTHORITY'
  | 'OTHER';

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
  // KYB-persisted fields (Wave 1, R24 pre-launch). All nullable — the brand
  // form repopulates from these when re-opening after submit/reject. Frontend
  // agents (1B/1C) consume this DTO to render the KYB review screens.
  kybRegisteredName: string | null;
  kybTradeName: string | null;
  kybRegistrationNumber: string | null;
  kybVatNumber: string | null;
  kybTaxNumber: string | null;
  kybCountry: string | null;
  kybContactEmail: string | null;
  kybOrgType: KybOrgType | null;
  kybRejectionReason: string | null;
  kybRejectedAt: string | null;
  // Count of uploaded KYB documents (used to show a badge on the brand profile
  // and to gate the "you must upload at least one document" hint on the form).
  kybDocumentCount: number;
  // Set after the post-approve TradeSafe `tokenCreate` lands. Useful to show
  // an admin-only "TradeSafe linked" badge; frontend never inspects the value.
  tradeSafeTokenId: string | null;
  memberCount: number;
  bountyCount: number;
  createdAt: string;
  updatedAt: string;
}

// POST /brands/:brandId/kyb
//
// Wave 1 extends the prior submission shape. `documentsRef` is retained for
// backward-compat with the previously-deployed mobile clients but is no
// longer used by the service — KYB documents now live in the dedicated
// `kyb_documents` table via the documents endpoints.
export interface SubmitKybRequest {
  registeredName: string;
  /** Optional trade name (DBA / "trading as"). */
  tradeName?: string;
  registrationNumber: string;
  vatNumber?: string;
  /** Required for SA tax compliance + TradeSafe `tokenCreate`. */
  taxNumber?: string;
  country: string;
  contactEmail: string;
  /** Required since Wave 1 — TradeSafe `tokenCreate` rejects org parties without it. */
  orgType: KybOrgType;
  /** @deprecated since Wave 1 — kept for backward-compat with older clients. */
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

// ─── KYB documents (Wave 1) ──────────

// POST /brands/:brandId/kyb/documents (multipart/form-data)
//
// The actual file payload travels in the `file` form field; this type
// describes the JSON-encoded sibling fields sent alongside.
export interface UploadKybDocumentRequest {
  documentType: KybDocumentType;
  /** ISO 8601 string. Optional — bank letters expire, ID docs expire, CIPC docs effectively don't. */
  expiresAt?: string;
  /** Free-text annotation surface for ops. 500 char cap. */
  notes?: string;
}

export interface KybDocumentResponse {
  id: string;
  documentType: KybDocumentType;
  fileName: string;
  /** Resolves to a streaming/download URL. */
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string | null;
  notes: string | null;
}

// GET /admin/brands/:brandId/kyb/review (SUPER_ADMIN only)
//
// Full review payload — everything the admin needs to make an
// approve/reject decision in one round-trip.
export interface BrandKybSubmissionView {
  brandId: string;
  brandName: string;
  brandHandle: string | null;
  kybStatus: KybStatus;
  kybSubmittedAt: string | null;
  kybApprovedAt: string | null;
  kybRejectedAt: string | null;
  kybRejectionReason: string | null;
  // Submitted fields (mirror Brand row).
  registeredName: string | null;
  tradeName: string | null;
  registrationNumber: string | null;
  vatNumber: string | null;
  taxNumber: string | null;
  country: string | null;
  contactEmail: string | null;
  orgType: KybOrgType | null;
  // Uploaded evidence.
  documents: KybDocumentResponse[];
  // KYB-related audit log slice (last 50). Filtered server-side by
  // `entityType='Brand' AND entityId=brandId AND action LIKE 'kyb.%'`.
  recentAuditLog: BrandKybAuditLogEntry[];
  // Once set, the post-approve TradeSafe link is alive.
  tradeSafeTokenId: string | null;
}

export interface BrandKybAuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}

// GET /admin/brands/kyb (SUPER_ADMIN only) — paginated review queue
export interface AdminKybQueueItem {
  brandId: string;
  brandName: string;
  brandHandle: string | null;
  kybStatus: KybStatus;
  kybSubmittedAt: string | null;
  registeredName: string | null;
  registrationNumber: string | null;
  country: string | null;
  documentCount: number;
}

export interface AdminKybQueueResponse {
  data: AdminKybQueueItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
