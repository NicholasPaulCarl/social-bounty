'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bountyAccessApi } from '@/lib/api/bounty-access';
import { queryKeys } from '@/lib/query-keys';
import { ApiError } from '@/lib/api/client';
import type { BountyApplicationListParams, CreateBountyApplicationRequest } from '@social-bounty/shared';

// ─── Applications ──────────────────────────────────────────────────────────

export function useMyApplication(bountyId: string) {
  return useQuery({
    queryKey: queryKeys.bountyAccess.myApplication(bountyId),
    queryFn: async () => {
      try {
        return await bountyAccessApi.getMyApplication(bountyId);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!bountyId,
    retry: false,
  });
}

export function useApplyToBounty(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBountyApplicationRequest) => bountyAccessApi.applyToBounty(bountyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bountyAccess.myApplication(bountyId) });
    },
  });
}

export function useWithdrawApplication(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => bountyAccessApi.withdrawApplication(bountyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bountyAccess.myApplication(bountyId) });
    },
  });
}

export function useApplications(bountyId: string, params?: BountyApplicationListParams) {
  return useQuery({
    queryKey: queryKeys.bountyAccess.applications(bountyId, params as Record<string, unknown>),
    queryFn: () => bountyAccessApi.listApplications(bountyId, params),
    enabled: !!bountyId,
  });
}

export function useApproveApplication(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => bountyAccessApi.approveApplication(bountyId, appId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bountyAccess.applications(bountyId),
      });
    },
  });
}

export function useRejectApplication(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, note }: { appId: string; note?: string }) =>
      bountyAccessApi.rejectApplication(bountyId, appId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bountyAccess.applications(bountyId),
      });
    },
  });
}

// ─── Invitations ───────────────────────────────────────────────────────────

export function useMyInvitations() {
  return useQuery({
    queryKey: queryKeys.bountyAccess.myInvitations(),
    queryFn: () => bountyAccessApi.getMyInvitations(),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bountyAccessApi.acceptInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bountyAccess.myInvitations() });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bountyAccessApi.declineInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bountyAccess.myInvitations() });
    },
  });
}
