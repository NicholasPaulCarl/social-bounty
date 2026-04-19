'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { getNavSections } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <MainLayout navSections={getNavSections(user?.role || UserRole.PARTICIPANT)}>
        {children}
      </MainLayout>
    </AuthGuard>
  );
}
