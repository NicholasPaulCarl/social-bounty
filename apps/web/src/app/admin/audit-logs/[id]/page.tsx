'use client';

import { useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { useAuditLogDetail } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDateTime } from '@/lib/utils/format';

export default function AdminAuditLogDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: log, isLoading, error, refetch } = useAuditLogDetail(id);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!log) return null;

  const breadcrumbs = [
    { label: 'Audit Logs', url: '/admin/audit-logs' },
    { label: `Log #${id.slice(0, 8)}` },
  ];

  return (
    <>
      <PageHeader title={`Audit Log #${id.slice(0, 8)}`} breadcrumbs={breadcrumbs} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-on-surface mb-4">Log Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-on-surface-variant">Action</dt>
              <dd className="text-sm font-medium text-on-surface">{log.action}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-surface-variant">Entity Type</dt>
              <dd className="text-sm font-medium text-on-surface">{log.entityType}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-surface-variant">Entity ID</dt>
              <dd className="text-sm font-medium text-on-surface font-mono text-xs">{log.entityId}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-surface-variant">Performed By</dt>
              <dd className="text-sm font-medium text-on-surface">{log.actor?.email || log.actorId}</dd>
            </div>
            <div>
              <dt className="text-sm text-on-surface-variant">Timestamp</dt>
              <dd className="text-sm font-medium text-on-surface">{formatDateTime(log.createdAt)}</dd>
            </div>
            {log.ipAddress && (
              <div>
                <dt className="text-sm text-on-surface-variant">IP Address</dt>
                <dd className="text-sm font-medium text-on-surface font-mono">{log.ipAddress}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-on-surface mb-4">Changes</h3>
          {log.beforeState && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-on-surface-variant mb-2">Before</h4>
              <pre className="bg-surface rounded-lg p-4 text-sm text-on-surface overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.beforeState, null, 2)}
              </pre>
            </div>
          )}
          {log.afterState && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-on-surface-variant mb-2">After</h4>
              <pre className="bg-surface rounded-lg p-4 text-sm text-on-surface overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.afterState, null, 2)}
              </pre>
            </div>
          )}
          {log.reason && (
            <div>
              <h4 className="text-sm font-medium text-on-surface-variant mb-2">Reason</h4>
              <p className="text-on-surface">{log.reason}</p>
            </div>
          )}
          {!log.beforeState && !log.afterState && !log.reason && (
            <p className="text-sm text-on-surface-variant">No additional details recorded.</p>
          )}
        </Card>
      </div>
    </>
  );
}
