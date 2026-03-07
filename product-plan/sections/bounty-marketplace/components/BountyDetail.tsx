import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Users,
  Building2,
  Tag,
  FileText,
  Link2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  XCircle,
  Shield,
  LogIn,
  Ban,
} from 'lucide-react'
import type { BountyDetailPageProps, SubmissionStatus } from '../types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDeadline(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date('2026-03-07T12:00:00Z')
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Ended'
  if (diffDays === 0) return 'Ends today'
  if (diffDays === 1) return 'Ends tomorrow'
  if (diffDays <= 7) return `${diffDays} days left`
  return null
}

const submissionStatusConfig: Record<SubmissionStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  submitted: { label: 'Submitted — Awaiting Review', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', icon: Clock },
  in_review: { label: 'In Review', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', icon: Eye },
  needs_more_info: { label: 'Needs More Info — Check My Submissions', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', icon: AlertCircle },
  approved: { label: 'Approved — Reward Earned!', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', icon: XCircle },
}

const proofTypeLabels = {
  text: { label: 'Text', icon: FileText },
  link: { label: 'Link', icon: Link2 },
  image: { label: 'Image', icon: ImageIcon },
}

export function BountyDetail({
  bounty,
  category,
  organization,
  userSubmission,
  isAuthenticated = true,
  onSubmitProof,
  onBack,
  onLogin,
}: BountyDetailPageProps) {
  const full = bounty.maxSubmissions !== null && bounty.currentSubmissions >= bounty.maxSubmissions
  const deadline = formatDeadline(bounty.endDate)
  const urgentDeadline = deadline && (deadline.includes('day') || deadline === 'Ends today' || deadline === 'Ends tomorrow')
  const canSubmit = !full && !userSubmission

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back + action header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => onBack?.()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bounties
          </button>

          {/* CTA */}
          {userSubmission ? (
            (() => {
              const cfg = submissionStatusConfig[userSubmission.status]
              const Icon = cfg.icon
              return (
                <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.text}`} />
                  <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
                </div>
              )
            })()
          ) : full ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
              <Ban className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Bounty is full</span>
            </div>
          ) : !isAuthenticated ? (
            <button
              onClick={() => onLogin?.()}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
            >
              <LogIn className="h-4 w-4" />
              Log in to Submit
            </button>
          ) : (
            <button
              onClick={() => onSubmitProof?.()}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
            >
              Submit Proof
            </button>
          )}
        </div>

        {/* Urgent deadline banner */}
        {urgentDeadline && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/30">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">{deadline}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Title + org */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {organization.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{organization.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Posted {formatDate(bounty.startDate)}</p>
                </div>
              </div>
              <h1
                className="text-2xl font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {bounty.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {bounty.shortDescription}
              </p>
            </div>

            {/* Full instructions */}
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h2
                  className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Instructions & Requirements
                </h2>
              </div>
              <div className="px-6 py-5">
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                  {bounty.fullDescription.split('\n\n').map((paragraph, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      {paragraph.split('\n').map((line, j) => {
                        if (line.startsWith('- ')) {
                          return (
                            <div key={j} className="ml-4 flex items-start gap-2 mb-1">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pink-400" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{line.slice(2)}</span>
                            </div>
                          )
                        }
                        if (/^\d+\./.test(line)) {
                          const match = line.match(/^(\d+)\.\s*\*\*(.*?)\*\*\s*—?\s*(.*)/)
                          if (match) {
                            return (
                              <div key={j} className="ml-4 flex items-start gap-2 mb-1.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-[10px] font-bold text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
                                  {match[1]}
                                </span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  <strong>{match[2]}</strong>{match[3] ? ` — ${match[3]}` : ''}
                                </span>
                              </div>
                            )
                          }
                          return <p key={j} className="text-sm text-slate-700 dark:text-slate-300 mb-1">{line}</p>
                        }
                        return <p key={j} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{line}</p>
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eligibility</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {bounty.eligibilityText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Reward
              </h3>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-pink-500" />
                <span
                  className="text-2xl font-bold text-slate-900 dark:text-white"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  {formatCurrency(bounty.rewardAmount)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 capitalize">{bounty.rewardType.replace('_', ' ')}</p>
            </div>

            {/* Details card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Tag className="h-3 w-3" />
                    Category
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Building2 className="h-3 w-3" />
                    Organization
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{organization.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3 w-3" />
                    Started
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(bounty.startDate)}
                  </span>
                </div>
                {bounty.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <Calendar className="h-3 w-3" />
                      Deadline
                    </span>
                    <span className={`text-xs font-medium ${
                      urgentDeadline
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {formatDate(bounty.endDate)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Users className="h-3 w-3" />
                    Submissions
                  </span>
                  <span className={`text-xs font-medium ${
                    full
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {bounty.maxSubmissions !== null
                      ? `${bounty.currentSubmissions} / ${bounty.maxSubmissions}`
                      : `${bounty.currentSubmissions}`
                    }
                    {full && ' (Full)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Required proof card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3
                className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Required Proof
              </h3>
              <div className="space-y-2">
                {bounty.proofRequirements.map((type) => {
                  const config = proofTypeLabels[type]
                  const Icon = config.icon
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{config.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile CTA (sticky bottom on mobile) */}
            <div className="lg:hidden">
              {canSubmit && isAuthenticated && (
                <button
                  onClick={() => onSubmitProof?.()}
                  className="w-full rounded-xl bg-pink-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
                >
                  Submit Proof
                </button>
              )}
              {canSubmit && !isAuthenticated && (
                <button
                  onClick={() => onLogin?.()}
                  className="w-full rounded-xl bg-pink-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
                >
                  <LogIn className="mr-2 inline h-4 w-4" />
                  Log in to Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
