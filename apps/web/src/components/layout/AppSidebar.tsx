'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '@/hooks/useAuth';
import type { NavItem } from '@/lib/navigation';

interface AppSidebarProps {
  navItems: NavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ navItems, collapsed = false, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<Menu>(null);

  const initials = user
    ? `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}`
    : '??';

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  const roleLabel = user?.role === 'SUPER_ADMIN'
    ? 'Super Admin'
    : user?.role === 'BUSINESS_ADMIN'
      ? 'Business Admin'
      : 'Participant';

  const userMenuItems: MenuItem[] = [
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        if (user?.role === 'SUPER_ADMIN') {
          router.push('/admin/settings');
        } else if (user?.role === 'BUSINESS_ADMIN') {
          router.push('/business/profile');
        } else {
          router.push('/profile');
        }
      },
    },
    { separator: true },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => logout(),
    },
  ];

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
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-neutral-200 transition-transform duration-300 flex flex-col
          ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          w-60 md:sticky md:top-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <Link href="/" className="text-xl font-bold text-primary-600 font-heading">
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

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'border-l-[3px] border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-l-[3px] border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <i className={`${item.icon} text-base`} />
                <span className="font-heading">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto bg-secondary-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User menu footer */}
        {user && (
          <div className="border-t border-neutral-200 p-4">
            <Menu model={userMenuItems} popup ref={userMenuRef} />
            <button
              className="flex items-center gap-3 w-full text-left rounded-lg p-2 hover:bg-neutral-50 transition-colors"
              onClick={(e) => userMenuRef.current?.toggle(e)}
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">{fullName}</p>
                <p className="text-xs text-neutral-500 truncate">{roleLabel}</p>
              </div>
              <i className="pi pi-chevron-up text-xs text-neutral-400" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
