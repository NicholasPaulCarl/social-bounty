'use client';

import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  Megaphone,
  CheckCircle2,
  File,
  Clock,
  Flag,
  AlertTriangle,
  History,
} from 'lucide-react';
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
    { label: 'Total users', value: data.users.total, Icon: Users, href: '/admin/users' },
    { label: 'Total brands', value: data.brands.total, Icon: Building2, href: '/admin/brands' },
    { label: 'Total bounties', value: data.bounties.total, Icon: Megaphone, href: '/admin/bounties' },
    { label: 'Active bounties', value: data.bounties.byStatus?.LIVE ?? 0, Icon: CheckCircle2, href: '/admin/bounties' },
    { label: 'Total submissions', value: data.submissions.total, Icon: File, href: '/admin/submissions' },
    { label: 'Pending reviews', value: data.submissions.byStatus?.IN_REVIEW ?? 0, Icon: Clock, href: '/admin/submissions' },
    { label: 'Open disputes', value: disputeData?.open ?? 0, Icon: Flag, href: '/admin/disputes' },
    { label: 'Escalated', value: disputeData?.escalated ?? 0, Icon: AlertTriangle, href: '/admin/disputes?status=ESCALATED' },
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
      <PageHeader title="Admin dashboard" subtitle="Platform overview and management" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-6 cursor-pointer hover:shadow-glass-lg transition-shadow rounded-xl"
            onClick={() => router.push(stat.href)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-pink-100 text-pink-600">
                <stat.Icon size={24} strokeWidth={2} />
              </div>
              <div>
                <p className="font-mono tabular-nums text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="eyebrow">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Recent activity</h3>
            {auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-glass-border last:border-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                      <History size={16} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">{log.actor?.firstName} {log.actor?.lastName}</span>
                        {' '}{formatAction(log.action)} {log.entityType} <span className="font-mono tabular-nums text-xs text-text-muted">{log.entityId?.slice(0, 8)}</span>
                      </p>
                      <p className="text-xs text-text-muted font-mono tabular-nums mt-1">
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
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">System health</h3>
            {healthChecks.length > 0 ? (
              <div className="space-y-3">
                {healthChecks.map((check) => (
                  <div key={check.service} className="flex items-center gap-3 p-3 rounded-lg border border-glass-border">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      check.status === 'healthy' ? 'bg-success-600' :
                      check.status === 'degraded' ? 'bg-warning-600' : 'bg-danger-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        check.status === 'healthy' ? 'text-success-600' :
                        check.status === 'degraded' ? 'text-warning-600' : 'text-danger-600'
                      }`}>{check.service}</p>
                      <p className="text-xs text-text-muted font-mono tabular-nums">{check.responseTime}ms</p>
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
                    healthData.status === 'ok' ? 'text-success-600' :
                    healthData.status === 'degraded' ? 'text-warning-600' : 'text-danger-600'
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
