import { useState, useMemo } from 'react'
import {
  Search,
  Inbox,
  Clock,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Banknote,
} from 'lucide-react'
import type { ReviewCenterProps, Submission, SubmissionStatus } from '../types'
import { SubmissionStatusBadge, PayoutBadge } from './StatusBadge'

type SortField = 'submittedAt' | 'status' | 'reward'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 8

const statusTabs: { label: string; value: SubmissionStatus | 'all'; icon: typeof Inbox }[] = [
  { label: 'All', value: 'all', icon: Inbox },
  { label: 'Submitted', value: 'submitted', icon: Clock },
  { label: 'In Review', value: 'in_review', icon: Eye },
  { label: 'Needs Info', value: 'needs_more_info', icon: AlertCircle },
  { label: 'Approved', value: 'approved', icon: CheckCircle2 },
  { label: 'Rejected', value: 'rejected', icon: XCircle },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelativeDate(dateStr: string) {
  const now = new Date('2026-03-07T12:00:00Z')
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
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

export function SubmissionQueue({
  submissions,
  participants,
  bounties,
  onViewSubmission,
  onMarkPaid,
}: ReviewCenterProps) {
  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('submittedAt')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [bountyFilter, setBountyFilter] = useState<string>('all')

  const participantMap = useMemo(
    () => Object.fromEntries(participants.map((p) => [p.id, p])),
    [participants]
  )
  const bountyMap = useMemo(
    () => Object.fromEntries(bounties.map((b) => [b.id, b])),
    [bounties]
  )

  const filtered = useMemo(() => {
    let result = submissions
    if (activeTab !== 'all') {
      result = result.filter((s) => s.status === activeTab)
    }
    if (bountyFilter !== 'all') {
      result = result.filter((s) => s.bountyId === bountyFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) => {
        const participant = participantMap[s.participantId]
        const bounty = bountyMap[s.bountyId]
        return (
          participant?.name.toLowerCase().includes(q) ||
          bounty?.title.toLowerCase().includes(q) ||
          s.proof.some((p) => {
            if (p.type === 'text') return p.value.toLowerCase().includes(q)
            if (p.type === 'link') return p.value.toLowerCase().includes(q)
            return false
          })
        )
      })
    }
    return result
  }, [submissions, activeTab, bountyFilter, search, participantMap, bountyMap])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'submittedAt':
          cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'reward': {
          const aReward = bountyMap[a.bountyId]?.rewardAmount ?? 0
          const bReward = bountyMap[b.bountyId]?.rewardAmount ?? 0
          cmp = aReward - bReward
          break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir, bountyMap])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-pink-500" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-pink-500" />
    )
  }

  // Summary stats
  const stats = useMemo(() => {
    const pending = submissions.filter((s) => s.status === 'submitted').length
    const inReview = submissions.filter((s) => s.status === 'in_review').length
    const needsInfo = submissions.filter((s) => s.status === 'needs_more_info').length
    const approved = submissions.filter((s) => s.status === 'approved').length
    const rejected = submissions.filter((s) => s.status === 'rejected').length
    const unpaid = submissions.filter(
      (s) => s.status === 'approved' && s.payout && s.payout.status !== 'paid'
    ).length
    return { pending, inReview, needsInfo, approved, rejected, unpaid }
  }, [submissions])

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Review Center
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review submissions, approve or reject work, and track payouts.
          </p>
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-blue-600 dark:text-blue-400', accent: 'border-blue-200 dark:border-blue-800' },
            { label: 'In Review', value: stats.inReview, icon: Eye, color: 'text-amber-600 dark:text-amber-400', accent: 'border-amber-200 dark:border-amber-800' },
            { label: 'Needs Info', value: stats.needsInfo, icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', accent: 'border-orange-200 dark:border-orange-800' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', accent: 'border-emerald-200 dark:border-emerald-800' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600 dark:text-red-400', accent: 'border-red-200 dark:border-red-800' },
            { label: 'Unpaid', value: stats.unpaid, icon: Banknote, color: 'text-pink-600 dark:text-pink-400', accent: 'border-pink-200 dark:border-pink-800' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border bg-white p-3 dark:bg-slate-900 ${stat.accent}`}
            >
              <div className="flex items-center gap-1.5">
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              </div>
              <p
                className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
            {statusTabs.map((tab) => {
              const count =
                tab.value === 'all'
                  ? submissions.length
                  : submissions.filter((s) => s.status === tab.value).length
              return (
                <button
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); setPage(1) }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Bounty filter */}
            <select
              value={bountyFilter}
              onChange={(e) => { setBountyFilter(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs text-slate-700 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
            >
              <option value="all">All bounties</option>
              {bounties.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="min-w-[280px] px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Submission
                    </span>
                  </th>
                  <th className="w-28 px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('status')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      Status
                      <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="w-28 px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('reward')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      Reward
                      <SortIcon field="reward" />
                    </button>
                  </th>
                  <th className="w-24 px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Payout
                    </span>
                  </th>
                  <th className="w-28 px-4 py-3 text-left">
                    <button
                      onClick={() => toggleSort('submittedAt')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      Submitted
                      <SortIcon field="submittedAt" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {search || activeTab !== 'all' || bountyFilter !== 'all'
                          ? 'No submissions match your filters'
                          : 'No submissions to review yet'}
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="mt-2 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((submission) => {
                    const participant = participantMap[submission.participantId]
                    const bounty = bountyMap[submission.bountyId]
                    return (
                      <tr
                        key={submission.id}
                        onClick={() => onViewSubmission?.(submission.id)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {/* Participant avatar */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {participant ? getInitials(participant.name) : '??'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-pink-700 dark:text-white dark:group-hover:text-pink-300">
                                {participant?.name ?? 'Unknown'}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                {bounty?.title ?? 'Unknown bounty'}
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                                <span>{bounty?.categoryName}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <SubmissionStatusBadge status={submission.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="text-sm font-semibold text-slate-900 dark:text-white"
                            style={{ fontFamily: "'Source Code Pro', monospace" }}
                          >
                            {bounty ? formatCurrency(bounty.rewardAmount) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {submission.payout ? (
                            <div className="flex items-center gap-2">
                              <PayoutBadge status={submission.payout.status} />
                              {submission.payout.status === 'not_paid' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkPaid?.(submission.id)
                                  }}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-pink-600 opacity-0 transition-all hover:bg-pink-50 group-hover:opacity-100 dark:text-pink-400 dark:hover:bg-pink-950/30"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                          {formatRelativeDate(submission.submittedAt)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of{' '}
                {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-pink-600 text-white dark:bg-pink-500'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
