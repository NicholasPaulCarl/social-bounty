'use client';

import { useRouter } from 'next/navigation';
import { useAdminDashboard, useAuditLogs, useSystemHealth } from '@/hooks/useAdmin';
import { useDisputeStats } from '@/hooks/useDisputes';
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

const statIconColors = [
  { bg: 'bg-accent-violet/10', text: 'text-accent-violet' },
  { bg: 'bg-accent-cyan/10', text: 'text-accent-cyan' },
  { bg: 'bg-accent-amber/10', text: 'text-accent-amber' },
  { bg: 'bg-accent-emerald/10', text: 'text-accent-emerald' },
  { bg: 'bg-accent-rose/10', text: 'text-accent-rose' },
  { bg: 'bg-accent-violet/10', text: 'text-accent-violet' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const { data: auditData } = useAuditLogs({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: healthData } = useSystemHealth();
  const { data: disputeData } = useDisputeStats();

  if (isLoading) return <LoadingState type="cards-grid" cards={6} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const stats = [
    { label: 'Total Users', value: data.users.total, icon: 'pi-users', href: '/admin/users' },
    { label: 'Total Brands', value: data.brands.total, icon: 'pi-building', href: '/admin/brands' },
    { label: 'Total Bounties', value: data.bounties.total, icon: 'pi-megaphone', href: '/admin/bounties' },
    { label: 'Active Bounties', value: data.bounties.byStatus?.LIVE ?? 0, icon: 'pi-check-circle', href: '/admin/bounties' },
    { label: 'Total Submissions', value: data.submissions.total, icon: 'pi-file', href: '/admin/submissions' },
    { label: 'Pending Reviews', value: data.submissions.byStatus?.IN_REVIEW ?? 0, icon: 'pi-clock', href: '/admin/submissions' },
    { label: 'Open Disputes', value: disputeData?.open ?? 0, icon: 'pi-flag', href: '/admin/disputes' },
    { label: 'Escalated', value: disputeData?.escalated ?? 0, icon: 'pi-exclamation-triangle', href: '/admin/disputes?status=ESCALATED' },
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
    <div className="animate-fade-up">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => {
          const colors = statIconColors[i % statIconColors.length];
          return (
            <div
              key={stat.label}
              className="glass-card p-6 cursor-pointer hover:shadow-glass-lg transition-shadow"
              onClick={() => router.push(stat.href)}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colors.bg}`}>
                  <i className={`pi ${stat.icon} ${colors.text} text-xl`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Recent Activity</h3>
            {auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-glass-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-accent-violet/10 flex items-center justify-center flex-shrink-0 border-l-2 border-accent-violet">
                      <i className="pi pi-history text-accent-violet text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">{log.actor?.firstName} {log.actor?.lastName}</span>
                        {' '}{formatAction(log.action)} {log.entityType} <span className="font-mono text-xs text-text-muted">{log.entityId?.slice(0, 8)}</span>
                      </p>
                      <p className="text-xs text-text-muted font-mono mt-1">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No recent activity.</p>
            )}
          </div>
        </div>

        <div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">System Health</h3>
            {healthChecks.length > 0 ? (
              <div className="space-y-3">
                {healthChecks.map((check) => (
                  <div key={check.service} className="flex items-center gap-3 p-3 rounded-lg border border-glass-border">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      check.status === 'healthy' ? 'bg-accent-emerald' :
                      check.status === 'degraded' ? 'bg-accent-amber' : 'bg-accent-rose'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        check.status === 'healthy' ? 'text-accent-emerald' :
                        check.status === 'degraded' ? 'text-accent-amber' : 'text-accent-rose'
                      }`}>{check.service}</p>
                      <p className="text-xs text-text-muted">{check.responseTime}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Loading health data...</p>
            )}
            {healthData && (
              <div className="mt-4 pt-4 border-t border-glass-border">
                <p className="text-xs text-text-muted">
                  Status: <span className={`font-medium ${
                    healthData.status === 'ok' ? 'text-accent-emerald' :
                    healthData.status === 'degraded' ? 'text-accent-amber' : 'text-accent-rose'
                  }`}>{healthData.status.toUpperCase()}</span>
                  {' | '}v{healthData.version}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
