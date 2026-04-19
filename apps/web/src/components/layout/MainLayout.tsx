'use client';

import { useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { NavSection } from '@/lib/navigation';

interface MainLayoutProps {
  navSections: NavSection[];
  children: React.ReactNode;
}

export function MainLayout({ navSections, children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-bg-abyss">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-text-primary focus:p-2 focus:rounded focus:shadow-level-2 focus:ring-1 focus:ring-slate-200"
      >
        Skip to main content
      </a>

      <div className="flex">
        <AppSidebar
          navSections={navSections}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <AppHeader onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
