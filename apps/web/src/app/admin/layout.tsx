'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { getNavItems } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
      <MainLayout navItems={getNavItems(user?.role || UserRole.SUPER_ADMIN)}>
        {children}
      </MainLayout>
    </AuthGuard>
  );
}
