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
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Log Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-neutral-500">Action</dt>
              <dd className="text-sm font-medium text-neutral-900">{log.action}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">Entity Type</dt>
              <dd className="text-sm font-medium text-neutral-900">{log.entityType}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">Entity ID</dt>
              <dd className="text-sm font-medium text-neutral-900 font-mono text-xs">{log.entityId}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">Performed By</dt>
              <dd className="text-sm font-medium text-neutral-900">{log.actor?.email || log.actorId}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">Timestamp</dt>
              <dd className="text-sm font-medium text-neutral-900">{formatDateTime(log.createdAt)}</dd>
            </div>
            {log.ipAddress && (
              <div>
                <dt className="text-sm text-neutral-500">IP Address</dt>
                <dd className="text-sm font-medium text-neutral-900 font-mono">{log.ipAddress}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Changes</h3>
          {log.beforeState && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-neutral-500 mb-2">Before</h4>
              <pre className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-800 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.beforeState, null, 2)}
              </pre>
            </div>
          )}
          {log.afterState && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-neutral-500 mb-2">After</h4>
              <pre className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-800 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.afterState, null, 2)}
              </pre>
            </div>
          )}
          {log.reason && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 mb-2">Reason</h4>
              <p className="text-neutral-800">{log.reason}</p>
            </div>
          )}
          {!log.beforeState && !log.afterState && !log.reason && (
            <p className="text-sm text-neutral-500">No additional details recorded.</p>
          )}
        </Card>
      </div>
    </>
  );
}
