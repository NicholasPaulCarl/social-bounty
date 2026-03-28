'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useSystemHealth, useRecentErrors } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/utils/format';
import type { AdminRecentErrorItem } from '@social-bounty/shared';

export default function AdminTroubleshootingPage() {
  const { data: health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useSystemHealth();
  const [errorsPage] = useState(1);
  const { data: errors, isLoading: errorsLoading, error: errorsError, refetch: refetchErrors } = useRecentErrors({ page: errorsPage, limit: 20 });

  if (healthLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (healthError) return <ErrorState error={healthError} onRetry={() => refetchHealth()} />;

  const getStatusSeverity = (status: string): 'success' | 'warning' | 'danger' | null => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
      case 'unhealthy':
        return 'danger';
      default:
        return null;
    }
  };

  const dateTemplate = (rowData: AdminRecentErrorItem) => (
    <span>{formatDateTime(rowData.timestamp)}</span>
  );

  return (
    <>
      <PageHeader
        title="System Health"
        subtitle="Monitor platform health and recent errors"
        actions={
          <Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => { refetchHealth(); refetchErrors(); }} />
        }
      />

      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-up">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Overall Status</p>
                <Tag value={health.status} severity={getStatusSeverity(health.status)} className="mt-1" />
              </div>
              <i className="pi pi-server text-2xl text-text-muted" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Database</p>
                <Tag value={health.services.database.status} severity={getStatusSeverity(health.services.database.status)} className="mt-1" />
              </div>
              <i className="pi pi-database text-2xl text-text-muted" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Uptime</p>
                <p className="text-lg font-bold text-text-primary mt-1">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
              </div>
              <i className="pi pi-clock text-2xl text-text-muted" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Memory Usage</p>
                <p className="text-lg font-bold text-text-primary mt-1">{Math.round((health.memory.used / health.memory.total) * 100)}%</p>
              </div>
              <i className="pi pi-chart-bar text-2xl text-text-muted" />
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Errors</h3>

        {errorsLoading ? (
          <LoadingState type="table" />
        ) : errorsError ? (
          <ErrorState error={errorsError} onRetry={() => refetchErrors()} />
        ) : errors && errors.data.length > 0 ? (
          <DataTable value={errors.data} stripedRows>
            <Column field="message" header="Message" />
            <Column field="endpoint" header="Endpoint" />
            <Column field="severity" header="Severity" />
            <Column header="Timestamp" body={dateTemplate} />
          </DataTable>
        ) : (
          <EmptyState icon="pi-check-circle" title="No recent errors" message="The system is running smoothly with no recent errors." />
        )}
      </div>
    </>
  );
}
