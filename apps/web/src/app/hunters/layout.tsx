'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { getNavItems } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

export default function HuntersLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <MainLayout navItems={getNavItems(user?.role || UserRole.PARTICIPANT)}>
        {children}
      </MainLayout>
    </AuthGuard>
  );
}
