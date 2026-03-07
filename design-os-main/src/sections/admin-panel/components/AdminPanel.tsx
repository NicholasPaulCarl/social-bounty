import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Building2,
  Eye,
  ScrollText,
  Wrench,
  Shield,
} from 'lucide-react'
import type { AdminPanelProps, AdminTab, SubmissionStatus } from '@/../product/sections/admin-panel/types'
import { DashboardTab } from './DashboardTab'
import { UsersTab } from './UsersTab'
import { OrganizationsTab } from './OrganizationsTab'
import { OversightTab } from './OversightTab'
import { AuditLogsTab } from './AuditLogsTab'
import { TroubleshootingTab } from './TroubleshootingTab'
import { ConfirmationDialog } from './ConfirmationDialog'

type PendingAction = {
  title: string
  description: string
  confirmLabel: string
  confirmColor: 'red' | 'emerald' | 'pink' | 'amber'
  requireReason: boolean
  onConfirm: (reason: string) => void
} | null

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'oversight', label: 'Oversight', icon: Eye },
  { id: 'audit_logs', label: 'Audit Logs', icon: ScrollText },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
]

export function AdminPanel({
  dashboardStats,
  users,
  organizations,
  bounties,
  submissions,
  auditLogs,
  healthChecks,
  systemErrors,
  killSwitches,
  onViewUser,
  onSuspendUser,
  onReinstateUser,
  onForcePasswordReset,
  onViewOrg,
  onSuspendOrg,
  onReinstateOrg,
  onOverrideSubmission,
  onToggleKillSwitch,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  // Confirmation dialog launchers
  function requestSuspendUser(userId: string, userName: string) {
    setPendingAction({
      title: 'Suspend User',
      description: `Are you sure you want to suspend ${userName}? They will lose access to the platform until reinstated.`,
      confirmLabel: 'Suspend User',
      confirmColor: 'red',
      requireReason: true,
      onConfirm: (reason) => {
        onSuspendUser?.(userId, reason)
        setPendingAction(null)
      },
    })
  }

  function requestReinstateUser(userId: string, userName: string) {
    setPendingAction({
      title: 'Reinstate User',
      description: `Reinstate ${userName}? They will regain full access to the platform.`,
      confirmLabel: 'Reinstate User',
      confirmColor: 'emerald',
      requireReason: false,
      onConfirm: () => {
        onReinstateUser?.(userId)
        setPendingAction(null)
      },
    })
  }

  function requestForcePasswordReset(userId: string, userName: string) {
    setPendingAction({
      title: 'Force Password Reset',
      description: `Force a password reset for ${userName}? They will be required to set a new password on next login.`,
      confirmLabel: 'Force Reset',
      confirmColor: 'amber',
      requireReason: false,
      onConfirm: () => {
        onForcePasswordReset?.(userId)
        setPendingAction(null)
      },
    })
  }

  function requestSuspendOrg(orgId: string, orgName: string) {
    setPendingAction({
      title: 'Suspend Organization',
      description: `Are you sure you want to suspend ${orgName}? All live bounties will be paused and new bounties/submissions will be blocked.`,
      confirmLabel: 'Suspend Organization',
      confirmColor: 'red',
      requireReason: true,
      onConfirm: (reason) => {
        onSuspendOrg?.(orgId, reason)
        setPendingAction(null)
      },
    })
  }

  function requestReinstateOrg(orgId: string, orgName: string) {
    setPendingAction({
      title: 'Reinstate Organization',
      description: `Reinstate ${orgName}? They will regain the ability to create bounties and receive submissions.`,
      confirmLabel: 'Reinstate Organization',
      confirmColor: 'emerald',
      requireReason: false,
      onConfirm: () => {
        onReinstateOrg?.(orgId)
        setPendingAction(null)
      },
    })
  }

  function requestOverrideSubmission(submissionId: string, participantName: string, currentStatus: SubmissionStatus) {
    setPendingAction({
      title: 'Override Submission Status',
      description: `Override the status of ${participantName}'s submission (currently "${currentStatus.replace(/_/g, ' ')}")? This action is audit-logged with before/after state.`,
      confirmLabel: 'Override Status',
      confirmColor: 'pink',
      requireReason: true,
      onConfirm: (reason) => {
        onOverrideSubmission?.(submissionId, 'approved' as SubmissionStatus, reason)
        setPendingAction(null)
      },
    })
  }

  function requestToggleKillSwitch(switchId: string, enabled: boolean, label: string) {
    setPendingAction({
      title: enabled ? `Enable ${label}` : `Disable ${label}`,
      description: enabled
        ? `Enable the "${label}" feature? This will restore normal platform functionality.`
        : `Disable the "${label}" feature? This will immediately affect users.`,
      confirmLabel: enabled ? 'Enable' : 'Disable',
      confirmColor: enabled ? 'emerald' : 'red',
      requireReason: true,
      onConfirm: (reason) => {
        onToggleKillSwitch?.(switchId, enabled)
        setPendingAction(null)
      },
    })
  }

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Confirmation dialog */}
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-100 p-2 dark:bg-pink-950/40">
              <Shield className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Admin Panel
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Platform oversight and management
              </p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-pink-500 text-pink-600 dark:border-pink-400 dark:text-pink-400'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={dashboardStats}
            recentLogs={auditLogs}
            healthChecks={healthChecks}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onViewUser={onViewUser}
            onSuspendUser={requestSuspendUser}
            onReinstateUser={requestReinstateUser}
            onForcePasswordReset={requestForcePasswordReset}
          />
        )}

        {activeTab === 'organizations' && (
          <OrganizationsTab
            organizations={organizations}
            onViewOrg={onViewOrg}
            onSuspendOrg={requestSuspendOrg}
            onReinstateOrg={requestReinstateOrg}
          />
        )}

        {activeTab === 'oversight' && (
          <OversightTab
            bounties={bounties}
            submissions={submissions}
            onOverrideSubmission={requestOverrideSubmission}
          />
        )}

        {activeTab === 'audit_logs' && (
          <AuditLogsTab auditLogs={auditLogs} />
        )}

        {activeTab === 'troubleshooting' && (
          <TroubleshootingTab
            healthChecks={healthChecks}
            systemErrors={systemErrors}
            killSwitches={killSwitches}
            onToggleKillSwitch={requestToggleKillSwitch}
          />
        )}
      </div>
    </div>
  )
}
