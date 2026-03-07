import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Clock,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Ban,
  Banknote,
  User,
  Tag,
  Calendar,
} from 'lucide-react'
import type { SubmissionDetailProps, ProofItem, ReviewHistoryEntry, SubmissionStatus } from '@/../product/sections/review-center/types'
import { SubmissionStatusBadge, PayoutBadge } from './StatusBadge'

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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const statusTimelineConfig: Record<SubmissionStatus | 'submitted', { color: string; bg: string; icon: typeof Clock }> = {
  submitted: { color: 'text-blue-500', bg: 'bg-blue-500', icon: Clock },
  in_review: { color: 'text-amber-500', bg: 'bg-amber-500', icon: Clock },
  needs_more_info: { color: 'text-orange-500', bg: 'bg-orange-500', icon: AlertCircle },
  approved: { color: 'text-emerald-500', bg: 'bg-emerald-500', icon: CheckCircle2 },
  rejected: { color: 'text-red-500', bg: 'bg-red-500', icon: XCircle },
}

export function SubmissionDetail({
  submission,
  participant,
  bounty,
  onApprove,
  onReject,
  onRequestMoreInfo,
  onMarkPaid,
  onBack,
  onOpenLightbox,
}: SubmissionDetailProps) {
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | 'info' | null>(null)
  const [actionText, setActionText] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const imageProofs = submission.proof.filter((p): p is Extract<ProofItem, { type: 'image' }> => p.type === 'image')

  const canApprove = submission.status === 'submitted' || submission.status === 'in_review' || submission.status === 'needs_more_info'
  const canReject = canApprove
  const canRequestInfo = canApprove
  const canMarkPaid = submission.status === 'approved' && submission.payout && submission.payout.status !== 'paid'

  function handleSubmitAction() {
    if (actionMode === 'approve') {
      onApprove?.(actionText || undefined)
    } else if (actionMode === 'reject') {
      if (!actionText.trim()) return
      onReject?.(actionText)
    } else if (actionMode === 'info') {
      if (!actionText.trim()) return
      onRequestMoreInfo?.(actionText)
    }
    setActionMode(null)
    setActionText('')
  }

  function openLightbox(index: number) {
    if (onOpenLightbox) {
      onOpenLightbox(imageProofs[index].url)
    } else {
      setLightboxIndex(index)
    }
  }

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Lightbox overlay */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {imageProofs.length > 1 && (
            <>
              <button
                onClick={() => setLightboxIndex((i) => (i! > 0 ? i! - 1 : imageProofs.length - 1))}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setLightboxIndex((i) => (i! < imageProofs.length - 1 ? i! + 1 : 0))}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 top-1/2 -translate-y-1/2"
                style={{ right: '1rem' }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="max-h-[85vh] max-w-[90vw]">
            <img
              src={imageProofs[lightboxIndex].url}
              alt={imageProofs[lightboxIndex].alt}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
            <p className="mt-3 text-center text-sm text-white/70">{imageProofs[lightboxIndex].alt}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button + status header */}
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

          {/* Action buttons - sticky on scroll */}
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                onClick={() => { setActionMode('approve'); setActionText('') }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            )}
            {canReject && (
              <button
                onClick={() => { setActionMode('reject'); setActionText('') }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            )}
            {canRequestInfo && (
              <button
                onClick={() => { setActionMode('info'); setActionText('') }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/50"
              >
                <AlertCircle className="h-4 w-4" />
                Need Info
              </button>
            )}
            {canMarkPaid && (
              <button
                onClick={() => onMarkPaid?.()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
              >
                <Banknote className="h-4 w-4" />
                Mark Paid
              </button>
            )}
          </div>
        </div>

        {/* Action panel (slide-down) */}
        {actionMode && (
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className={`border-b px-5 py-3 ${
              actionMode === 'approve'
                ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                : actionMode === 'reject'
                ? 'border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                : 'border-orange-100 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {actionMode === 'approve' && 'Approve Submission'}
                  {actionMode === 'reject' && 'Reject Submission'}
                  {actionMode === 'info' && 'Request More Information'}
                </h3>
                <button
                  onClick={() => setActionMode(null)}
                  className="rounded p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <textarea
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder={
                  actionMode === 'approve'
                    ? 'Optional note (e.g., "Great work!")...'
                    : actionMode === 'reject'
                    ? 'Reason for rejection (required)...'
                    : 'What additional information is needed? (required)...'
                }
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:bg-slate-900 dark:focus:ring-pink-900/30"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {actionMode === 'approve' && 'Note is optional'}
                  {actionMode === 'reject' && 'A reason is required to reject'}
                  {actionMode === 'info' && 'A message is required'}
                </p>
                <button
                  onClick={handleSubmitAction}
                  disabled={actionMode !== 'approve' && !actionText.trim()}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-40 ${
                    actionMode === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500'
                      : actionMode === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500'
                      : 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  {actionMode === 'approve' ? 'Confirm Approval' : actionMode === 'reject' ? 'Confirm Rejection' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content (left 2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Participant info */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-blue-100 text-sm font-bold text-slate-700 dark:from-pink-900/40 dark:to-blue-900/40 dark:text-slate-200">
                  {getInitials(participant.name)}
                </div>
                <div>
                  <h2
                    className="text-lg font-bold text-slate-900 dark:text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {participant.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{participant.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Submitted</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(submission.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Proof section */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Proof of Completion
                </h3>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {submission.proof.length} item{submission.proof.length !== 1 ? 's' : ''} submitted
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {submission.proof.map((proof, i) => (
                  <div key={i} className="px-5 py-4">
                    {proof.type === 'text' && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Text proof</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {proof.value}
                          </p>
                        </div>
                      </div>
                    )}
                    {proof.type === 'link' && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Link proof</span>
                        </div>
                        <a
                          href={proof.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
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
                        <button
                          onClick={() => openLightbox(imageProofs.indexOf(proof))}
                          className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <img
                            src={proof.url}
                            alt={proof.alt}
                            className="h-48 w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              View full size
                            </span>
                          </div>
                        </button>
                        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{proof.alt}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Review history timeline */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Review History
                </h3>
              </div>
              <div className="px-5 py-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute bottom-0 left-3 top-0 w-px bg-slate-200 dark:bg-slate-700" />

                  <div className="space-y-6">
                    {submission.reviewHistory.map((entry: ReviewHistoryEntry, i: number) => {
                      const config = statusTimelineConfig[entry.status]
                      const StatusIcon = config.icon
                      const isLast = i === submission.reviewHistory.length - 1
                      return (
                        <div key={i} className="relative flex gap-4 pl-0">
                          {/* Dot */}
                          <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            isLast ? config.bg : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            <StatusIcon className={`h-3 w-3 ${isLast ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                          </div>
                          <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-0'}`}>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <SubmissionStatusBadge status={entry.status as SubmissionStatus} />
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {formatDateTime(entry.changedAt)}
                              </span>
                              {entry.changedBy && (
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  by <span className="font-medium text-slate-600 dark:text-slate-300">{entry.changedBy}</span>
                                </span>
                              )}
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

          {/* Sidebar (right col) */}
          <div className="space-y-6">
            {/* Bounty context card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Bounty Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{bounty.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {bounty.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <span
                    className="text-lg font-bold text-slate-900 dark:text-white"
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {formatCurrency(bounty.rewardAmount)}
                  </span>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Required proof</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bounty.proofRequirements.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {type === 'text' && <FileText className="h-3 w-3" />}
                        {type === 'link' && <Link2 className="h-3 w-3" />}
                        {type === 'image' && <ImageIcon className="h-3 w-3" />}
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                  {canMarkPaid && (
                    <button
                      onClick={() => onMarkPaid?.()}
                      className="mt-2 w-full rounded-lg bg-pink-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
                    >
                      Mark as Paid
                    </button>
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
                    <User className="h-3 w-3" />
                    Participant
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {participant.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    ID
                  </span>
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
