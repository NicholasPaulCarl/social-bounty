import { useState, useMemo } from 'react'
import {
  Inbox,
  FileText,
  CheckCircle2,
  DollarSign,
  Clock,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Banknote,
} from 'lucide-react'
import type { MySubmissionsProps, SubmissionStatus, PayoutStatus } from '@/../product/sections/my-submissions/types'
import { SubmissionStatusBadge, PayoutBadge } from './StatusBadges'

type SortDir = 'newest' | 'oldest'

const statusFilters: { label: string; value: SubmissionStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Needs Info', value: 'needs_more_info' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const payoutFilters: { label: string; value: PayoutStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Not Paid', value: 'not_paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function SubmissionsList({
  submissions,
  bounties,
  earningsSummary,
  onViewSubmission,
}: MySubmissionsProps) {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all')
  const [payoutFilter, setPayoutFilter] = useState<PayoutStatus | 'all'>('all')
  const [sortDir, setSortDir] = useState<SortDir>('newest')

  const bountyMap = useMemo(
    () => Object.fromEntries(bounties.map((b) => [b.id, b])),
    [bounties]
  )

  const filtered = useMemo(() => {
    let result = submissions
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter)
    }
    if (payoutFilter !== 'all') {
      result = result.filter((s) => s.payout?.status === payoutFilter)
    }
    result = [...result].sort((a, b) => {
      const diff = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      return sortDir === 'newest' ? diff : -diff
    })
    return result
  }, [submissions, statusFilter, payoutFilter, sortDir])

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            My Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your submissions, monitor review progress, and view earnings.
          </p>
        </div>

        {/* Earnings summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Submissions</span>
            </div>
            <p
              className="text-2xl font-bold text-slate-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {earningsSummary.totalSubmissions}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-900 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Approved</span>
            </div>
            <p
              className="text-2xl font-bold text-emerald-700 dark:text-emerald-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {earningsSummary.approvedCount}
            </p>
          </div>
          <div className="rounded-xl border border-pink-200 bg-white p-4 dark:border-pink-900 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Earned</span>
            </div>
            <p
              className="text-2xl font-bold text-slate-900 dark:text-white"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              {formatCurrency(earningsSummary.totalEarned)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-900 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 mb-2">
              <Banknote className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pending Payout</span>
            </div>
            <p
              className="text-2xl font-bold text-amber-700 dark:text-amber-400"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              {formatCurrency(earningsSummary.pendingPayout)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
            {statusFilters.map((f) => {
              const count = f.value === 'all'
                ? submissions.length
                : submissions.filter((s) => s.status === f.value).length
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === f.value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {f.label}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Payout filter */}
            <div className="relative">
              <select
                value={payoutFilter}
                onChange={(e) => setPayoutFilter(e.target.value as PayoutStatus | 'all')}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
              >
                <option value="all">All payouts</option>
                {payoutFilters.slice(1).map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Sort toggle */}
            <button
              onClick={() => setSortDir((d) => d === 'newest' ? 'oldest' : 'newest')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {sortDir === 'newest' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
              {sortDir === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="min-w-[280px] px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bounty</span>
                  </th>
                  <th className="w-28 px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                  </th>
                  <th className="w-24 px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reward</span>
                  </th>
                  <th className="w-24 px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Payout</span>
                  </th>
                  <th className="w-28 px-4 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Submitted</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {statusFilter !== 'all' || payoutFilter !== 'all'
                          ? 'No submissions match your filters'
                          : 'You haven\'t submitted any bounties yet'}
                      </p>
                      {statusFilter !== 'all' || payoutFilter !== 'all' ? (
                        <button
                          onClick={() => { setStatusFilter('all'); setPayoutFilter('all') }}
                          className="mt-2 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
                        >
                          Clear filters
                        </button>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          Browse the Bounty Marketplace to find your first task.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((submission) => {
                    const bounty = bountyMap[submission.bountyId]
                    return (
                      <tr
                        key={submission.id}
                        onClick={() => onViewSubmission?.(submission.id)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-pink-700 dark:text-white dark:group-hover:text-pink-300">
                              {bounty?.title ?? 'Unknown bounty'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {bounty?.organizationName}
                              <span className="mx-1.5 text-slate-300 dark:text-slate-600">&middot;</span>
                              {bounty?.categoryName}
                            </p>
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
                            <PayoutBadge status={submission.payout.status} />
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(submission.submittedAt)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
