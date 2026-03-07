import type { BountyStatus, BountyPriority } from '../types'

const statusConfig: Record<BountyStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  live: {
    label: 'Live',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  paused: {
    label: 'Paused',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  closed: {
    label: 'Closed',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500 dark:bg-red-400',
  },
}

const priorityConfig: Record<BountyPriority, { label: string; bg: string; text: string }> = {
  low: {
    label: 'Low',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
  },
  high: {
    label: 'High',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-600 dark:text-pink-400',
  },
}

export function StatusBadge({ status }: { status: BountyStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: BountyPriority }) {
  const config = priorityConfig[priority]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
