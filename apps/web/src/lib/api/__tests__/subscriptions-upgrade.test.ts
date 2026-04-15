/**
 * subscriptionApi.upgrade — live Stitch card-consent upgrade API shim.
 *
 * The backend endpoint is POST /subscription/upgrade with a { targetTier }
 * body and returns { authorizationUrl, mandateId, status }.
 * This test confirms the client wires the body correctly and surfaces the
 * hosted URL back to the caller so the page can `window.location.href = …`.
 */
import { configureApiClient } from '../client';
import { subscriptionApi } from '../subscriptions';
import { SubscriptionTier } from '@social-bounty/shared';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('subscriptionApi.upgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureApiClient(
      () => 'test-access-token',
      async () => null,
    );
  });

  it('POSTs { targetTier: PRO } and returns the hosted Stitch URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        authorizationUrl: 'https://stitch.money/consent/abc',
        mandateId: 'mandate-1',
        status: 'PENDING',
      }),
    });

    const result = await subscriptionApi.upgrade(SubscriptionTier.PRO);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain('/subscription/upgrade');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ targetTier: SubscriptionTier.PRO });
    expect(result.authorizationUrl).toBe('https://stitch.money/consent/abc');
    expect(result.mandateId).toBe('mandate-1');
    expect(result.status).toBe('PENDING');
  });

  it('defaults to PRO when no tier is passed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ authorizationUrl: 'https://x', mandateId: 'm', status: 'PENDING' }),
    });
    await subscriptionApi.upgrade();
    const init = mockFetch.mock.calls[0][1];
    expect(JSON.parse(init.body as string)).toEqual({ targetTier: SubscriptionTier.PRO });
  });

  it('surfaces backend errors through ApiError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Already on PRO tier' }),
    });
    await expect(subscriptionApi.upgrade(SubscriptionTier.PRO)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Already on PRO tier',
    });
  });
});
