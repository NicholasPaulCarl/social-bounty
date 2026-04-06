'use client';

import { useRef } from 'react';
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-surface-container-lowest/90 backdrop-blur-xl transition-transform duration-300 flex flex-col
          ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          w-60 md:sticky md:top-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-5">
          <Link href="/" className="text-xl font-bold tracking-tighter text-primary font-headline">
            Social Bounty
          </Link>
          <button
            className="md:hidden p-2 rounded-full hover:bg-surface-container transition-colors"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary-container text-primary font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <i className={`${item.icon} text-base`} />
                <span className="font-headline">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto bg-primary text-on-primary text-xs rounded-full px-2 py-0.5 font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User menu footer */}
        {user && (
          <div className="p-3">
            <Menu model={userMenuItems} popup ref={userMenuRef} />
            <button
              className="flex items-center gap-3 w-full text-left rounded-full p-3 hover:bg-surface-container transition-colors"
              onClick={(e) => userMenuRef.current?.toggle(e)}
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">{fullName}</p>
                <p className="text-xs text-on-surface-variant truncate">{roleLabel}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">expand_less</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
