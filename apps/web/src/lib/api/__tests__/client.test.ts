import { ApiError, configureApiClient, apiClient } from '../client';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ApiError', () => {
    it('should carry statusCode and message', () => {
      const err = new ApiError(404, 'Not found');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Not found');
      expect(err.name).toBe('ApiError');
    });

    it('should carry details array', () => {
      const details = [{ field: 'email', message: 'required' }];
      const err = new ApiError(400, 'Validation', details);
      expect(err.details).toEqual(details);
    });
  });

  describe('request handling', () => {
    beforeEach(() => {
      configureApiClient(() => 'test-access-token', async () => null);
    });

    it('should make GET requests with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should append query params for GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/test', { page: 1, search: 'hello' });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('search=hello');
    });

    it('should skip null/undefined/empty query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/test', { page: 1, empty: '', nul: null, undef: undefined });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).not.toContain('empty');
      expect(calledUrl).not.toContain('nul');
      expect(calledUrl).not.toContain('undef');
    });

    it('should make POST requests with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1' }),
      });

      await apiClient.post('/test', { name: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      );
    });

    it('should make PATCH requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ updated: true }),
      });

      await apiClient.patch('/test/1', { name: 'updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ deleted: true }),
      });

      await apiClient.delete('/test/1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should return undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/test/1');
      expect(result).toBeUndefined();
    });

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request', details: [{ field: 'email', message: 'invalid' }] }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
      try {
        await apiClient.get('/test');
      } catch (err) {
        // Need fresh mock for this
      }
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json'); },
      });

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        statusCode: 500,
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('401 retry with token refresh', () => {
    it('should retry request after successful token refresh', async () => {
      const mockRefresh = jest.fn().mockResolvedValue('new-token');
      configureApiClient(() => 'expired-token', mockRefresh);

      // First call returns 401, second succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: 'success' }) });

      const result = await apiClient.get('/protected');
      expect(result).toEqual({ data: 'success' });
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify retry used new token
      const retryHeaders = mockFetch.mock.calls[1][1].headers;
      expect(retryHeaders.Authorization).toBe('Bearer new-token');
    });

    it('should not retry when refresh returns null', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(null);
      configureApiClient(() => 'expired-token', mockRefresh);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiClient.get('/protected')).rejects.toMatchObject({
        statusCode: 401,
      });
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should not include auth header when no token available', async () => {
      configureApiClient(() => null, async () => null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/public');
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('sequential 401 handling', () => {
    it('should handle multiple sequential 401s with independent refresh calls', async () => {
      let refreshCount = 0;
      const mockRefresh = jest.fn().mockImplementation(async () => {
        refreshCount++;
        return `token-${refreshCount}`;
      });
      configureApiClient(() => 'expired', mockRefresh);

      // First request: 401 → refresh → retry succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ a: 1 }) });

      const r1 = await apiClient.get('/a');
      expect(r1).toEqual({ a: 1 });

      // Second request: 401 → refresh → retry succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ b: 2 }) });

      const r2 = await apiClient.get('/b');
      expect(r2).toEqual({ b: 2 });

      expect(mockRefresh).toHaveBeenCalledTimes(2);
    });

    it('should give up after refresh returns null on 401', async () => {
      const mockRefresh = jest.fn().mockResolvedValue(null);
      configureApiClient(() => 'expired', mockRefresh);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Session expired' }),
      });

      await expect(apiClient.get('/protected')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Session expired',
      });
    });
  });
});
