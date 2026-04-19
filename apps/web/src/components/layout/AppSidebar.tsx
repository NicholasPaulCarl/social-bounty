'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import {
  ChevronsLeft, ChevronsRight, ChevronUp, X, Settings, LogOut,
  Search, Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useInbox';
import { BrandSelector } from './BrandSelector';
import type { NavItem, NavSection } from '@/lib/navigation';

interface AppSidebarProps {
  navSections: NavSection[];
  collapsed?: boolean;
  onToggle?: () => void;
}

/**
 * Count pip — small badge shown on nav items.
 * - Expanded: pill with the number (pink for normal, red for urgent).
 * - Collapsed: 8px dot top-right of the icon, with a white halo.
 */
function CountPip({
  count,
  urgent = false,
  collapsedDot = false,
}: {
  count: number;
  urgent?: boolean;
  collapsedDot?: boolean;
}) {
  if (!count) return null;

  if (collapsedDot) {
    return (
      <span
        className={`absolute top-1 right-1 block w-2 h-2 rounded-full border-2 border-white ${
          urgent ? 'bg-danger-500' : 'bg-pink-600'
        }`}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-mono tabular-nums font-bold text-[11px] leading-none ${
        urgent ? 'bg-danger-600 text-white' : 'bg-pink-100 text-pink-700'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Section divider / label. When expanded, a small uppercase heading.
 * When collapsed, a 1px horizontal rule.
 */
function NavSectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return <div className="mx-5 mt-[14px] mb-1.5 h-px bg-slate-200" aria-hidden="true" />;
  }
  return (
    <div className="px-5 pt-[14px] pb-1.5 text-[10px] font-bold uppercase tracking-[0.10em] text-text-muted">
      {label}
    </div>
  );
}

/**
 * Creator identity card — shown in the workspace slot for non-brand users
 * (participants and super admins). Mimics the handoff's `WorkspaceDisc` +
 * name/role row.
 */
function CreatorIdentity({
  initials,
  name,
  role,
  collapsed,
}: {
  initials: string;
  name: string;
  role: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <div
          className="inline-flex items-center justify-center w-9 h-9 rounded-full font-heading font-bold text-[13px] text-pink-700 bg-gradient-to-br from-pink-100 to-pink-50"
          aria-label={`${name}, ${role}`}
        >
          {initials}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] bg-bg-elevated border border-slate-200">
      <div
        className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full font-heading font-bold text-[13px] text-pink-700 bg-gradient-to-br from-pink-100 to-pink-50 shrink-0"
        aria-hidden="true"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-primary truncate">{name}</div>
        <div className="text-[11px] text-text-muted truncate">{role}</div>
      </div>
    </div>
  );
}

/**
 * Nav item row. Handles both top-level items and the flat-footer items
 * (notifications, settings, etc.) with the same rendering contract.
 */
function NavItemRow({
  item,
  active,
  collapsed,
  badgeOverride,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badgeOverride?: number;
}) {
  const badge = badgeOverride ?? item.badge ?? 0;
  const Icon = item.Icon;

  const baseClasses =
    'relative group flex items-center rounded-[10px] text-[13px] transition-[background,color] duration-normal ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
  const layoutClasses = collapsed
    ? 'justify-center mx-2 py-[10px]'
    : 'gap-3 mx-2 px-3 py-[9px]';
  const activeClasses = active
    ? 'bg-pink-50 text-pink-700 font-semibold'
    : 'text-text-secondary font-medium hover:bg-slate-100';

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${layoutClasses} ${activeClasses}`}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
    >
      {/* 3px active rail — desktop only, expanded only */}
      {active && !collapsed && (
        <span
          className="absolute -left-2 top-2 bottom-2 w-[3px] rounded bg-pink-600"
          aria-hidden="true"
        />
      )}
      <span className="relative inline-flex shrink-0">
        <Icon size={collapsed ? 20 : 18} strokeWidth={2} />
        {collapsed && badge > 0 && (
          <CountPip count={badge} urgent={item.urgent} collapsedDot />
        )}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 font-heading whitespace-nowrap overflow-hidden text-ellipsis">
            {item.label}
          </span>
          {badge > 0 && <CountPip count={badge} urgent={item.urgent} />}
        </>
      )}
    </Link>
  );
}

export function AppSidebar({ navSections, collapsed = false, onToggle }: AppSidebarProps) {
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
      : 'Creator';

  const isBusiness = user?.role === 'BUSINESS_ADMIN';

  const userMenuItems: MenuItem[] = [
    {
      label: 'Settings',
      icon: () => <Settings size={16} strokeWidth={2} className="mr-2 shrink-0" />,
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
      icon: () => <LogOut size={16} strokeWidth={2} className="mr-2 shrink-0" />,
      command: () => logout(),
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // Footer items — notifications only (no /help route exists in this app).
  // We still honour the useUnreadCount() wiring for the Bell badge.
  const NotificationsIcon: LucideIcon = Bell;
  const notificationsItem: NavItem = {
    label: 'Notifications',
    Icon: NotificationsIcon,
    href: '/inbox',
  };

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
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col transition-[width,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${collapsed
            ? '-translate-x-full md:translate-x-0 md:w-[72px]'
            : 'translate-x-0 w-60 md:w-64'}
          md:sticky md:top-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand mark row */}
        <div
          className={`flex items-center min-h-14 ${
            collapsed ? 'justify-center px-0 py-4' : 'justify-between px-[18px] py-4'
          }`}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-heading font-bold tracking-tight text-[17px] text-text-primary"
            aria-label="Social Bounty home"
          >
            <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-pink-600 to-blue-600 text-white text-[13px] font-bold">
              S
            </span>
            {!collapsed && (
              <span>
                social<span className="text-pink-600">bounty</span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <>
              {/* Desktop collapse toggle */}
              <button
                className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
                onClick={onToggle}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronsLeft size={16} strokeWidth={2} />
              </button>
              {/* Mobile close button */}
              <button
                className="md:hidden inline-flex items-center justify-center p-3 min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors"
                onClick={onToggle}
                aria-label="Close sidebar"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Workspace switcher */}
        <div className={collapsed ? 'px-0 pb-2' : 'px-3 pb-2'}>
          {isBusiness ? (
            <BrandSelector collapsed={collapsed} />
          ) : user ? (
            <CreatorIdentity
              initials={initials}
              name={fullName || 'Account'}
              role={roleLabel}
              collapsed={collapsed}
            />
          ) : null}
        </div>

        {/* Search (cosmetic for now — no Cmd+K behaviour wired yet) */}
        {!collapsed && (
          <div className="px-3 pb-2.5 pt-1.5">
            <div
              className="flex items-center gap-2 px-2.5 py-2 bg-bg-elevated rounded-lg text-text-muted text-xs"
              role="search"
            >
              <Search size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="flex-1">Search</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-text-muted">
                ⌘K
              </kbd>
            </div>
          </div>
        )}

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto pb-2">
          {navSections.map((section) => (
            <div key={section.label}>
              <NavSectionLabel label={section.label} collapsed={collapsed} />
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const hasChildren = !!item.children?.length;
                  const showChildren = hasChildren && active && !collapsed;
                  const isInbox = item.href === '/inbox';
                  const badge = isInbox ? inboxUnreadCount : undefined;

                  return (
                    <div key={item.href}>
                      <NavItemRow
                        item={item}
                        active={active}
                        collapsed={collapsed}
                        badgeOverride={badge}
                      />

                      {/* Sub-navigation — expanded + active only */}
                      {showChildren && (
                        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                          {item.children!.map((child) => (
                            <a
                              key={child.href}
                              href={child.href}
                              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium text-text-muted hover:text-pink-600 hover:bg-slate-100 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              <span>{child.label}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer — notifications + expand toggle (collapsed) + user menu */}
        <div className="border-t border-slate-200 flex flex-col gap-0.5 py-2">
          <NavItemRow
            item={notificationsItem}
            active={isActive('/inbox')}
            collapsed={collapsed}
            badgeOverride={inboxUnreadCount}
          />

          {collapsed && (
            <div className="flex justify-center py-1">
              <button
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
                onClick={onToggle}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ChevronsRight size={16} strokeWidth={2} />
              </button>
            </div>
          )}

          {user && (
            <div className={collapsed ? 'px-0' : 'px-2'}>
              <Menu model={userMenuItems} popup ref={userMenuRef} />
              <button
                className={`flex items-center rounded-[10px] hover:bg-slate-100 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 ${
                  collapsed ? 'justify-center p-2' : 'gap-2.5 p-2'
                }`}
                onClick={(e) => userMenuRef.current?.toggle(e)}
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[13px] font-bold shrink-0">
                  {initials}
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-text-primary truncate">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">{roleLabel}</p>
                    </div>
                    <ChevronUp
                      size={14}
                      strokeWidth={2}
                      className="text-text-muted shrink-0"
                    />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
