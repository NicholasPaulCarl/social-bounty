'use client';

import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/api/business';
import { queryKeys } from '@/lib/query-keys';

export function useBusinessDashboard() {
  return useQuery({
    queryKey: queryKeys.business.dashboard,
    queryFn: () => businessApi.getDashboard(),
  });
}
