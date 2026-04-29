import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';

const REFRESH_COOKIE_NAME = 'sb_refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type MockResponse = {
  clearCookie: jest.Mock;
  cookie: jest.Mock;
};

describe('AuthController cookie contract', () => {
  let controller: AuthController;
  let authService: {
    refresh: jest.Mock;
    logout: jest.Mock;
  };
  let settingsService: {
    isSignupEnabled: jest.Mock;
  };

  function makeResponse(): MockResponse {
    return {
      clearCookie: jest.fn(),
      cookie: jest.fn(),
    };
  }

  beforeEach(() => {
    authService = {
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    settingsService = {
      isSignupEnabled: jest.fn(),
    };

    controller = new AuthController(authService as any, settingsService as any);
  });

  it('refresh clears both cookie paths and reissues the token on /api/v1/auth', async () => {
    authService.refresh.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'next-refresh-token',
      expiresIn: 900,
    });

    const req = {
      cookies: {
        [REFRESH_COOKIE_NAME]: 'current-refresh-token',
      },
    } as any;
    const res = makeResponse() as any;

    await expect(controller.refresh(req, res)).resolves.toEqual({
      accessToken: 'access-token',
      expiresIn: 900,
    });

    expect(authService.refresh).toHaveBeenCalledWith('current-refresh-token');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      1,
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: '/' }),
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: REFRESH_COOKIE_PATH }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      'next-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: REFRESH_COOKIE_PATH,
        maxAge: REFRESH_COOKIE_MAX_AGE,
      }),
    );
  });

  it('refresh rejects requests without a refresh cookie', async () => {
    const req = { cookies: {} } as any;
    const res = makeResponse() as any;

    await expect(controller.refresh(req, res)).rejects.toThrow(BadRequestException);
    expect(authService.refresh).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('logout revokes the current refresh token and clears both cookie paths', async () => {
    authService.logout.mockResolvedValue(undefined);

    const req = {
      cookies: {
        [REFRESH_COOKIE_NAME]: 'current-refresh-token',
      },
    } as any;
    const res = makeResponse() as any;

    await expect(controller.logout(req, res)).resolves.toEqual({
      message: 'Logged out successfully.',
    });

    expect(authService.logout).toHaveBeenCalledWith('current-refresh-token');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      1,
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: '/' }),
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: REFRESH_COOKIE_PATH }),
    );
  });

  it('logout still clears both cookie paths when there is no refresh token to revoke', async () => {
    const req = { cookies: {} } as any;
    const res = makeResponse() as any;

    await expect(controller.logout(req, res)).resolves.toEqual({
      message: 'Logged out successfully.',
    });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      1,
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: '/' }),
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: REFRESH_COOKIE_PATH }),
    );
  });
});
