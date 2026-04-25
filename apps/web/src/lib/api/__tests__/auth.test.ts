import { authApi, OtpChannel } from '../auth';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Stub apiClient token provider (no auth header needed for these public endpoints)
jest.mock('../client', () => {
  const actual = jest.requireActual('../client') as typeof import('../client');
  actual.configureApiClient(() => null, async () => null);
  return actual;
});

describe('authApi — SMS-OTP surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OtpChannel enum', () => {
    it('should export OtpChannel.EMAIL === "EMAIL"', () => {
      expect(OtpChannel.EMAIL).toBe('EMAIL');
    });

    it('should export OtpChannel.SMS === "SMS"', () => {
      expect(OtpChannel.SMS).toBe('SMS');
    });
  });

  describe('authApi.requestOtp', () => {
    it('sends email + channel when channel is SMS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'sent' }),
      });

      const result = await authApi.requestOtp({ email: 'x@y.com', channel: OtpChannel.SMS });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/auth\/request-otp$/);
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body as string);
      expect(body.email).toBe('x@y.com');
      expect(body.channel).toBe('SMS');

      expect(result).toEqual({ message: 'sent' });
    });

    it('omits channel (or leaves it absent) when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'sent' }),
      });

      await authApi.requestOtp({ email: 'x@y.com' });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.email).toBe('x@y.com');
      // channel must not be serialised as the string "null" or "undefined"
      expect(body.channel).not.toBe('null');
      expect(body.channel).not.toBe('undefined');
      // undefined fields are dropped by JSON.stringify — either absent or truly undefined
      expect(Object.prototype.hasOwnProperty.call(body, 'channel') ? body.channel : undefined).toBeUndefined();
    });
  });

  describe('authApi.switchOtpChannel', () => {
    it('calls /auth/switch-otp-channel with email in body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'sent' }),
      });

      const result = await authApi.switchOtpChannel({ email: 'x@y.com' });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/auth\/switch-otp-channel$/);
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body as string);
      expect(body.email).toBe('x@y.com');

      expect(result).toEqual({ message: 'sent' });
    });

    it('throws ApiError with statusCode 429 on rate-limit response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too Many Requests' }),
      });

      const { ApiError } = jest.requireActual('../client') as typeof import('../client');

      await expect(authApi.switchOtpChannel({ email: 'x@y.com' })).rejects.toMatchObject({
        statusCode: 429,
      });

      let caughtError: unknown;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too Many Requests' }),
      });
      try {
        await authApi.switchOtpChannel({ email: 'x@y.com' });
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError).toBeInstanceOf(ApiError);
    });
  });
});
