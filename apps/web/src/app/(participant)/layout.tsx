'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/lib/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { getNavSections } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navSections = getNavSections(user?.role || UserRole.PARTICIPANT);

  return (
    <AuthGuard>
      <MainLayout navSections={navSections}>{children}</MainLayout>
    </AuthGuard>
  );
}
