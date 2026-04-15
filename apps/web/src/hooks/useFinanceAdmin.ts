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
};

export function useFinanceOverview() {
  return useQuery({
    queryKey: keys.overview,
    queryFn: () => financeAdminApi.getOverview(),
    refetchInterval: 15000,
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

export function useApproveRefundBefore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, note }: { refundId: string; note?: string }) =>
      financeAdminApi.approveRefundBefore(refundId, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.refunds }),
  });
}
