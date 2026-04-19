'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { getNavSections } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={[UserRole.BUSINESS_ADMIN]}>
      <MainLayout navSections={getNavSections(user?.role || UserRole.BUSINESS_ADMIN)}>
        {children}
      </MainLayout>
    </AuthGuard>
  );
}
