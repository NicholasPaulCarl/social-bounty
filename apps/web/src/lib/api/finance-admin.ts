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
  AdminPayoutListResponse,
  TransactionGroupDetail,
  TransactionGroupDetailEntry,
  AdminVisibilityFailureListResponse,
  VisibilityHistoryRow,
  VisibilityAnalyticsResponse,
} from '@social-bounty/shared';

// Re-export the shared entry type so existing `@/lib/api/finance-admin` imports
// (e.g. the detail page) keep working without touching every call site.
export type { TransactionGroupDetailEntry };

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

export const financeAdminApi = {
  getOverview: (): Promise<FinanceOverviewResponse> =>
    apiClient.get('/admin/finance/overview'),

  getTransactionGroup: (id: string): Promise<TransactionGroupDetail> =>
    apiClient.get(`/admin/finance/groups/${encodeURIComponent(id)}`),

  getInbound: (limit = 50): Promise<InboundFundingRow[]> =>
    apiClient.get('/admin/finance/inbound', { limit: String(limit) }),

  getReserves: (): Promise<ReserveRow[]> => apiClient.get('/admin/finance/reserves'),

  getEarningsPayouts: (): Promise<EarningsPayoutsResponse> =>
    apiClient.get('/admin/finance/earnings-payouts'),

  getRefunds: (): Promise<AdminRefundRow[]> => apiClient.get('/admin/finance/refunds'),

  listPayouts: (page = 1, limit = 25): Promise<AdminPayoutListResponse> =>
    apiClient.get('/admin/finance/payouts', {
      page: String(page),
      limit: String(limit),
    }),

  retryPayout: (payoutId: string): Promise<{ retried: boolean }> =>
    apiClient.post(`/payouts/${encodeURIComponent(payoutId)}/retry`),

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

  /**
   * Phase 3D — visibility-failure analytics. Default 24h window; the backend
   * clamps to [1h, 720h] and falls back to 24h on bad input. Polled by the
   * Insights page so failure-rate spikes show up within a refetch interval.
   */
  getVisibilityAnalytics: (windowHours = 24): Promise<VisibilityAnalyticsResponse> =>
    apiClient.get('/admin/finance/visibility-analytics', {
      windowHours: String(windowHours),
    }),

  listSubscriptions: (params?: {
    page?: number;
    limit?: number;
  }): Promise<FinanceSubscriptionListResponse> =>
    apiClient.get('/admin/finance/subscriptions', params as Record<string, unknown> | undefined),

  // Phase 3B: admin visibility-failure surface (ADR 0010).
  listVisibilityFailures: (
    page = 1,
    limit = 25,
  ): Promise<AdminVisibilityFailureListResponse> =>
    apiClient.get('/admin/finance/visibility-failures', {
      page: String(page),
      limit: String(limit),
    }),

  getVisibilityFailureHistory: (
    submissionId: string,
  ): Promise<VisibilityHistoryRow[]> =>
    apiClient.get(
      `/admin/finance/visibility-failures/${encodeURIComponent(submissionId)}/history`,
    ),

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
