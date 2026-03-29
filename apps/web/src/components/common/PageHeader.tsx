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
        <BreadCrumb
          model={breadcrumbs}
          home={home}
          className="mb-4 border-none p-0 bg-transparent text-text-muted"
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}
