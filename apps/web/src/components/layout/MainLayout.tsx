'use client';

import { useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { NavItem } from '@/lib/navigation';

interface MainLayoutProps {
  navItems: NavItem[];
  children: React.ReactNode;
}

export function MainLayout({ navItems, children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only-focusable"
      >
        Skip to main content
      </a>

      <div className="flex">
        <AppSidebar
          navItems={navItems}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <AppHeader onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

          <main id="main-content" tabIndex={-1} className="flex-1 p-6 md:p-8 max-w-screen-2xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
