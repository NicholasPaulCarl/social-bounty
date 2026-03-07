import { useState } from 'react'
import {
  ArrowLeft,
  Mail,
  Calendar,
  Building2,
  Shield,
  Clock,
  Ban,
  RotateCcw,
  KeyRound,
  FileText,
  Inbox,
  ArrowRight,
} from 'lucide-react'
import type { UserDetailProps, AuditLogEntry, SubmissionStatus } from '@/../product/sections/admin-panel/types'
import { UserStatusBadge, SubmissionStatusBadge } from './StatusBadges'
import { ConfirmationDialog } from './ConfirmationDialog'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const actionLabels: Record<string, string> = {
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

type PendingAction = {
  title: string
  description: string
  confirmLabel: string
  confirmColor: 'red' | 'emerald' | 'pink' | 'amber'
  requireReason: boolean
  onConfirm: (reason: string) => void
} | null

export function UserDetail({
  user,
  submissions,
  auditLogs,
  onBack,
  onSuspendUser,
  onReinstateUser,
  onForcePasswordReset,
}: UserDetailProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  function requestSuspend() {
    setPendingAction({
      title: 'Suspend User',
      description: `Are you sure you want to suspend ${user.name}? They will lose access to the platform until reinstated.`,
      confirmLabel: 'Suspend User',
      confirmColor: 'red',
      requireReason: true,
      onConfirm: (reason) => {
        onSuspendUser?.(user.id, reason)
        setPendingAction(null)
      },
    })
  }

  function requestReinstate() {
    setPendingAction({
      title: 'Reinstate User',
      description: `Reinstate ${user.name}? They will regain full access to the platform.`,
      confirmLabel: 'Reinstate User',
      confirmColor: 'emerald',
      requireReason: false,
      onConfirm: () => {
        onReinstateUser?.(user.id)
        setPendingAction(null)
      },
    })
  }

  function requestPasswordReset() {
    setPendingAction({
      title: 'Force Password Reset',
      description: `Force a password reset for ${user.name}? They will be required to set a new password on next login.`,
      confirmLabel: 'Force Reset',
      confirmColor: 'amber',
      requireReason: false,
      onConfirm: () => {
        onForcePasswordReset?.(user.id)
        setPendingAction(null)
      },
    })
  }

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {pendingAction && (
        <ConfirmationDialog
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          confirmColor={pendingAction.confirmColor}
          requireReason={pendingAction.requireReason}
          onConfirm={pendingAction.onConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back + actions header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => onBack?.()}
            className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </button>
          <div className="flex items-center gap-2">
            {user.status === 'active' ? (
              <button
                onClick={requestSuspend}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
              >
                <Ban className="h-3.5 w-3.5" />
                Suspend
              </button>
            ) : (
              <button
                onClick={requestReinstate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reinstate
              </button>
            )}
            <button
              onClick={requestPasswordReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset Password
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* User profile card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-blue-100 text-lg font-bold text-slate-700 dark:from-pink-900/40 dark:to-blue-900/40 dark:text-slate-200">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1
                      className="text-xl font-bold text-slate-900 dark:text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {user.name}
                    </h1>
                    <UserStatusBadge status={user.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      {user.role === 'business_admin' ? 'Business Admin' : 'Participant'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                    {user.organizationName && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {user.organizationName}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {formatDate(user.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Submissions
                  </h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{submissions.length} total</span>
                </div>
              </div>
              {submissions.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No submissions found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.bountyTitle}</p>
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(sub.submittedAt)}
                          <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                          <span style={{ fontFamily: "'Source Code Pro', monospace" }}>{sub.id}</span>
                        </p>
                      </div>
                      <SubmissionStatusBadge status={sub.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity / audit log */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Admin Activity
                </h2>
              </div>
              {auditLogs.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No admin activity for this user</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {auditLogs.map((log) => {
                    const color = actionColorConfig[log.action] ?? { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' }
                    return (
                      <div key={log.id} className="px-5 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${color.bg} ${color.text}`}>
                                {actionLabels[log.action] ?? log.action}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                by {log.actorName}
                              </span>
                            </div>
                            {(log.beforeState || log.afterState) && (
                              <div className="mt-1.5 flex items-center gap-2">
                                {log.beforeState && (
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    {log.beforeState}
                                  </span>
                                )}
                                <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                                {log.afterState && (
                                  <span className="rounded-md bg-pink-50 px-2 py-0.5 text-[11px] font-medium text-pink-600 dark:bg-pink-950/40 dark:text-pink-300">
                                    {log.afterState}
                                  </span>
                                )}
                              </div>
                            )}
                            {log.reason && (
                              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{log.reason}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">User ID</span>
                  <span
                    className="text-xs text-slate-600 dark:text-slate-300"
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {user.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Role</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {user.role === 'business_admin' ? 'Business Admin' : 'Participant'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Status</span>
                  <UserStatusBadge status={user.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Organization</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {user.organizationName ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Joined</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {formatDate(user.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submission stats */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Submission Stats
              </h3>
              <div className="space-y-2">
                {([
                  ['submitted', 'Submitted'],
                  ['in_review', 'In Review'],
                  ['needs_more_info', 'Needs Info'],
                  ['approved', 'Approved'],
                  ['rejected', 'Rejected'],
                ] as [SubmissionStatus, string][]).map(([status, label]) => {
                  const count = submissions.filter((s) => s.status === status).length
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                      <span
                        className={`text-sm font-bold ${
                          count > 0
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                        style={{ fontFamily: "'Source Code Pro', monospace" }}
                      >
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
