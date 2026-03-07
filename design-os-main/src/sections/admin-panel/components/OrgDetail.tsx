import { useState } from 'react'
import {
  ArrowLeft,
  Mail,
  Calendar,
  Users,
  Megaphone,
  Ban,
  RotateCcw,
  Eye,
  Inbox,
  Clock,
  ArrowRight,
} from 'lucide-react'
import type { OrgDetailProps } from '@/../product/sections/admin-panel/types'
import { OrgStatusBadge, UserStatusBadge, BountyStatusBadge, SubmissionStatusBadge } from './StatusBadges'
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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

export function OrgDetail({
  organization,
  members,
  bounties,
  submissions,
  auditLogs,
  onBack,
  onSuspendOrg,
  onReinstateOrg,
  onViewUser,
}: OrgDetailProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [activeSection, setActiveSection] = useState<'members' | 'bounties' | 'submissions'>('members')

  function requestSuspend() {
    setPendingAction({
      title: 'Suspend Organization',
      description: `Are you sure you want to suspend ${organization.name}? All live bounties will be paused and new bounties/submissions will be blocked.`,
      confirmLabel: 'Suspend Organization',
      confirmColor: 'red',
      requireReason: true,
      onConfirm: (reason) => {
        onSuspendOrg?.(organization.id, reason)
        setPendingAction(null)
      },
    })
  }

  function requestReinstate() {
    setPendingAction({
      title: 'Reinstate Organization',
      description: `Reinstate ${organization.name}? They will regain the ability to create bounties and receive submissions.`,
      confirmLabel: 'Reinstate Organization',
      confirmColor: 'emerald',
      requireReason: false,
      onConfirm: () => {
        onReinstateOrg?.(organization.id)
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
        {/* Back + actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => onBack?.()}
            className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organizations
          </button>
          <div className="flex items-center gap-2">
            {organization.status === 'active' ? (
              <button
                onClick={requestSuspend}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
              >
                <Ban className="h-3.5 w-3.5" />
                Suspend
              </button>
            ) : organization.status === 'suspended' ? (
              <button
                onClick={requestReinstate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reinstate
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Org header card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-blue-500 text-lg font-bold text-white">
                  {organization.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1
                      className="text-xl font-bold text-slate-900 dark:text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {organization.name}
                    </h1>
                    <OrgStatusBadge status={organization.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {organization.contactEmail}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Created {formatDate(organization.createdAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 dark:bg-slate-800">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{organization.memberCount}</span>
                      <span className="text-xs text-slate-400">members</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 dark:bg-slate-800">
                      <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{organization.bountyCount}</span>
                      <span className="text-xs text-slate-400">bounties</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
              {([
                { id: 'members' as const, label: 'Members', count: members.length },
                { id: 'bounties' as const, label: 'Bounties', count: bounties.length },
                { id: 'submissions' as const, label: 'Submissions', count: submissions.length },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    activeSection === tab.id
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  <span className="text-xs text-slate-400 dark:text-slate-500">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Members list */}
            {activeSection === 'members' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {members.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No members found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                            <UserStatusBadge status={member.status} />
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {member.email}
                            <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                            {member.role === 'business_admin' ? 'Business Admin' : 'Participant'}
                          </p>
                        </div>
                        <button
                          onClick={() => onViewUser?.(member.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="View user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bounties list */}
            {activeSection === 'bounties' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {bounties.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No bounties found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {bounties.map((bounty) => (
                      <div key={bounty.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{bounty.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            {bounty.submissionCount} submissions
                            <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                            {formatDate(bounty.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-semibold text-slate-900 dark:text-white"
                            style={{ fontFamily: "'Source Code Pro', monospace" }}
                          >
                            {formatCurrency(bounty.rewardAmount)}
                          </span>
                          <BountyStatusBadge status={bounty.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submissions list */}
            {activeSection === 'submissions' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
                            {sub.participantName}
                            <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                            {formatDate(sub.submittedAt)}
                          </p>
                        </div>
                        <SubmissionStatusBadge status={sub.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audit log */}
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
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No admin activity for this organization</p>
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
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Org ID</span>
                  <span
                    className="text-xs text-slate-600 dark:text-slate-300"
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {organization.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Status</span>
                  <OrgStatusBadge status={organization.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Members</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{organization.memberCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Bounties</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{organization.bountyCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Contact</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{organization.contactEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Created</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {formatDate(organization.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bounty status breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Bounty Breakdown
              </h3>
              <div className="space-y-2">
                {([
                  ['live', 'Live'],
                  ['paused', 'Paused'],
                  ['draft', 'Draft'],
                  ['closed', 'Closed'],
                ] as const).map(([status, label]) => {
                  const count = bounties.filter((b) => b.status === status).length
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
