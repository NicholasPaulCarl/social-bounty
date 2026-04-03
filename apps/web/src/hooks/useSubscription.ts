'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionApi } from '@/lib/api/subscriptions';

const subscriptionKeys = {
  all: ['subscription'] as const,
  detail: () => [...subscriptionKeys.all, 'detail'] as const,
  payments: (params?: Record<string, unknown>) => [...subscriptionKeys.all, 'payments', params] as const,
};

export function useSubscription() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: subscriptionKeys.detail(),
    queryFn: () => subscriptionApi.getSubscription(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.subscribe(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.reactivate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useSubscriptionPayments(params?: { page?: number; limit?: number }) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: subscriptionKeys.payments(params),
    queryFn: () => subscriptionApi.getPayments(params),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}
