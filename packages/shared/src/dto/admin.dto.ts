import {
  UserRole,
  UserStatus,
  BrandStatus,
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
} from '../enums';

// ─────────────────────────────────────
// Admin DTOs
// ─────────────────────────────────────

// GET /admin/users (list item)
export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  brand: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// GET /admin/users (query params)
export interface AdminUserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// GET /admin/users/:id
export interface AdminUserDetailResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  brand: { id: string; name: string } | null;
  submissionCount: number;
  approvedSubmissionCount: number;
  createdAt: string;
  updatedAt: string;
}

// PATCH /admin/users/:id/status
export interface AdminUpdateUserStatusRequest {
  status: UserStatus;
  reason: string;
}

export interface AdminUpdateUserStatusResponse {
  id: string;
  status: UserStatus;
  updatedAt: string;
}

// GET /admin/brands (list item)
export interface AdminBrandListItem {
  id: string;
  name: string;
  logo: string | null;
  contactEmail: string;
  status: BrandStatus;
  memberCount: number;
  bountyCount: number;
  createdAt: string;
}

// GET /admin/brands (query params)
export interface AdminBrandListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: BrandStatus;
  search?: string;
}

// POST /admin/brands
export interface AdminCreateBrandRequest {
  name: string;
  contactEmail: string;
  logo?: string | null;
  ownerUserId: string;
}

export interface AdminCreateBrandOwnerInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AdminCreateBrandResponse {
  id: string;
  name: string;
  contactEmail: string;
  logo: string | null;
  status: BrandStatus;
  owner: AdminCreateBrandOwnerInfo;
  createdAt: string;
}

// PATCH /admin/brands/:id/status
export interface AdminUpdateBrandStatusRequest {
  status: BrandStatus;
  reason: string;
}

export interface AdminUpdateBrandStatusResponse {
  id: string;
  status: BrandStatus;
  updatedAt: string;
}

// PATCH /admin/bounties/:id/override
export interface AdminOverrideBountyRequest {
  status: BountyStatus;
  reason: string;
}

export interface AdminOverrideBountyResponse {
  id: string;
  status: BountyStatus;
  updatedAt: string;
}

// PATCH /admin/submissions/:id/override
export interface AdminOverrideSubmissionRequest {
  status: SubmissionStatus;
  reason: string;
}

export interface AdminOverrideSubmissionResponse {
  id: string;
  status: SubmissionStatus;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  updatedAt: string;
}

// GET /admin/audit-logs (list item)
export interface AuditLogActorInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditLogListItem {
  id: string;
  actorId: string;
  actor: AuditLogActorInfo;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

// GET /admin/audit-logs (query params)
export interface AuditLogListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

// GET /admin/audit-logs/:id
export interface AuditLogDetailResponse extends AuditLogListItem {}

// GET /admin/dashboard
export interface AdminDashboardResponse {
  users: {
    total: number;
    active: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  };
  brands: {
    total: number;
    active: number;
    suspended: number;
  };
  bounties: {
    total: number;
    byStatus: Record<BountyStatus, number>;
  };
  submissions: {
    total: number;
    byStatus: Record<SubmissionStatus, number>;
    byPayoutStatus: Record<PayoutStatus, number>;
  };
}

// GET /admin/system-health
export interface ServiceHealthInfo {
  status: 'ok' | 'error';
  responseTime: number;
}

export interface AdminSystemHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealthInfo;
    fileStorage: ServiceHealthInfo;
    email: ServiceHealthInfo;
  };
  memory: {
    used: number;
    total: number;
  };
}

// GET /admin/recent-errors
export interface AdminRecentErrorItem {
  id: string;
  timestamp: string;
  message: string;
  stackTrace: string;
  endpoint: string;
  userId: string | null;
  severity: string;
}

export interface AdminRecentErrorsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// GET/PATCH /admin/settings
export interface AdminSettingsResponse {
  signupsEnabled: boolean;
  submissionsEnabled: boolean;
  updatedAt: string;
  updatedBy: {
    id: string;
    email: string;
  };
}

export interface AdminUpdateSettingsRequest {
  signupsEnabled?: boolean;
  submissionsEnabled?: boolean;
}

// ─────────────────────────────────────
// Finance Admin (Stitch / double-entry ledger)
// Source: md-files/admin-dashboard.md
// ─────────────────────────────────────

// GET /admin/finance/overview
export interface FinanceOverviewResponse {
  killSwitchActive: boolean;
  openExceptions: number;
  balancesByAccount: Record<string, string>; // account name -> integer cents as string
  recentGroups: Array<{
    id: string;
    referenceId: string;
    actionType: string;
    description: string;
    createdAt: string;
    totalCents: string;
  }>;
}

// GET /admin/finance/inbound
export interface InboundFundingRow {
  id: string;
  bountyId: string;
  stitchPaymentLinkId: string;
  stitchPaymentId: string | null;
  hostedUrl: string;
  merchantReference: string;
  amountCents: string;
  currency: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  bounty?: { id: string; title: string; brandId: string };
}

// GET /admin/finance/reserves
export interface ReserveRow {
  bountyId: string;
  title: string;
  brandId: string;
  paymentStatus: string;
  faceValueCents: string;
  reserveBalanceCents: string;
  drift: boolean;
}

// GET /admin/finance/earnings-payouts — totals per hunter-side account
export type EarningsPayoutsResponse = Record<string, string>;

// GET /admin/finance/refunds
export interface AdminRefundRow {
  id: string;
  bountyId: string;
  submissionId: string | null;
  scenario: string;
  state: string;
  amountCents: string;
  reason: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  dualApprovalByUserId: string | null;
  kbEntryId: string | null;
  stitchRefundId: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /admin/finance/exceptions
export interface ExceptionRow {
  id: string;
  category: string;
  signature: string;
  title: string;
  severity: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrences: number;
  resolved: boolean;
  resolvedAt: string | null;
  rootCause: string | null;
  mitigation: string | null;
  kbEntryRef: string | null;
  metadata: Record<string, unknown> | null;
}

// GET /admin/finance/audit-trail
export interface FinanceAuditRow {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
}

// POST /admin/finance/kill-switch
export interface KillSwitchToggleRequest {
  active: boolean;
  reason: string;
}

// POST /admin/finance/overrides
export interface OverrideLeg {
  account: string;
  type: 'DEBIT' | 'CREDIT';
  amountCents: string;
  userId?: string;
  brandId?: string;
  bountyId?: string;
}

export interface OverrideRequest {
  reason: string;
  description: string;
  legs: OverrideLeg[];
}

// POST /admin/finance/reconciliation/run
export interface ReconciliationFinding {
  category: string;
  signature: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: Record<string, unknown>;
}

export interface ReconciliationReport {
  runId: string;
  findings: ReconciliationFinding[];
  killSwitchActivated: boolean;
}

// GET /admin/kb/confidence
export interface ConfidenceScore {
  system: string;
  score: number;
  criticalOpen: number;
  highOpen: number;
  recurrences90d: number;
  failedRecon7d: number;
  // Count of RecurringIssue rows where ineffectiveFix=true for this system.
  // UI renders a red "Ineffective fix(es)" Tag when > 0.
  ineffectiveFixCount: number;
}

// GET /admin/payments-health
export interface PaymentsHealthResponse {
  paymentsProvider: string;
  stitchTokenProbe: {
    ok: boolean;
    latencyMs: number;
    error?: string;
  };
  lastWebhook: {
    receivedAt: string;
    eventType: string;
    status: string;
    externalEventId: string;
  } | null;
  killSwitch: {
    active: boolean;
    reason?: string;
  };
  credsHashes: {
    clientId: string;
    clientSecret: string;
    webhookSecret: string;
  };
}
