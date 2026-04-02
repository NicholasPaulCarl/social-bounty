import { BreadCrumb } from 'primereact/breadcrumb';
import type { MenuItem } from 'primereact/menuitem';

interface PageHeaderBreadcrumbsProps {
  items: MenuItem[];
}

const home: MenuItem = { icon: 'pi pi-home', url: '/' };

export function PageHeaderBreadcrumbs({ items }: PageHeaderBreadcrumbsProps) {
  return (
    <BreadCrumb
      model={items}
      home={home}
      className="mb-4 border-none p-0 bg-transparent text-text-muted"
    />
  );
}
