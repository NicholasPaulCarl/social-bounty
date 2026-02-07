'use client';

import { useRef } from 'react';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '@/hooks/useAuth';

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const menuRef = useRef<Menu>(null);

  const menuItems: MenuItem[] = [
    {
      label: 'My Profile',
      icon: 'pi pi-user',
      command: () => {
        if (user?.role === 'SUPER_ADMIN') {
          window.location.href = '/admin/profile';
        } else if (user?.role === 'BUSINESS_ADMIN') {
          window.location.href = '/business/profile';
        } else {
          window.location.href = '/profile';
        }
      },
    },
    {
      separator: true,
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => logout(),
    },
  ];

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-white border-b border-neutral-200">
      <button
        className="md:hidden p-2 rounded hover:bg-neutral-100"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <i className="pi pi-bars text-lg" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-neutral-600 hidden sm:block">
            {user.email}
          </span>
        )}
        <Menu model={menuItems} popup ref={menuRef} />
        <Button
          icon="pi pi-user"
          rounded
          text
          severity="secondary"
          onClick={(e) => menuRef.current?.toggle(e)}
          aria-label="User menu"
        />
      </div>
    </header>
  );
}
