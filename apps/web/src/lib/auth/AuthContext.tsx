'use client';

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserStatus } from '@social-bounty/shared';
import type { LoginResponse, LoginUserResponse, UserRole } from '@social-bounty/shared';
import { authApi } from '@/lib/api/auth';
import { configureApiClient } from '@/lib/api/client';
import { getAccessToken, setAccessToken, clearTokens, decodeToken } from './tokens';

interface AuthContextValue {
  user: LoginUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (response: LoginResponse) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  switchBrand: (brandId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshAccessToken: async () => null,
  switchBrand: async () => {},
});

function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case 'BUSINESS_ADMIN':
      return '/business/dashboard';
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    default:
      return '/bounties';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mutex: only one refresh call at a time. Concurrent callers share the same promise.
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // If a refresh is already in flight, return the existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      try {
        // Refresh token is sent automatically via httpOnly cookie (credentials: 'include')
        const response = await authApi.refresh();
        setAccessToken(response.accessToken);

        const decoded = decodeToken(response.accessToken);
        if (decoded) {
          setUser((prev) =>
            prev
              ? { ...prev, firstName: decoded.firstName || prev.firstName, lastName: decoded.lastName || prev.lastName }
              : null,
          );
        }

        return response.accessToken;
      } catch {
        clearTokens();
        setUser(null);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, []);

  // Configure the API client synchronously on mount and when refreshAccessToken changes
  const refreshFnRef = useRef(refreshAccessToken);
  refreshFnRef.current = refreshAccessToken;

  useEffect(() => {
    configureApiClient(getAccessToken, () => refreshFnRef.current());
  }, []);

  useEffect(() => {
    async function initAuth() {
      // Check if we have a role cookie (indicates a previous session)
      const hasAuthCookie = document.cookie.includes('sb_auth_role=');
      if (hasAuthCookie) {
        // Try to refresh — httpOnly cookie sent automatically
        const token = await refreshAccessToken();
        if (token) {
          const decoded = decodeToken(token);
          if (decoded) {
            setUser({
              id: decoded.sub,
              email: decoded.email,
              firstName: decoded.firstName || '',
              lastName: decoded.lastName || '',
              role: decoded.role,
              status: UserStatus.ACTIVE,
              emailVerified: false,
              // Support tokens issued before the organisationId → brandId rename
              brandId: decoded.brandId ?? (decoded as Record<string, unknown>).organisationId as string | null ?? null,
            });
            document.cookie = `sb_auth_role=${decoded.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          }
        } else {
          clearTokens();
          document.cookie = 'sb_auth_role=; path=/; max-age=0';
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, [refreshAccessToken]);

  useEffect(() => {
    if (user) {
      refreshIntervalRef.current = setInterval(
        () => {
          refreshAccessToken();
        },
        14 * 60 * 1000,
      );
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, refreshAccessToken]);

  const login = useCallback(
    (response: LoginResponse) => {
      setAccessToken(response.accessToken);
      setUser(response.user);

      // Set auth cookie for middleware route protection
      document.cookie = `sb_auth_role=${response.user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      router.push(returnTo || getDashboardUrl(response.user.role));
    },
    [router],
  );

  const switchBrand = useCallback(async (brandId: string) => {
    const response = await authApi.switchBrand(brandId);
    setAccessToken(response.accessToken);
    setUser(response.user);
    document.cookie = `sb_auth_role=${response.user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }, []);

  const logout = useCallback(async () => {
    try {
      // API clears the httpOnly refresh cookie
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      document.cookie = 'sb_auth_role=; path=/; max-age=0';
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshAccessToken,
      switchBrand,
    }),
    [user, isLoading, login, logout, refreshAccessToken, switchBrand],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
