import { useState } from 'react'
import {
  ArrowLeft,
  Pencil,
  Rocket,
  Pause,
  Play,
  XCircle,
  Copy,
  ExternalLink,
  Calendar,
  DollarSign,
  Users,
  Star,
  Tag,
  FileText,
  Link2,
  ImageIcon,
  Type,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import type { BountyDetailProps, BountyStatus } from '@/../product/sections/bounty-management/types'
import { StatusBadge, PriorityBadge } from './StatusBadge'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
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

const proofTypeIcons: Record<string, typeof Type> = {
  text: Type,
  link: Link2,
  image: ImageIcon,
}

const statusTimelineConfig: Record<BountyStatus, { color: string; icon: typeof CheckCircle2 }> = {
  draft: { color: 'bg-slate-400 dark:bg-slate-500', icon: FileText },
  live: { color: 'bg-emerald-500 dark:bg-emerald-400', icon: Rocket },
  paused: { color: 'bg-amber-500 dark:bg-amber-400', icon: Pause },
  closed: { color: 'bg-red-500 dark:bg-red-400', icon: XCircle },
}

export function BountyDetail({
  bounty,
  category,
  onEdit,
  onPublish,
  onPause,
  onResume,
  onClose,
  onDuplicate,
  onViewSubmissions,
  onBack,
}: BountyDetailProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => onBack?.()}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bounties
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={bounty.status} />
                <PriorityBadge priority={bounty.priority} />
                {bounty.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Star className="h-3 w-3 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <h1
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {bounty.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {category?.name ?? 'Uncategorized'} &middot; Created {formatDate(bounty.createdAt)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {(bounty.status === 'draft' || bounty.status === 'live') && (
                <button
                  onClick={() => onEdit?.()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {bounty.status === 'draft' && (
                <button
                  onClick={() => onPublish?.()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Publish
                </button>
              )}
              {bounty.status === 'live' && (
                <button
                  onClick={() => onPause?.()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </button>
              )}
              {bounty.status === 'paused' && (
                <button
                  onClick={() => onResume?.()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </button>
              )}
              {bounty.status !== 'closed' && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Close
                </button>
              )}
              <button
                onClick={() => onDuplicate?.()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </button>
            </div>
          </div>
        </div>

        {/* Close confirmation dialog */}
        {showCloseConfirm && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowCloseConfirm(false)} />
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3
                className="text-lg font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Close this bounty?
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This action is permanent. Closed bounties cannot be reopened. Any pending submissions will need to be reviewed before closing.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClose?.()
                    setShowCloseConfirm(false)
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  Yes, close bounty
                </button>
              </div>
            </div>
          </>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {bounty.description}
              </p>
            </section>

            {/* Instructions */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Instructions
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {bounty.instructions.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>

            {/* Eligibility & Proof */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Requirements
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Eligibility</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{bounty.eligibilityCriteria}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Proof Required</p>
                  <div className="flex flex-wrap gap-2">
                    {bounty.proofRequirements.map((type) => {
                      const Icon = proofTypeIcons[type] || FileText
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {bounty.proofTemplate && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Proof Template</p>
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                      <pre
                        className="whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400"
                        style={{ fontFamily: "'Source Code Pro', monospace" }}
                      >
                        {bounty.proofTemplate}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Terms & Conditions */}
            {bounty.termsAndConditions && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Terms & Conditions
                </h2>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {bounty.termsAndConditions}
                </p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key metrics */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Details
              </h2>
              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    Reward
                  </dt>
                  <dd
                    className="text-lg font-bold text-slate-900 dark:text-white"
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {formatCurrency(bounty.rewardAmount)}
                  </dd>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    Submissions
                  </dt>
                  <dd className="text-sm font-semibold text-slate-900 dark:text-white">
                    {bounty.submissionCount} / {bounty.maxSubmissions}
                  </dd>
                </div>
                {bounty.submissionCount > 0 && (
                  <button
                    onClick={() => onViewSubmissions?.()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in Review Center
                  </button>
                )}
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    Start
                  </dt>
                  <dd className="text-sm text-slate-700 dark:text-slate-300">{formatDate(bounty.startDate)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    End
                  </dt>
                  <dd className="text-sm text-slate-700 dark:text-slate-300">{formatDate(bounty.endDate)}</dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            {bounty.tags.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {bounty.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Status History
              </h2>
              <div className="relative space-y-0">
                {bounty.statusHistory.map((entry, i) => {
                  const config = statusTimelineConfig[entry.status]
                  const Icon = config.icon
                  const isLast = i === bounty.statusHistory.length - 1
                  return (
                    <div key={i} className="relative flex gap-3 pb-4">
                      {!isLast && (
                        <div className="absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 bg-slate-200 dark:bg-slate-700" />
                      )}
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                          {entry.status}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(entry.changedAt)}
                        </p>
                      </div>
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
