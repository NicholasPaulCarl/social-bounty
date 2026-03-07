/** Admin panel tab navigation */
export type AdminTab = 'dashboard' | 'users' | 'organizations' | 'oversight' | 'audit_logs' | 'troubleshooting'

/** User roles visible to the super admin */
export type UserRole = 'participant' | 'business_admin'

/** User account status */
export type UserStatus = 'active' | 'suspended'

/** Organisation status */
export type OrgStatus = 'active' | 'suspended' | 'inactive'

/** Bounty lifecycle status */
export type BountyStatus = 'draft' | 'live' | 'paused' | 'closed'

/** Submission review status */
export type SubmissionStatus = 'submitted' | 'in_review' | 'needs_more_info' | 'approved' | 'rejected'

/** Payout status */
export type PayoutStatus = 'not_paid' | 'pending' | 'paid'

/** Audit log action types */
export type AuditAction =
  | 'user.suspended'
  | 'user.reinstated'
  | 'user.password_reset'
  | 'organization.suspended'
  | 'organization.reinstated'
  | 'submission.status_override'
  | 'system.kill_switch'

/** System health status */
export type HealthStatus = 'healthy' | 'degraded' | 'down'

/** System error severity level */
export type ErrorLevel = 'info' | 'warning' | 'error'

export interface DashboardStats {
  users: { total: number; active: number; suspended: number }
  organizations: { total: number; active: number; inactive: number }
  bounties: { draft: number; live: number; paused: number; closed: number }
  submissions: { submitted: number; in_review: number; needs_more_info: number; approved: number; rejected: number }
  payouts: { not_paid: number; pending: number; paid: number }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  organizationName: string | null
  joinedAt: string
}

export interface AdminOrganization {
  id: string
  name: string
  status: OrgStatus
  memberCount: number
  bountyCount: number
  contactEmail: string
  createdAt: string
}

export interface AdminBounty {
  id: string
  title: string
  organizationName: string
  status: BountyStatus
  rewardAmount: number
  submissionCount: number
  createdAt: string
}

export interface AdminSubmission {
  id: string
  bountyTitle: string
  participantName: string
  status: SubmissionStatus
  submittedAt: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorName: string
  actorRole: string
  action: AuditAction
  entityType: string
  entityId: string
  entityLabel: string
  beforeState: string | null
  afterState: string | null
  reason: string | null
}

export interface HealthCheck {
  service: string
  status: HealthStatus
  responseTime: number
  lastChecked: string
}

export interface SystemError {
  id: string
  timestamp: string
  level: ErrorLevel
  service: string
  message: string
  count: number
}

export interface KillSwitch {
  id: string
  label: string
  description: string
  enabled: boolean
}

export interface AdminPanelProps {
  dashboardStats: DashboardStats
  users: AdminUser[]
  organizations: AdminOrganization[]
  bounties: AdminBounty[]
  submissions: AdminSubmission[]
  auditLogs: AuditLogEntry[]
  healthChecks: HealthCheck[]
  systemErrors: SystemError[]
  killSwitches: KillSwitch[]

  /** Navigate to user detail page */
  onViewUser?: (userId: string) => void
  /** Suspend a user with a mandatory reason */
  onSuspendUser?: (userId: string, reason: string) => void
  /** Reinstate a suspended user */
  onReinstateUser?: (userId: string) => void
  /** Force a user's password reset */
  onForcePasswordReset?: (userId: string) => void
  /** Navigate to organisation detail page */
  onViewOrg?: (orgId: string) => void
  /** Suspend an organisation with a mandatory reason */
  onSuspendOrg?: (orgId: string, reason: string) => void
  /** Reinstate a suspended organisation */
  onReinstateOrg?: (orgId: string) => void
  /** Override a submission's status with a mandatory reason */
  onOverrideSubmission?: (submissionId: string, newStatus: SubmissionStatus, reason: string) => void
  /** Toggle a kill switch */
  onToggleKillSwitch?: (switchId: string, enabled: boolean) => void
}

export interface UserDetailProps {
  user: AdminUser
  submissions: AdminSubmission[]
  auditLogs: AuditLogEntry[]
  /** Navigate back to admin panel */
  onBack?: () => void
  /** Suspend this user with a mandatory reason */
  onSuspendUser?: (userId: string, reason: string) => void
  /** Reinstate this user */
  onReinstateUser?: (userId: string) => void
  /** Force this user's password reset */
  onForcePasswordReset?: (userId: string) => void
}

export interface OrgDetailProps {
  organization: AdminOrganization
  members: AdminUser[]
  bounties: AdminBounty[]
  submissions: AdminSubmission[]
  auditLogs: AuditLogEntry[]
  /** Navigate back to admin panel */
  onBack?: () => void
  /** Suspend this organization with a mandatory reason */
  onSuspendOrg?: (orgId: string, reason: string) => void
  /** Reinstate this organization */
  onReinstateOrg?: (orgId: string) => void
  /** Navigate to a user's detail page */
  onViewUser?: (userId: string) => void
}
