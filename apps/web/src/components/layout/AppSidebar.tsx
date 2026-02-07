'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/navigation';

interface AppSidebarProps {
  navItems: NavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ navItems, collapsed = false, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-neutral-200 transition-transform duration-300
          ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          w-60 md:sticky md:top-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <Link href="/" className="text-xl font-bold text-primary-600">
            Social Bounty
          </Link>
          <button
            className="md:hidden p-2 rounded hover:bg-neutral-100"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <i className="pi pi-times" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <i className={`${item.icon} text-base`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
