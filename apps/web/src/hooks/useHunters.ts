'use client';

import { useQuery } from '@tanstack/react-query';
import { hunterApi } from '@/lib/api/hunters';
import { queryKeys } from '@/lib/query-keys';
import type { HunterListParams } from '@social-bounty/shared';

export function usePublicProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.hunters.detail(id),
    queryFn: () => hunterApi.getPublicProfile(id),
    enabled: !!id,
  });
}

export function useHunters(params: HunterListParams) {
  return useQuery({
    queryKey: queryKeys.hunters.list(params),
    queryFn: () => hunterApi.listHunters(params),
  });
}
