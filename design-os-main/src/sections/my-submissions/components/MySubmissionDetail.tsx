import { useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  Link2,
  Image as ImageIcon,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Upload,
  Send,
  X,
  MessageSquare,
} from 'lucide-react'
import type { SubmissionDetailProps, SubmissionStatus, ProofItem } from '@/../product/sections/my-submissions/types'
import { SubmissionStatusBadge, PayoutBadge } from './StatusBadges'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const timelineConfig: Record<SubmissionStatus | 'submitted', { color: string; bg: string; icon: typeof Clock }> = {
  submitted: { color: 'text-blue-500', bg: 'bg-blue-500', icon: Clock },
  in_review: { color: 'text-amber-500', bg: 'bg-amber-500', icon: Eye },
  needs_more_info: { color: 'text-orange-500', bg: 'bg-orange-500', icon: AlertCircle },
  approved: { color: 'text-emerald-500', bg: 'bg-emerald-500', icon: CheckCircle2 },
  rejected: { color: 'text-red-500', bg: 'bg-red-500', icon: XCircle },
}

export function MySubmissionDetail({
  submission,
  bounty,
  onResubmit,
  onBack,
  onViewBounty,
}: SubmissionDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLinks, setEditLinks] = useState<string[]>(() =>
    submission.proof
      .filter((p): p is Extract<ProofItem, { type: 'link' }> => p.type === 'link')
      .map((p) => p.value)
  )
  const [editImageNames, setEditImageNames] = useState<string[]>(() =>
    submission.proof
      .filter((p): p is Extract<ProofItem, { type: 'image' }> => p.type === 'image')
      .map((p) => p.filename)
  )

  const needsInfo = submission.status === 'needs_more_info'
  const latestNote = [...submission.timeline].reverse().find((t) => t.note)

  function addLink() {
    setEditLinks([...editLinks, ''])
  }

  function removeLink(index: number) {
    if (editLinks.length <= 1) return
    setEditLinks(editLinks.filter((_, i) => i !== index))
  }

  function updateLink(index: number, value: string) {
    const updated = [...editLinks]
    updated[index] = value
    setEditLinks(updated)
  }

  function handleResubmit() {
    const validLinks = editLinks.filter((l) => l.trim().length > 0)
    onResubmit?.(validLinks, [])
    setIsEditing(false)
  }

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBack?.()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <SubmissionStatusBadge status={submission.status} />
          </div>

          {needsInfo && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              <AlertCircle className="h-4 w-4" />
              Edit & Resubmit
            </button>
          )}
        </div>

        {/* Needs More Info banner */}
        {needsInfo && latestNote && (
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Reviewer requested more information</p>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300 whitespace-pre-wrap">{latestNote.note}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Bounty info */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => onViewBounty?.(bounty.id)}
                className="group flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {bounty.organizationName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-pink-700 dark:text-white dark:group-hover:text-pink-300">
                    {bounty.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {bounty.organizationName} &middot; {bounty.categoryName} &middot; <span
                      className="font-semibold text-pink-600 dark:text-pink-400"
                      style={{ fontFamily: "'Source Code Pro', monospace" }}
                    >{formatCurrency(bounty.rewardAmount)}</span>
                  </p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-slate-300 group-hover:text-pink-500 dark:text-slate-600" />
              </button>
            </div>

            {/* Proof section — read-only or editing */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {isEditing ? 'Edit Proof' : 'Proof Submitted'}
                </h3>
              </div>

              {isEditing ? (
                /* Inline edit form */
                <div className="p-5 space-y-5">
                  {/* Links */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Links</span>
                      </div>
                      <button
                        onClick={addLink}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="url"
                              value={link}
                              onChange={(e) => updateLink(i, e.target.value)}
                              placeholder="https://..."
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:bg-slate-900 dark:focus:ring-pink-900/30"
                            />
                          </div>
                          {editLinks.length > 1 && (
                            <button
                              onClick={() => removeLink(i)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Images</span>
                    </div>
                    {editImageNames.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {editImageNames.map((name, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{name}</span>
                            </div>
                            <button
                              onClick={() => setEditImageNames(editImageNames.filter((_, j) => j !== i))}
                              className="rounded p-1 text-slate-400 transition-colors hover:text-red-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setEditImageNames([...editImageNames, `new-proof-${editImageNames.length + 1}.png`])}
                      className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-6 transition-colors hover:border-pink-300 hover:bg-pink-50/30 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-pink-700"
                    >
                      <Upload className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Upload images</p>
                    </button>
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResubmit}
                      disabled={editLinks.every((l) => !l.trim())}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-pink-500 dark:hover:bg-pink-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Resubmit
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-only proof display */
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {submission.proof.map((proof, i) => (
                    <div key={i} className="px-5 py-4">
                      {proof.type === 'link' && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Link</span>
                          </div>
                          <a
                            href={proof.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="max-w-sm truncate">{proof.value}</span>
                          </a>
                        </div>
                      )}
                      {proof.type === 'image' && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{proof.filename}</span>
                          </div>
                          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            <img src={proof.url} alt={proof.alt} className="h-40 w-full object-cover" />
                          </div>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{proof.alt}</p>
                        </div>
                      )}
                      {proof.type === 'text' && (
                        <div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Text</span>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{proof.value}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Status Timeline
                </h3>
              </div>
              <div className="px-5 py-4">
                <div className="relative">
                  <div className="absolute bottom-0 left-3 top-0 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-6">
                    {submission.timeline.map((entry, i) => {
                      const config = timelineConfig[entry.status]
                      const Icon = config.icon
                      const isLast = i === submission.timeline.length - 1
                      return (
                        <div key={i} className="relative flex gap-4">
                          <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            isLast ? config.bg : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            <Icon className={`h-3 w-3 ${isLast ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <SubmissionStatusBadge status={entry.status as SubmissionStatus} />
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {formatDateTime(entry.changedAt)}
                              </span>
                            </div>
                            {entry.note && (
                              <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{entry.note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payout card */}
            {submission.payout && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Payout
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                    <PayoutBadge status={submission.payout.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Amount</span>
                    <span
                      className="text-sm font-bold text-slate-900 dark:text-white"
                      style={{ fontFamily: "'Source Code Pro', monospace" }}
                    >
                      {formatCurrency(submission.payout.amount)}
                    </span>
                  </div>
                  {submission.payout.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Paid on</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {formatDate(submission.payout.paidAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submission meta */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Submitted
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatDateTime(submission.submittedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Clock className="h-3 w-3" />
                    Last updated
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatDateTime(submission.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <DollarSign className="h-3 w-3" />
                    Reward
                  </span>
                  <span
                    className="text-xs font-bold text-pink-600 dark:text-pink-400"
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {formatCurrency(bounty.rewardAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">ID</span>
                  <span
                    className="text-xs text-slate-400 dark:text-slate-500"
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {submission.id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
