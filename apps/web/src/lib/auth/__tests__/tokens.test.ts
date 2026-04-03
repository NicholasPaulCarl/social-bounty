import { getAccessToken, setAccessToken, clearTokens, decodeToken, isTokenExpired } from '../tokens';

describe('Token Management', () => {
  beforeEach(() => {
    clearTokens();
  });

  describe('getAccessToken / setAccessToken', () => {
    it('should return null initially', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('should store and retrieve token', () => {
      setAccessToken('test-token');
      expect(getAccessToken()).toBe('test-token');
    });

    it('should overwrite existing token', () => {
      setAccessToken('first');
      setAccessToken('second');
      expect(getAccessToken()).toBe('second');
    });

    it('should accept null to clear', () => {
      setAccessToken('token');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear stored access token', () => {
      setAccessToken('token');
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });

    it('should be safe to call when already empty', () => {
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('decodeToken', () => {
    function makeJwt(payload: Record<string, unknown>): string {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      return `${header}.${body}.fake-signature`;
    }

    it('should decode a valid JWT payload', () => {
      const jwt = makeJwt({ sub: 'user-1', email: 'test@test.com', role: 'PARTICIPANT' });
      const decoded = decodeToken(jwt);
      expect(decoded).toEqual(expect.objectContaining({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'PARTICIPANT',
      }));
    });

    it('should return null for empty string', () => {
      expect(decodeToken('')).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(decodeToken('not-a-jwt')).toBeNull();
    });

    it('should return null for token with invalid base64', () => {
      expect(decodeToken('a.!!!invalid!!!.c')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    function makeJwt(payload: Record<string, unknown>): string {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      return `${header}.${body}.sig`;
    }

    it('should return true for expired token', () => {
      const jwt = makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
      expect(isTokenExpired(jwt)).toBe(true);
    });

    it('should return false for non-expired token', () => {
      const jwt = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
      expect(isTokenExpired(jwt)).toBe(false);
    });

    it('should return true for malformed token', () => {
      expect(isTokenExpired('bad-token')).toBe(true);
    });

    it('should return true when token just expired (boundary)', () => {
      const jwt = makeJwt({ exp: Math.floor(Date.now() / 1000) - 1 });
      expect(isTokenExpired(jwt)).toBe(true);
    });
  });
});
