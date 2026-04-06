'use client';

import { BreadCrumb } from 'primereact/breadcrumb';
import type { MenuItem } from 'primereact/menuitem';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: MenuItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  const home: MenuItem = { icon: 'pi pi-home', url: '/' };

  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <BreadCrumb model={breadcrumbs} home={home} className="mb-4 border-none p-0 bg-transparent" />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight font-headline">{title}</h1>
          {subtitle && <p className="text-on-surface-variant mt-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}
