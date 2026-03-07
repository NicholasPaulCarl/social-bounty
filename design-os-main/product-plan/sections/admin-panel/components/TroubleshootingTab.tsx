import {
  AlertTriangle,
  Activity,
  Power,
  Clock,
} from 'lucide-react'
import type {
  HealthCheck,
  SystemError,
  KillSwitch,
} from '../types'
import { HealthStatusBadge, ErrorLevelBadge } from './StatusBadges'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface TroubleshootingTabProps {
  healthChecks: HealthCheck[]
  systemErrors: SystemError[]
  killSwitches: KillSwitch[]
  onToggleKillSwitch?: (switchId: string, enabled: boolean, label: string) => void
}

export function TroubleshootingTab({
  healthChecks,
  systemErrors,
  killSwitches,
  onToggleKillSwitch,
}: TroubleshootingTabProps) {
  return (
    <div className="space-y-6">
      {/* Health checks */}
      <div>
        <h3
          className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <Activity className="mr-1.5 inline-block h-4 w-4" />
          Service Health
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {healthChecks.map((check) => (
            <div
              key={check.service}
              className={`rounded-xl border p-4 ${
                check.status === 'healthy'
                  ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  : check.status === 'degraded'
                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                  : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{check.service}</p>
                <HealthStatusBadge status={check.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500">Response time</span>
                <span
                  className={`text-sm font-semibold ${
                    check.responseTime > 500
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  {check.responseTime}ms
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                <Clock className="mr-0.5 inline-block h-3 w-3" />
                {formatDateTime(check.lastChecked)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System errors */}
      <div>
        <h3
          className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <AlertTriangle className="mr-1.5 inline-block h-4 w-4" />
          Recent Errors
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {systemErrors.map((error) => (
              <div key={error.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ErrorLevelBadge level={error.level} />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {error.service}
                      </span>
                      {error.count > 1 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          ×{error.count}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">{error.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatDateTime(error.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kill switches */}
      <div>
        <h3
          className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <Power className="mr-1.5 inline-block h-4 w-4" />
          Kill Switches
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {killSwitches.map((ks) => (
              <div key={ks.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{ks.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{ks.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${ks.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {ks.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => onToggleKillSwitch?.(ks.id, !ks.enabled, ks.label)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      ks.enabled
                        ? 'bg-emerald-500 dark:bg-emerald-600'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        ks.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Kill switches immediately affect platform functionality. Toggle with caution.
        </p>
      </div>
    </div>
  )
}
