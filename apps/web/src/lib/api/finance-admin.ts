import { apiClient } from './client';
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
} from '@social-bounty/shared';

export const financeAdminApi = {
  getOverview: (): Promise<FinanceOverviewResponse> =>
    apiClient.get('/admin/finance/overview'),

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
};
