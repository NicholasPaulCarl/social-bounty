'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@social-bounty/shared';
import { AuthContext } from './AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/bounties');
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
