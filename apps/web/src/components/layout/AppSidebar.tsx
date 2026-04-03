'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useInbox';
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
  const { data: unread } = useUnreadCount();
  const inboxUnreadCount = unread?.total ?? 0;

  const initials = user
    ? `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}`
    : '??';

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  const roleLabel = user?.role === 'SUPER_ADMIN'
    ? 'Super Admin'
    : user?.role === 'BUSINESS_ADMIN'
      ? 'Business Admin'
      : 'Hunter';

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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 transition-transform duration-300 flex flex-col
          ${collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          w-60 md:sticky md:top-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
          <Link
            href="/"
            className="text-xl font-bold font-heading text-pink-600"
          >
            Social Bounty
          </Link>
          <button
            className="md:hidden p-3 min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasChildren = item.children && item.children.length > 0;
            const showChildren = hasChildren && isActive;
            const isInbox = item.href === '/inbox';
            const badgeCount = isInbox ? inboxUnreadCount : (item.badge ?? 0);

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'text-accent-cyan bg-accent-cyan/10'
                        : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
                    }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <i className={`${item.icon} text-base`} />
                  <span className="font-heading">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto bg-accent-rose/20 text-accent-rose text-xs rounded-full px-2 py-0.5 font-medium">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                  {hasChildren && (
                    <i className={`pi ${showChildren ? 'pi-chevron-down' : 'pi-chevron-right'} text-xs ml-auto text-text-muted`} />
                  )}
                </Link>

                {/* Sub-navigation */}
                {showChildren && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                    {item.children!.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium text-text-muted hover:text-accent-cyan hover:bg-slate-100 transition-colors"
                      >
                        <i className={`${child.icon} text-[6px]`} />
                        <span>{child.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User menu footer */}
        {user && (
          <div className="border-t border-slate-200 p-3">
            <Menu model={userMenuItems} popup ref={userMenuRef} />
            <button
              className="flex items-center gap-3 w-full text-left rounded-lg p-2 hover:bg-slate-100 transition-colors"
              onClick={(e) => userMenuRef.current?.toggle(e)}
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-sm font-semibold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{fullName}</p>
                <p className="text-xs text-text-muted truncate">{roleLabel}</p>
              </div>
              <i className="pi pi-chevron-up text-xs text-text-muted" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
