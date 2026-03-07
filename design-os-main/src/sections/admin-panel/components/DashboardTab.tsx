import {
  Users,
  Building2,
  Megaphone,
  FileText,
  DollarSign,
  Activity,
  Clock,
  Shield,
} from 'lucide-react'
import type { DashboardStats, AuditLogEntry, HealthCheck } from '@/../product/sections/admin-panel/types'
import { HealthStatusBadge } from './StatusBadges'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const actionLabels: Record<string, string> = {
  'user.suspended': 'Suspended user',
  'user.reinstated': 'Reinstated user',
  'user.password_reset': 'Forced password reset',
  'organization.suspended': 'Suspended organization',
  'organization.reinstated': 'Reinstated organization',
  'submission.status_override': 'Overrode submission status',
  'system.kill_switch': 'Toggled kill switch',
}

interface DashboardTabProps {
  stats: DashboardStats
  recentLogs: AuditLogEntry[]
  healthChecks: HealthCheck[]
}

export function DashboardTab({ stats, recentLogs, healthChecks }: DashboardTabProps) {
  const overallHealth = healthChecks.some((h) => h.status === 'down')
    ? 'down'
    : healthChecks.some((h) => h.status === 'degraded')
    ? 'degraded'
    : 'healthy'

  return (
    <div className="space-y-6">
      {/* Health banner */}
      {overallHealth !== 'healthy' && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            overallHealth === 'down'
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
              : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
          }`}
        >
          <Activity
            className={`h-4 w-4 ${
              overallHealth === 'down' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              overallHealth === 'down' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
            }`}
          >
            System {overallHealth === 'down' ? 'outage detected' : 'performance degraded'} —{' '}
            {healthChecks
              .filter((h) => h.status !== 'healthy')
              .map((h) => h.service)
              .join(', ')}
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-950/40">
              <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Users</span>
          </div>
          <p
            className="text-2xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stats.users.total.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.users.active} active</span>
            <span className="text-red-500 dark:text-red-400">{stats.users.suspended} suspended</span>
          </div>
        </div>

        {/* Organizations */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-pink-50 p-1.5 dark:bg-pink-950/40">
              <Building2 className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Organizations</span>
          </div>
          <p
            className="text-2xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stats.organizations.total}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.organizations.active} active</span>
            <span className="text-slate-400">{stats.organizations.inactive} inactive</span>
          </div>
        </div>

        {/* Bounties */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-amber-50 p-1.5 dark:bg-amber-950/40">
              <Megaphone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bounties</span>
          </div>
          <p
            className="text-2xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stats.bounties.draft + stats.bounties.live + stats.bounties.paused + stats.bounties.closed}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.bounties.live} live</span>
            <span className="text-amber-500">{stats.bounties.paused} paused</span>
            <span className="text-slate-400">{stats.bounties.draft} draft</span>
          </div>
        </div>

        {/* Submissions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-purple-50 p-1.5 dark:bg-purple-950/40">
              <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submissions</span>
          </div>
          <p
            className="text-2xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stats.submissions.submitted + stats.submissions.in_review + stats.submissions.needs_more_info + stats.submissions.approved + stats.submissions.rejected}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
            <span className="text-blue-600 dark:text-blue-400">{stats.submissions.submitted + stats.submissions.in_review} pending</span>
            <span className="text-emerald-600 dark:text-emerald-400">{stats.submissions.approved} approved</span>
          </div>
        </div>

        {/* Payouts */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-1.5 dark:bg-emerald-950/40">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payouts</span>
          </div>
          <p
            className="text-2xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stats.payouts.not_paid + stats.payouts.pending + stats.payouts.paid}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.payouts.paid} paid</span>
            <span className="text-amber-500">{stats.payouts.pending} pending</span>
            <span className="text-red-500 dark:text-red-400">{stats.payouts.not_paid} unpaid</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity feed */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3
                className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {recentLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 dark:bg-slate-800">
                    <Shield className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{log.actorName}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">{actionLabels[log.action] ?? log.action}</span>{' '}
                      <span className="font-semibold">{log.entityLabel}</span>
                    </p>
                    {log.reason && (
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{log.reason}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System health */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3
                className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                System Health
              </h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {healthChecks.map((check) => (
                <div key={check.service} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{check.service}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      <span style={{ fontFamily: "'Source Code Pro', monospace" }}>{check.responseTime}ms</span>
                    </p>
                  </div>
                  <HealthStatusBadge status={check.status} />
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                <Clock className="mr-1 inline-block h-3 w-3" />
                Last checked {formatDateTime(healthChecks[0]?.lastChecked ?? '')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
