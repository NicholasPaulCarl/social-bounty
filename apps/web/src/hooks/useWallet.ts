'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/lib/api/wallet';
import { queryKeys } from '@/lib/query-keys';
import type {
  WalletTransactionListParams,
  RequestWithdrawalRequest,
  WithdrawalListParams,
  AdminWalletListParams,
  AdminWalletAdjustRequest,
  AdminWithdrawalListParams,
  AdminCompleteWithdrawalRequest,
  AdminFailWithdrawalRequest,
} from '@social-bounty/shared';

export function useWalletDashboard() {
  return useQuery({
    queryKey: queryKeys.wallet.dashboard(),
    queryFn: () => walletApi.getDashboard(),
    staleTime: 30_000,
  });
}

export function useWalletTransactions(params: WalletTransactionListParams) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: () => walletApi.getTransactions(params),
    staleTime: 30_000,
  });
}

export function useMyWithdrawals(params: WithdrawalListParams) {
  return useQuery({
    queryKey: queryKeys.wallet.withdrawals(params),
    queryFn: () => walletApi.getMyWithdrawals(params),
    staleTime: 30_000,
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestWithdrawalRequest) => walletApi.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
}

export function useCancelWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletApi.cancelWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    },
  });
}

export function useAdminWallets(params: AdminWalletListParams) {
  return useQuery({
    queryKey: queryKeys.wallet.adminList(params),
    queryFn: () => walletApi.adminListWallets(params),
    staleTime: 30_000,
  });
}

export function useAdminWallet(userId: string) {
  return useQuery({
    queryKey: queryKeys.wallet.adminDetail(userId),
    queryFn: () => walletApi.adminGetWallet(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useAdminAdjustWallet(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminWalletAdjustRequest) => walletApi.adminAdjustWallet(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.adminDetail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.adminLists() });
    },
  });
}

export function useAdminWithdrawals(params: AdminWithdrawalListParams) {
  return useQuery({
    queryKey: queryKeys.wallet.adminWithdrawals(params),
    queryFn: () => walletApi.adminListWithdrawals(params),
    staleTime: 30_000,
  });
}

export function useAdminProcessWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletApi.adminProcessWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.adminWithdrawals({}) });
    },
  });
}

export function useAdminCompleteWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminCompleteWithdrawalRequest }) =>
      walletApi.adminCompleteWithdrawal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.adminWithdrawals({}) });
    },
  });
}

export function useAdminFailWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminFailWithdrawalRequest }) =>
      walletApi.adminFailWithdrawal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.adminWithdrawals({}) });
    },
  });
}
