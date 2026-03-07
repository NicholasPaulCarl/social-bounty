import type {
  UserStatus,
  OrgStatus,
  BountyStatus,
  SubmissionStatus,
  HealthStatus,
  ErrorLevel,
} from '@/../product/sections/admin-panel/types'

const userStatusConfig: Record<UserStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  suspended: {
    label: 'Suspended',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

const orgStatusConfig: Record<OrgStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  suspended: {
    label: 'Suspended',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

const bountyStatusConfig: Record<BountyStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  live: {
    label: 'Live',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  paused: {
    label: 'Paused',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  closed: {
    label: 'Closed',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

const submissionStatusConfig: Record<SubmissionStatus, { label: string; bg: string; text: string; dot: string }> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  needs_more_info: {
    label: 'Needs Info',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

const healthStatusConfig: Record<HealthStatus, { label: string; bg: string; text: string; dot: string }> = {
  healthy: {
    label: 'Healthy',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  degraded: {
    label: 'Degraded',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  down: {
    label: 'Down',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

const errorLevelConfig: Record<ErrorLevel, { label: string; bg: string; text: string }> = {
  info: {
    label: 'Info',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    label: 'Warning',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  error: {
    label: 'Error',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
  },
}

function Badge({ bg, text, dot, label }: { bg: string; text: string; dot?: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const c = userStatusConfig[status]
  return <Badge {...c} />
}

export function OrgStatusBadge({ status }: { status: OrgStatus }) {
  const c = orgStatusConfig[status]
  return <Badge {...c} />
}

export function BountyStatusBadge({ status }: { status: BountyStatus }) {
  const c = bountyStatusConfig[status]
  return <Badge {...c} />
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const c = submissionStatusConfig[status]
  return <Badge {...c} />
}

export function HealthStatusBadge({ status }: { status: HealthStatus }) {
  const c = healthStatusConfig[status]
  return <Badge {...c} />
}

export function ErrorLevelBadge({ level }: { level: ErrorLevel }) {
  const c = errorLevelConfig[level]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
