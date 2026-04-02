import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 60_000, // 1 minute — prevents memory bloat from paginated admin data
      retry: (failureCount, error) => {
        // Never retry auth failures — the refresh mutex already handled it
        if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
