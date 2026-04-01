'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialHandlesApi } from '@/lib/api/social-handles';
import { queryKeys } from '@/lib/query-keys';
import type { AddSocialHandleRequest } from '@social-bounty/shared';

export function useMySocialHandles() {
  return useQuery({
    queryKey: queryKeys.socialHandles.mine(),
    queryFn: () => socialHandlesApi.listMyHandles(),
  });
}

export function useAddSocialHandle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddSocialHandleRequest) => socialHandlesApi.addHandle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialHandles.mine() });
    },
  });
}

export function useRemoveSocialHandle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialHandlesApi.removeHandle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialHandles.mine() });
    },
  });
}
