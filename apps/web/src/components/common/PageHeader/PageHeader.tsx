'use client';

import { PageHeaderTitle } from './PageHeaderTitle';
import { PageHeaderTabs } from './PageHeaderTabs';
import { PageHeaderPills } from './PageHeaderPills';
import { PageHeaderToolbar } from './PageHeaderToolbar';
import type { PageHeaderProps } from './types';

export function PageHeader({
  title,
  subtitle,
  actions,
  tabs,
  pills,
  toolbar,
}: PageHeaderProps) {
  if (process.env.NODE_ENV === 'development' && tabs && pills) {
    console.warn('PageHeader: `tabs` and `pills` are mutually exclusive. Only one will render.');
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Breadcrumbs removed globally from design system. The `breadcrumbs` prop
          on PageHeaderProps is preserved for back-compat but is now ignored. */}

      <PageHeaderTitle title={title} subtitle={subtitle} actions={actions} />

      {tabs && !pills && <PageHeaderTabs config={tabs} />}

      {pills && !tabs && <PageHeaderPills config={pills} />}

      {toolbar && <PageHeaderToolbar config={toolbar} />}
    </div>
  );
}
