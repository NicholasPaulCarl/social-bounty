'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organisationApi } from '@/lib/api/organisations';
import { queryKeys } from '@/lib/query-keys';
import type {
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  InviteMemberRequest,
  BrandListParams,
} from '@social-bounty/shared';
import { authApi } from '@/lib/api/auth';

export function useOrganisation(id: string) {
  return useQuery({
    queryKey: queryKeys.organisations.detail(id),
    queryFn: () => organisationApi.getById(id),
    enabled: !!id,
  });
}

export function useOrganisationMembers(id: string) {
  return useQuery({
    queryKey: queryKeys.organisations.members(id),
    queryFn: () => organisationApi.listMembers(id),
    enabled: !!id,
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, logo }: { data: CreateOrganisationRequest; logo?: File }) =>
      organisationApi.create(data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.all });
    },
  });
}

export function useUpdateOrganisation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, logo }: { data: UpdateOrganisationRequest; logo?: File | null }) =>
      organisationApi.update(id, data, logo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.detail(id) });
    },
  });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteMemberRequest) => organisationApi.inviteMember(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => organisationApi.removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organisations.members(orgId) });
    },
  });
}

export function useMyBrands() {
  return useQuery({
    queryKey: queryKeys.organisations.mine(),
    queryFn: () => organisationApi.listMine(),
  });
}

export function useBrandPublicProfile(idOrHandle: string) {
  return useQuery({
    queryKey: queryKeys.organisations.publicProfile(idOrHandle),
    queryFn: () => organisationApi.getPublicProfile(idOrHandle),
    enabled: !!idOrHandle,
  });
}

export function useBrandsPublicList(params: BrandListParams) {
  return useQuery({
    queryKey: queryKeys.organisations.publicList(params),
    queryFn: () => organisationApi.listPublic(params),
  });
}

export function useSwitchOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organisationId: string) => authApi.switchOrganisation(organisationId),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
