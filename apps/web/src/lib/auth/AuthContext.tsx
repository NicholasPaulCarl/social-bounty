'use client';

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserStatus } from '@social-bounty/shared';
import type { LoginUserResponse, UserRole } from '@social-bounty/shared';
import { authApi } from '@/lib/api/auth';
import { configureApiClient } from '@/lib/api/client';
import { getAccessToken, setAccessToken, clearTokens, decodeToken } from './tokens';

interface AuthContextValue {
  user: LoginUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshAccessToken: async () => null,
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
        const storedRefreshToken = localStorage.getItem('sb_refresh_token');
        if (!storedRefreshToken) return null;

        const response = await authApi.refresh({ refreshToken: storedRefreshToken });
        setAccessToken(response.accessToken);
        localStorage.setItem('sb_refresh_token', response.refreshToken);

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
        localStorage.removeItem('sb_refresh_token');
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
  // Use a ref to ensure the latest refreshAccessToken is always called
  const refreshFnRef = useRef(refreshAccessToken);
  refreshFnRef.current = refreshAccessToken;

  useEffect(() => {
    configureApiClient(getAccessToken, () => refreshFnRef.current());
  }, []);

  useEffect(() => {
    async function initAuth() {
      const storedRefreshToken = localStorage.getItem('sb_refresh_token');
      if (storedRefreshToken) {
        // Use the mutex-protected refreshAccessToken so any concurrent
        // calls (e.g. from useUnreadCount) share the same request
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
              organisationId: decoded.organisationId,
            });
            document.cookie = `sb_auth_role=${decoded.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          }
        } else {
          clearTokens();
          localStorage.removeItem('sb_refresh_token');
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
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      setAccessToken(response.accessToken);
      localStorage.setItem('sb_refresh_token', response.refreshToken);
      setUser(response.user);

      // Set auth cookie for middleware route protection
      document.cookie = `sb_auth_role=${response.user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      router.push(returnTo || getDashboardUrl(response.user.role));
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('sb_refresh_token');
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      localStorage.removeItem('sb_refresh_token');
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
    }),
    [user, isLoading, login, logout, refreshAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
