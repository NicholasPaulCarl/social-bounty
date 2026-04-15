'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandsApi } from '@/lib/api/brands';
import { queryKeys } from '@/lib/query-keys';
import type {
  CreateBrandRequest,
  UpdateBrandRequest,
  InviteMemberRequest,
  BrandListParams,
  SubmitKybRequest,
} from '@social-bounty/shared';
import { authApi } from '@/lib/api/auth';

export function useBrand(id: string) {
  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => brandsApi.getById(id),
    enabled: !!id,
  });
}

export function useBrandMembers(id: string) {
  return useQuery({
    queryKey: queryKeys.brands.members(id),
    queryFn: () => brandsApi.listMembers(id),
    enabled: !!id,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, logo }: { data: CreateBrandRequest; logo?: File }) =>
      brandsApi.create(data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

export function useUpdateBrand(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, logo }: { data: UpdateBrandRequest; logo?: File | null }) =>
      brandsApi.update(id, data, logo),
    onSuccess: () => {
      // Invalidate the whole organisations branch so both the detail cache and
      // the public-profile cache (keyed by id *or* handle) stay in sync — a
      // handle change would otherwise leave one of the two entries stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteMemberRequest) => brandsApi.inviteMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => brandsApi.removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.members(orgId) });
    },
  });
}

export function useMyBrands() {
  return useQuery({
    queryKey: queryKeys.brands.mine(),
    queryFn: () => brandsApi.listMine(),
  });
}

export function useBrandPublicProfile(idOrHandle: string) {
  return useQuery({
    queryKey: queryKeys.brands.publicProfile(idOrHandle),
    queryFn: () => brandsApi.getPublicProfile(idOrHandle),
    enabled: !!idOrHandle,
    // Brand profiles change slowly — analytics refresh via login trigger
    // or biweekly cron, not on every page navigation. A 5-minute stale time
    // avoids redundant refetches without hiding recent edits for long.
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBrandsPublicList(params: BrandListParams) {
  return useQuery({
    queryKey: queryKeys.brands.publicList(params),
    queryFn: () => brandsApi.listPublic(params),
  });
}

export function useSubmitKyb(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitKybRequest) => brandsApi.submitKyb(brandId, data),
    onSuccess: () => {
      // Invalidate the whole brands branch so the detail view reflects the new
      // kybStatus / kybSubmittedAt, and any list that surfaces KYB state refreshes.
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

export function useApproveKyb(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => brandsApi.approveKyb(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

export function useRejectKyb(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => brandsApi.rejectKyb(brandId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

export function useSwitchBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (brandId: string) => authApi.switchBrand(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
