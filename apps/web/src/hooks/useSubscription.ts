'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionTier } from '@social-bounty/shared';
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

/**
 * Initiate the live Stitch card-consent upgrade flow.
 *
 * On success, `data.authorizationUrl` is the Stitch-hosted URL the user must
 * redirect to. The subscription query is invalidated so the UI refetches
 * when the user returns (webhook flips the tier to PRO while they're on
 * the hosted page).
 */
export function useInitiateUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetTier: SubscriptionTier = SubscriptionTier.PRO) =>
      subscriptionApi.upgrade(targetTier),
    onSuccess: () => {
      // Invalidate so the subscription view reflects any mandate state
      // the webhook already flipped to AUTHORISED while we were dispatching.
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
