'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeApi } from '@/lib/api/disputes';
import { queryKeys } from '@/lib/query-keys';
import type {
  CreateDisputeRequest,
  UpdateDisputeRequest,
  SendDisputeMessageRequest,
  AdminResolveDisputeRequest,
  AdminAssignDisputeRequest,
  AdminTransitionDisputeRequest,
  EscalateDisputeRequest,
  WithdrawDisputeRequest,
  DisputeListParams,
  AdminDisputeListParams,
} from '@social-bounty/shared';

export function useMyDisputes(params: DisputeListParams) {
  return useQuery({
    queryKey: queryKeys.disputes.mine(params),
    queryFn: () => disputeApi.listMine(params),
    staleTime: 30_000,
  });
}

export function useOrgDisputes(params: DisputeListParams) {
  return useQuery({
    queryKey: queryKeys.disputes.forOrg(params),
    queryFn: () => disputeApi.listForOrg(params),
    staleTime: 30_000,
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: queryKeys.disputes.detail(id),
    queryFn: () => disputeApi.getById(id),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDisputeRequest) => disputeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.mine({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.forOrg({}) });
    },
  });
}

export function useSubmitDispute(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disputeApi.submitDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.mine({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.forOrg({}) });
    },
  });
}

export function useWithdrawDispute(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: WithdrawDisputeRequest) => disputeApi.withdraw(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.mine({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.forOrg({}) });
    },
  });
}

export function useSendDisputeMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendDisputeMessageRequest) => disputeApi.sendMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
    },
  });
}

export function useEscalateDispute(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EscalateDisputeRequest) => disputeApi.escalate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.mine({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.forOrg({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.adminList({}) });
    },
  });
}

export function useAdminDisputes(params: AdminDisputeListParams) {
  return useQuery({
    queryKey: queryKeys.disputes.adminList(params),
    queryFn: () => disputeApi.adminListAll(params),
    staleTime: 30_000,
  });
}

export function useDisputeStats() {
  return useQuery({
    queryKey: queryKeys.disputes.stats(),
    queryFn: () => disputeApi.adminGetStats(),
    staleTime: 60_000,
  });
}

export function useAdminTransition(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminTransitionDisputeRequest) => disputeApi.adminTransition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.adminList({}) });
    },
  });
}

export function useAdminResolve(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminResolveDisputeRequest) => disputeApi.adminResolve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.adminList({}) });
    },
  });
}

export function useAdminAssignDispute(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminAssignDisputeRequest) => disputeApi.adminAssign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.adminList({}) });
    },
  });
}

// Aliases matching pre-existing page import names
export const useAdminTransitionDispute = useAdminTransition;
export const useAdminResolveDispute = useAdminResolve;
