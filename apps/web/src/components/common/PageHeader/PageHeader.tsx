'use client';

import { PageHeaderBreadcrumbs } from './PageHeaderBreadcrumbs';
import { PageHeaderTitle } from './PageHeaderTitle';
import { PageHeaderTabs } from './PageHeaderTabs';
import { PageHeaderPills } from './PageHeaderPills';
import { PageHeaderToolbar } from './PageHeaderToolbar';
import type { PageHeaderProps } from './types';

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
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
      {breadcrumbs && breadcrumbs.length > 0 && (
        <PageHeaderBreadcrumbs items={breadcrumbs} />
      )}

      <PageHeaderTitle title={title} subtitle={subtitle} actions={actions} />

      {tabs && !pills && <PageHeaderTabs config={tabs} />}

      {pills && !tabs && <PageHeaderPills config={pills} />}

      {toolbar && <PageHeaderToolbar config={toolbar} />}
    </div>
  );
}
