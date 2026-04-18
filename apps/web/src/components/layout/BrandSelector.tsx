'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import { useAuth } from '@/hooks/useAuth';
import { useMyBrands } from '@/hooks/useBrand';
import { useToast } from '@/hooks/useToast';
import { getUploadUrl } from '@/lib/api/client';

export function BrandSelector() {
  const { user, switchBrand } = useAuth();
  const { data: brands } = useMyBrands();
  const menuRef = useRef<Menu>(null);
  const router = useRouter();
  const toast = useToast();

  if (!brands || brands.length <= 1) return null;

  const activeBrand = brands.find((b) => b.id === user?.brandId);

  const menuItems: MenuItem[] = [
    {
      label: 'Switch Brand',
      items: brands
        .filter((b) => b.id !== user?.brandId)
        .map((b) => ({
          label: b.name,
          icon: 'pi pi-building',
          command: async () => {
            try {
              await switchBrand(b.id);
              toast.showSuccess(`Switched to ${b.name}`);
            } catch {
              toast.showError('Failed to switch brand');
            }
          },
        })),
    },
    { separator: true },
    {
      label: 'Manage Brands',
      icon: 'pi pi-cog',
      command: () => router.push('/business/brands'),
    },
  ];

  return (
    <div className="px-3 mb-2">
      <Menu model={menuItems} popup ref={menuRef} />
      <button
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-pink-600/5 border border-pink-600/20 hover:bg-pink-600/10 transition-colors text-left"
        onClick={(e) => menuRef.current?.toggle(e)}
      >
        {activeBrand?.logo ? (
          <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
            <Image
              src={getUploadUrl(activeBrand.logo)!}
              alt={activeBrand.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-7 h-7 rounded bg-pink-600/20 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0">
            {activeBrand?.name.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <span className="text-sm font-medium text-text-primary truncate flex-1">
          {activeBrand?.name || 'Select Brand'}
        </span>
        <i className="pi pi-chevron-down text-xs text-text-muted" />
      </button>
    </div>
  );
}
