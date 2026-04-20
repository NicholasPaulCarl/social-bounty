'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import type { NavSection } from '@/lib/navigation';

interface MainLayoutProps {
  navSections: NavSection[];
  children: React.ReactNode;
}

/**
 * localStorage key for the user's desktop sidebar preference.
 * Persisted so the choice survives both reloads and cross-route-group
 * navigation (every route group — business / admin / participant / brands —
 * mounts its own `MainLayout` instance; without persistence the state
 * would reset on every cross-group hop).
 */
const SIDEBAR_KEY = 'sb:sidebarCollapsed';

export function MainLayout({ navSections, children }: MainLayoutProps) {
  // SSR and first client paint render `collapsed=true` to avoid hydration
  // mismatch warnings. The effect below hydrates the real preference on
  // mount, trading a one-frame flash for correctness.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_KEY);
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    } catch {
      // localStorage unavailable (private browsing / SSR edge) — keep default.
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        // Non-fatal — state still updates in-memory.
      }
      return next;
    });
  }, []);

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
          onToggle={toggleSidebar}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <AppHeader onMenuToggle={toggleSidebar} />

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
