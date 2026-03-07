import type { SubmissionStatus, PayoutStatus } from '../types'

const statusConfig: Record<SubmissionStatus, { label: string; bg: string; text: string; dot: string }> = {
  submitted: {
    label: 'Submitted',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  needs_more_info: {
    label: 'Needs Info',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500 dark:bg-red-400',
  },
}

const payoutConfig: Record<PayoutStatus, { label: string; bg: string; text: string }> = {
  not_paid: {
    label: 'Not Paid',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function PayoutBadge({ status }: { status: PayoutStatus }) {
  const config = payoutConfig[status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
