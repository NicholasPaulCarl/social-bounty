'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeAdminApi } from '@/lib/api/finance-admin';
import type {
  KillSwitchToggleRequest,
  OverrideRequest,
} from '@social-bounty/shared';

const keys = {
  overview: ['financeAdmin', 'overview'] as const,
  inbound: (limit: number) => ['financeAdmin', 'inbound', limit] as const,
  reserves: ['financeAdmin', 'reserves'] as const,
  earningsPayouts: ['financeAdmin', 'earningsPayouts'] as const,
  refunds: ['financeAdmin', 'refunds'] as const,
  exceptions: ['financeAdmin', 'exceptions'] as const,
  auditTrail: (limit: number) => ['financeAdmin', 'auditTrail', limit] as const,
  confidence: ['financeAdmin', 'confidence'] as const,
  systemInsights: (system: string) => ['financeAdmin', 'systemInsights', system] as const,
  visibilityAnalytics: (windowHours: number) =>
    ['financeAdmin', 'visibilityAnalytics', windowHours] as const,
  subscriptions: (page: number, limit: number) =>
    ['financeAdmin', 'subscriptions', page, limit] as const,
  payouts: (page: number, limit: number) =>
    ['financeAdmin', 'payouts', page, limit] as const,
  transactionGroup: (id: string) => ['financeAdmin', 'transactionGroup', id] as const,
  visibilityFailures: (page: number, limit: number) =>
    ['financeAdmin', 'visibilityFailures', page, limit] as const,
  visibilityHistory: (submissionId: string) =>
    ['financeAdmin', 'visibilityHistory', submissionId] as const,
};

export function useFinanceOverview() {
  return useQuery({
    queryKey: keys.overview,
    queryFn: () => financeAdminApi.getOverview(),
    refetchInterval: 15000,
  });
}

export function useTransactionGroup(id: string) {
  return useQuery({
    queryKey: keys.transactionGroup(id),
    queryFn: () => financeAdminApi.getTransactionGroup(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useInboundFunding(limit = 50) {
  return useQuery({ queryKey: keys.inbound(limit), queryFn: () => financeAdminApi.getInbound(limit) });
}

export function useReserves() {
  return useQuery({ queryKey: keys.reserves, queryFn: () => financeAdminApi.getReserves() });
}

export function useEarningsPayouts() {
  return useQuery({
    queryKey: keys.earningsPayouts,
    queryFn: () => financeAdminApi.getEarningsPayouts(),
  });
}

export function useAdminRefunds() {
  return useQuery({ queryKey: keys.refunds, queryFn: () => financeAdminApi.getRefunds() });
}

export function useFinanceExceptions() {
  return useQuery({
    queryKey: keys.exceptions,
    queryFn: () => financeAdminApi.getExceptions(),
    refetchInterval: 30000,
  });
}

export function useFinanceAuditTrail(limit = 100) {
  return useQuery({ queryKey: keys.auditTrail(limit), queryFn: () => financeAdminApi.getAuditTrail(limit) });
}

export function useConfidenceScores() {
  return useQuery({ queryKey: keys.confidence, queryFn: () => financeAdminApi.getConfidenceScores() });
}

export function useSystemInsights(system: string) {
  return useQuery({
    queryKey: keys.systemInsights(system),
    queryFn: () => financeAdminApi.getSystemInsights(system),
    enabled: Boolean(system),
  });
}

/**
 * Phase 3D — visibility-failure analytics. Polls every 30s so a failure-rate
 * spike caused by an Apify outage shows up on the Insights page within one
 * tick (matching the existing exceptions cadence).
 */
export function useAdminVisibilityAnalytics({ windowHours = 24 }: { windowHours?: number } = {}) {
  return useQuery({
    queryKey: keys.visibilityAnalytics(windowHours),
    queryFn: () => financeAdminApi.getVisibilityAnalytics(windowHours),
    refetchInterval: 30000,
  });
}

export function useToggleKillSwitch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: KillSwitchToggleRequest) => financeAdminApi.toggleKillSwitch(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.overview }),
  });
}

export function usePostOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OverrideRequest) => financeAdminApi.postOverride(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.overview });
      qc.invalidateQueries({ queryKey: keys.auditTrail(100) });
    },
  });
}

export function useRunReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => financeAdminApi.runReconciliation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.overview });
      qc.invalidateQueries({ queryKey: keys.exceptions });
    },
  });
}

export function useFinanceSubscriptions(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 25;
  return useQuery({
    queryKey: keys.subscriptions(page, limit),
    queryFn: () => financeAdminApi.listSubscriptions({ page, limit }),
  });
}

/**
 * Platform-wide payout listing (SUPER_ADMIN). Paginated, newest-first.
 */
export function usePayoutsAdmin(page = 1, limit = 25) {
  return useQuery({
    queryKey: keys.payouts(page, limit),
    queryFn: () => financeAdminApi.listPayouts(page, limit),
  });
}

/**
 * POST /payouts/:id/retry — SUPER_ADMIN reset of retry clock + attempts.
 * Invalidates all payout list pages so the row reflects its new state.
 */
export function useRetryPayoutAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: string) => financeAdminApi.retryPayout(payoutId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['financeAdmin', 'payouts'] }),
  });
}

export function useApproveRefundBefore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, note }: { refundId: string; note?: string }) =>
      financeAdminApi.approveRefundBefore(refundId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.refunds }),
  });
}

/**
 * Phase 3B: paginated list of submissions with one or more consecutive
 * post-visibility re-check failures. Powers the
 * /admin/finance/visibility-failures page (ADR 0010).
 */
export function useAdminVisibilityFailures(
  params?: { page?: number; limit?: number },
) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 25;
  return useQuery({
    queryKey: keys.visibilityFailures(page, limit),
    queryFn: () => financeAdminApi.listVisibilityFailures(page, limit),
    refetchInterval: 30000,
  });
}

/**
 * Per-submission visibility re-check history (newest-first). Drives the
 * inline drill-down on the visibility-failures page and the
 * "Visibility check status" panel on the admin submission detail page.
 */
export function useAdminVisibilityHistory(submissionId: string | null) {
  return useQuery({
    queryKey: keys.visibilityHistory(submissionId ?? ''),
    queryFn: () => financeAdminApi.getVisibilityFailureHistory(submissionId!),
    enabled: Boolean(submissionId),
  });
}
