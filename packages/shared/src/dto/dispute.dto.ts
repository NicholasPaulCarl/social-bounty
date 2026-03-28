import {
  DisputeStatus,
  DisputeCategory,
  DisputeReason,
  DisputeResolution,
  DisputeMessageType,
  EvidenceType,
  UserRole,
} from '../enums';
import type { PaginationMeta } from '../common';

// ─────────────────────────────────────
// Request Types
// ─────────────────────────────────────

export interface CreateDisputeRequest {
  submissionId: string;
  category: DisputeCategory;
  reason: DisputeReason;
  description: string;
  desiredOutcome: string;
}

export interface UpdateDisputeRequest {
  description?: string;
  desiredOutcome?: string;
}

export interface SendDisputeMessageRequest {
  content: string;
  isInternal?: boolean;
}

export interface AdminResolveDisputeRequest {
  resolutionType: DisputeResolution;
  resolutionSummary: string;
}

export interface AdminAssignDisputeRequest {
  assignedToUserId: string;
}

export interface AdminTransitionDisputeRequest {
  status: DisputeStatus;
  note?: string;
}

export interface EscalateDisputeRequest {
  reason: string;
}

export interface WithdrawDisputeRequest {
  reason?: string;
}

// ─────────────────────────────────────
// Embedded Types
// ─────────────────────────────────────

export interface DisputeUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface DisputeSubmissionInfo {
  id: string;
  bountyId: string;
  bountyTitle: string;
  status: string;
  payoutStatus: string;
}

// ─────────────────────────────────────
// Response Types
// ─────────────────────────────────────

export interface DisputeListItem {
  id: string;
  disputeNumber: string;
  category: DisputeCategory;
  reason: DisputeReason;
  status: DisputeStatus;
  description: string;
  submissionId: string;
  bountyTitle: string;
  openedBy: { id: string; firstName: string; lastName: string };
  organisationName: string;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeDetailResponse {
  id: string;
  disputeNumber: string;
  category: DisputeCategory;
  reason: DisputeReason;
  status: DisputeStatus;
  description: string;
  desiredOutcome: string;
  submission: DisputeSubmissionInfo;
  openedBy: DisputeUserInfo;
  openedByRole: UserRole;
  organisationId: string;
  organisationName: string;
  assignedTo: DisputeUserInfo | null;
  resolutionType: DisputeResolution | null;
  resolutionSummary: string | null;
  resolvedBy: DisputeUserInfo | null;
  resolvedAt: string | null;
  escalatedAt: string | null;
  responseDeadline: string | null;
  relatedDisputeId: string | null;
  messages: DisputeMessageResponse[];
  evidence: DisputeEvidenceResponse[];
  statusHistory: DisputeStatusHistoryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface DisputeMessageResponse {
  id: string;
  disputeId: string;
  authorUserId: string;
  authorRole: UserRole;
  authorName: string;
  messageType: DisputeMessageType;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface DisputeEvidenceResponse {
  id: string;
  disputeId: string;
  evidenceType: EvidenceType;
  fileUrl: string | null;
  url: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  description: string | null;
  uploadedBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface DisputeStatusHistoryResponse {
  id: string;
  fromStatus: DisputeStatus | null;
  toStatus: DisputeStatus;
  changedBy: { id: string; firstName: string; lastName: string; role: UserRole };
  note: string | null;
  createdAt: string;
}

// ─────────────────────────────────────
// List Params
// ─────────────────────────────────────

export interface DisputeListParams {
  page?: number;
  limit?: number;
  status?: DisputeStatus;
  category?: DisputeCategory;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminDisputeListParams extends DisputeListParams {
  assignedToUserId?: string;
  openedByUserId?: string;
  organisationId?: string;
  search?: string;
}

// ─────────────────────────────────────
// Stats
// ─────────────────────────────────────

export interface DisputeStatsResponse {
  total: number;
  open: number;
  underReview: number;
  awaitingResponse: number;
  escalated: number;
  resolved: number;
  closed: number;
  avgResolutionDays: number | null;
}

// ─────────────────────────────────────
// Paginated Response
// ─────────────────────────────────────

export interface PaginatedDisputeListResponse {
  data: DisputeListItem[];
  meta: PaginationMeta;
}
