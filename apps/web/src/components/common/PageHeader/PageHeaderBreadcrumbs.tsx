import { BreadCrumb } from 'primereact/breadcrumb';
import type { MenuItem } from 'primereact/menuitem';
import { Home } from 'lucide-react';

interface PageHeaderBreadcrumbsProps {
  items: MenuItem[];
}

// NOTE: Breadcrumbs are removed globally from the design system. PageHeader
// no longer renders this component — the `breadcrumbs` prop on PageHeaderProps
// is preserved only for back-compat. Kept here for any out-of-tree consumer
// during the DS migration; safe to delete in a follow-up.
const home: MenuItem = { icon: () => <Home size={14} strokeWidth={2} />, url: '/' };

export function PageHeaderBreadcrumbs({ items }: PageHeaderBreadcrumbsProps) {
  return (
    <BreadCrumb
      model={items}
      home={home}
      className="mb-4 border-none p-0 bg-transparent text-text-muted"
    />
  );
}
