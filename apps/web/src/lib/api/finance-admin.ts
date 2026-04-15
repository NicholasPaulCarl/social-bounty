import { apiClient } from './client';
import { getAccessToken } from '../auth/tokens';
import type {
  FinanceOverviewResponse,
  InboundFundingRow,
  ReserveRow,
  EarningsPayoutsResponse,
  AdminRefundRow,
  ExceptionRow,
  FinanceAuditRow,
  KillSwitchToggleRequest,
  OverrideRequest,
  ReconciliationReport,
  ConfidenceScore,
  KbSystemIssueRow,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionEntityType,
} from '@social-bounty/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type FinanceExportModule = 'inbound' | 'reserves' | 'refunds' | 'ledger';

export interface FinanceSubscriptionRow {
  id: string;
  userId: string | null;
  brandId: string | null;
  entityType: SubscriptionEntityType;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  priceAmount: number;
  currency: string;
  currentPeriodEnd: string | null;
  gracePeriodEndsAt: string | null;
  failedPaymentCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

export interface FinanceSubscriptionListResponse {
  data: FinanceSubscriptionRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// TODO: replace with `TransactionGroupDetail` from '@social-bounty/shared'
// once backend-8 lands it. Shapes mirror the backend's expected response.
export interface TransactionGroupDetailEntry {
  id: string;
  account: string;
  type: 'DEBIT' | 'CREDIT';
  amountCents: string;
  externalReference: string | null;
  userId: string | null;
  brandId: string | null;
  bountyId: string | null;
  submissionId: string | null;
  createdAt: string;
}

export interface TransactionGroupDetailGroup {
  id: string;
  referenceId: string;
  actionType: string;
  description: string | null;
  createdAt: string;
  totalCents?: string;
}

export interface TransactionGroupDetailAuditLog {
  id: string;
  actorId: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  reason: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  createdAt: string;
}

export interface TransactionGroupDetailResponse {
  group: TransactionGroupDetailGroup;
  entries: TransactionGroupDetailEntry[];
  auditLog: TransactionGroupDetailAuditLog[];
}

export const financeAdminApi = {
  getOverview: (): Promise<FinanceOverviewResponse> =>
    apiClient.get('/admin/finance/overview'),

  getTransactionGroup: (id: string): Promise<TransactionGroupDetailResponse> =>
    apiClient.get(`/admin/finance/groups/${encodeURIComponent(id)}`),

  getInbound: (limit = 50): Promise<InboundFundingRow[]> =>
    apiClient.get('/admin/finance/inbound', { limit: String(limit) }),

  getReserves: (): Promise<ReserveRow[]> => apiClient.get('/admin/finance/reserves'),

  getEarningsPayouts: (): Promise<EarningsPayoutsResponse> =>
    apiClient.get('/admin/finance/earnings-payouts'),

  getRefunds: (): Promise<AdminRefundRow[]> => apiClient.get('/admin/finance/refunds'),

  getExceptions: (): Promise<ExceptionRow[]> => apiClient.get('/admin/finance/exceptions'),

  getAuditTrail: (limit = 100): Promise<FinanceAuditRow[]> =>
    apiClient.get('/admin/finance/audit-trail', { limit: String(limit) }),

  toggleKillSwitch: (body: KillSwitchToggleRequest): Promise<{ active: boolean }> =>
    apiClient.post('/admin/finance/kill-switch', body),

  postOverride: (body: OverrideRequest): Promise<{ transactionGroupId: string }> =>
    apiClient.post('/admin/finance/overrides', body),

  runReconciliation: (): Promise<ReconciliationReport> =>
    apiClient.post('/admin/finance/reconciliation/run'),

  listReconciliationExceptions: (): Promise<ExceptionRow[]> =>
    apiClient.get('/admin/finance/reconciliation/exceptions'),

  approveRefundBefore: (
    refundId: string,
    note?: string,
  ): Promise<{ id: string; state: string }> =>
    apiClient.post(`/refunds/${refundId}/approve-before`, note ? { note } : {}),

  getConfidenceScores: (): Promise<ConfidenceScore[]> =>
    apiClient.get('/admin/kb/confidence'),

  getSystemInsights: (system: string): Promise<KbSystemIssueRow[]> =>
    apiClient.get(`/admin/kb/insights/${encodeURIComponent(system)}`),

  listSubscriptions: (params?: {
    page?: number;
    limit?: number;
  }): Promise<FinanceSubscriptionListResponse> =>
    apiClient.get('/admin/finance/subscriptions', params as Record<string, unknown> | undefined),

  /**
   * Download a CSV export as a Blob. We hand-roll fetch here (not apiClient)
   * because apiClient auto-parses JSON and we need the raw Response body
   * to stream into a Blob. Auth mirrors the shared client: bearer token from
   * the in-memory store + credentials:'include' for cookie fallbacks.
   */
  async downloadExport(
    module: FinanceExportModule,
    params?: Record<string, string | number>,
  ): Promise<Blob> {
    const qs = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    const url = `${API_BASE_URL}/admin/finance/exports/${module}.csv${qs}`;
    const token = getAccessToken();
    const headers: Record<string, string> = { Accept: 'text/csv' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    if (!response.ok) {
      let message = 'Failed to download export';
      try {
        const body = await response.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore, keep default message
      }
      throw new Error(message);
    }
    return response.blob();
  },
};
