'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bountyApi } from '@/lib/api/bounties';
import { queryKeys } from '@/lib/query-keys';
import type { BountyListParams, CreateBountyRequest, UpdateBountyRequest, BountyStatus } from '@social-bounty/shared';

export function useBounties(filters: BountyListParams) {
  return useQuery({
    queryKey: queryKeys.bounties.list(filters),
    queryFn: () => bountyApi.list(filters),
  });
}

export function useBounty(id: string) {
  return useQuery({
    queryKey: queryKeys.bounties.detail(id),
    queryFn: () => bountyApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBounty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBountyRequest) => bountyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
}

export function useUpdateBounty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBountyRequest) => bountyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
}

export function useUpdateBountyStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: BountyStatus) => bountyApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
}

export function useDeleteBounty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bountyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
}

export function useUploadBrandAssets(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => bountyApi.uploadBrandAssets(bountyId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.detail(bountyId) });
    },
  });
}

export function useDeleteBrandAsset(bountyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => bountyApi.deleteBrandAsset(bountyId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.detail(bountyId) });
    },
  });
}
