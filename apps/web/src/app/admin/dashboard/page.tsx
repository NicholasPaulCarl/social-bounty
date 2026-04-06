'use client';

import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { useAdminDashboard, useAuditLogs, useSystemHealth } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDateTime } from '@/lib/utils/format';
import type { AuditLogListItem } from '@social-bounty/shared';

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.toLowerCase())
    .join(' ');
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const { data: auditData } = useAuditLogs({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: healthData } = useSystemHealth();

  if (isLoading) return <LoadingState type="cards-grid" cards={6} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const stats = [
    { label: 'Total Users', value: data.users.total, icon: 'pi-users', href: '/admin/users' },
    { label: 'Total Organisations', value: data.organisations.total, icon: 'pi-building', href: '/admin/organisations' },
    { label: 'Total Bounties', value: data.bounties.total, icon: 'pi-megaphone', href: '/admin/bounties' },
    { label: 'Active Bounties', value: data.bounties.byStatus?.LIVE ?? 0, icon: 'pi-check-circle', href: '/admin/bounties' },
    { label: 'Total Submissions', value: data.submissions.total, icon: 'pi-file', href: '/admin/submissions' },
    { label: 'Pending Reviews', value: data.submissions.byStatus?.IN_REVIEW ?? 0, icon: 'pi-clock', href: '/admin/submissions' },
  ];

  const auditLogs: AuditLogListItem[] = auditData?.data ?? [];

  const healthChecks = healthData
    ? Object.entries(healthData.services).map(([service, info]) => ({
        service: service.charAt(0).toUpperCase() + service.slice(1),
        status: info.status === 'ok' ? 'healthy' : 'error',
        responseTime: info.responseTime,
      }))
    : [];

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(stat.href)}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container">
                <i className={`pi ${stat.icon} text-primary text-xl`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
                <p className="text-sm text-on-surface-variant">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-outline-variant p-6">
            <h3 className="text-lg font-heading font-semibold mb-4">Recent Activity</h3>
            {auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-outline-variant last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <i className="pi pi-history text-primary text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface">
                        <span className="font-medium">{log.actor?.firstName} {log.actor?.lastName}</span>
                        {' '}{formatAction(log.action)} {log.entityType} <span className="font-mono text-xs">{log.entityId?.slice(0, 8)}</span>
                      </p>
                      <p className="text-xs text-on-surface-variant font-mono mt-1">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No recent activity.</p>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg border border-outline-variant p-6">
            <h3 className="text-lg font-heading font-semibold mb-4">System Health</h3>
            {healthChecks.length > 0 ? (
              <div className="space-y-3">
                {healthChecks.map((check) => (
                  <div key={check.service} className="flex items-center gap-3 p-3 rounded-lg bg-surface">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      check.status === 'healthy' ? 'bg-green-500' :
                      check.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-on-surface">{check.service}</p>
                      <p className="text-xs text-on-surface-variant">{check.responseTime}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Loading health data...</p>
            )}
            {healthData && (
              <div className="mt-4 pt-4 border-t border-outline-variant">
                <p className="text-xs text-on-surface-variant">
                  Status: <span className={`font-medium ${
                    healthData.status === 'ok' ? 'text-green-600' :
                    healthData.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{healthData.status.toUpperCase()}</span>
                  {' | '}v{healthData.version}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
