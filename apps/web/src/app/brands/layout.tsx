'use client';

import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { getNavItems } from '@/lib/navigation';
import { UserRole } from '@social-bounty/shared';

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  // Authenticated users get the full app shell with sidebar navigation
  if (isAuthenticated && user) {
    return (
      <MainLayout navItems={getNavItems(user.role || UserRole.PARTICIPANT)}>
        {children}
      </MainLayout>
    );
  }

  // Unauthenticated users get a simple centered layout (marketing nav is in the parent)
  return (
    <div className="min-h-screen bg-bg-abyss">
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
