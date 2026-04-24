'use client';

import { useQuery } from '@tanstack/react-query';
import { payoutsApi } from '@/lib/api/payouts';

/**
 * Fetches the authenticated hunter's payout history (newest first).
 * Route is RBAC-gated to PARTICIPANT on the server.
 */
export function useMyPayouts() {
  return useQuery({
    queryKey: ['payouts', 'mine'] as const,
    queryFn: () => payoutsApi.listMine(),
  });
}
