import { ApiError } from '@/lib/api/client';

// Must import after mocking
describe('Query Client Configuration', () => {
  it('should not retry on 401 errors', async () => {
    // Dynamically import to get the configured client
    const { queryClient } = await import('@/lib/query-client');
    const retryFn = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retryFn).toBe('function');

    if (typeof retryFn === 'function') {
      const authError = new ApiError(401, 'Unauthorized');
      expect(retryFn(0, authError)).toBe(false);
    }
  });

  it('should not retry on 403 errors', async () => {
    const { queryClient } = await import('@/lib/query-client');
    const retryFn = queryClient.getDefaultOptions().queries?.retry;

    if (typeof retryFn === 'function') {
      const forbiddenError = new ApiError(403, 'Forbidden');
      expect(retryFn(0, forbiddenError)).toBe(false);
    }
  });

  it('should retry once on other errors', async () => {
    const { queryClient } = await import('@/lib/query-client');
    const retryFn = queryClient.getDefaultOptions().queries?.retry;

    if (typeof retryFn === 'function') {
      const serverError = new ApiError(500, 'Server error');
      expect(retryFn(0, serverError)).toBe(true);  // first failure → retry
      expect(retryFn(1, serverError)).toBe(false);  // second failure → stop
    }
  });

  it('should retry once on non-ApiError errors', async () => {
    const { queryClient } = await import('@/lib/query-client');
    const retryFn = queryClient.getDefaultOptions().queries?.retry;

    if (typeof retryFn === 'function') {
      const networkError = new Error('Network error');
      expect(retryFn(0, networkError)).toBe(true);
      expect(retryFn(1, networkError)).toBe(false);
    }
  });

  it('should have refetchOnWindowFocus disabled', async () => {
    const { queryClient } = await import('@/lib/query-client');
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it('should have 1-minute gcTime', async () => {
    const { queryClient } = await import('@/lib/query-client');
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(60_000);
  });

  it('should have 0 mutation retries', async () => {
    const { queryClient } = await import('@/lib/query-client');
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(0);
  });
});
