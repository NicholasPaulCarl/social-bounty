import { useState, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  Inbox,
  ArrowRight,
} from 'lucide-react'
import type { AuditLogEntry, AuditAction } from '../types'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const actionLabels: Record<AuditAction, string> = {
  'user.suspended': 'User Suspended',
  'user.reinstated': 'User Reinstated',
  'user.password_reset': 'Password Reset',
  'organization.suspended': 'Org Suspended',
  'organization.reinstated': 'Org Reinstated',
  'submission.status_override': 'Status Override',
  'system.kill_switch': 'Kill Switch',
}

const actionColorConfig: Record<string, { bg: string; text: string }> = {
  'user.suspended': { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300' },
  'user.reinstated': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  'user.password_reset': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
  'organization.suspended': { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300' },
  'organization.reinstated': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  'submission.status_override': { bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-700 dark:text-pink-300' },
  'system.kill_switch': { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300' },
}

const allActions: AuditAction[] = [
  'user.suspended',
  'user.reinstated',
  'user.password_reset',
  'organization.suspended',
  'organization.reinstated',
  'submission.status_override',
  'system.kill_switch',
]

const entityTypes = ['User', 'Organization', 'Submission', 'System']

interface AuditLogsTabProps {
  auditLogs: AuditLogEntry[]
}

export function AuditLogsTab({ auditLogs }: AuditLogsTabProps) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = auditLogs
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.entityLabel.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q))
      )
    }
    if (actionFilter !== 'all') {
      result = result.filter((l) => l.action === actionFilter)
    }
    if (entityFilter !== 'all') {
      result = result.filter((l) => l.entityType === entityFilter)
    }
    return result
  }, [auditLogs, search, actionFilter, entityFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, entity, or reason..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
            >
              <option value="all">All actions</option>
              {allActions.map((a) => (
                <option key={a} value={a}>{actionLabels[a]}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
            >
              <option value="all">All entities</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No audit log entries found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {filtered.map((log) => {
              const actionColor = actionColorConfig[log.action] ?? { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' }
              const isExpanded = expandedId === log.id
              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${actionColor.bg} ${actionColor.text}`}>
                          {actionLabels[log.action]}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {log.entityLabel}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          by {log.actorName}
                        </span>
                      </div>
                      {log.reason && !isExpanded && (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{log.reason}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/20">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Actor</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{log.actorName} <span className="text-xs text-slate-400">({log.actorRole})</span></p>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Entity</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {log.entityType}{' '}
                            <span className="text-xs text-slate-400" style={{ fontFamily: "'Source Code Pro', monospace" }}>
                              {log.entityId}
                            </span>
                          </p>
                        </div>
                        {(log.beforeState || log.afterState) && (
                          <div className="sm:col-span-2">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">State Change</p>
                            <div className="flex items-center gap-2 text-sm">
                              {log.beforeState ? (
                                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  {log.beforeState}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                              {log.afterState ? (
                                <span className="rounded-md bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
                                  {log.afterState}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </div>
                        )}
                        {log.reason && (
                          <div className="sm:col-span-2">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Reason</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{log.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Showing {filtered.length} of {auditLogs.length} entries
      </p>
    </div>
  )
}
