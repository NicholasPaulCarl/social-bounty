import { useState, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  Inbox,
} from 'lucide-react'
import type {
  AdminBounty,
  AdminSubmission,
  BountyStatus,
  SubmissionStatus,
} from '../types'
import { BountyStatusBadge, SubmissionStatusBadge } from './StatusBadges'

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

interface OversightTabProps {
  bounties: AdminBounty[]
  submissions: AdminSubmission[]
  onOverrideSubmission?: (submissionId: string, participantName: string, currentStatus: SubmissionStatus) => void
}

type SubTab = 'bounties' | 'submissions'

export function OversightTab({
  bounties,
  submissions,
  onOverrideSubmission,
}: OversightTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('bounties')
  const [bountySearch, setBountySearch] = useState('')
  const [bountyStatusFilter, setBountyStatusFilter] = useState<BountyStatus | 'all'>('all')
  const [subSearch, setSubSearch] = useState('')
  const [subStatusFilter, setSubStatusFilter] = useState<SubmissionStatus | 'all'>('all')

  const filteredBounties = useMemo(() => {
    let result = bounties
    if (bountySearch) {
      const q = bountySearch.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.organizationName.toLowerCase().includes(q)
      )
    }
    if (bountyStatusFilter !== 'all') {
      result = result.filter((b) => b.status === bountyStatusFilter)
    }
    return result
  }, [bounties, bountySearch, bountyStatusFilter])

  const filteredSubmissions = useMemo(() => {
    let result = submissions
    if (subSearch) {
      const q = subSearch.toLowerCase()
      result = result.filter(
        (s) =>
          s.bountyTitle.toLowerCase().includes(q) ||
          s.participantName.toLowerCase().includes(q)
      )
    }
    if (subStatusFilter !== 'all') {
      result = result.filter((s) => s.status === subStatusFilter)
    }
    return result
  }, [submissions, subSearch, subStatusFilter])

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60 sm:w-fit">
        <button
          onClick={() => setSubTab('bounties')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            subTab === 'bounties'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Bounties
          <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">{bounties.length}</span>
        </button>
        <button
          onClick={() => setSubTab('submissions')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            subTab === 'submissions'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Submissions
          <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">{submissions.length}</span>
        </button>
      </div>

      {subTab === 'bounties' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={bountySearch}
                onChange={(e) => setBountySearch(e.target.value)}
                placeholder="Search bounties..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
              />
            </div>
            <div className="relative">
              <select
                value={bountyStatusFilter}
                onChange={(e) => setBountyStatusFilter(e.target.value as BountyStatus | 'all')}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="min-w-[250px] px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bounty</span>
                    </th>
                    <th className="w-36 px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organization</span>
                    </th>
                    <th className="w-24 px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                    </th>
                    <th className="w-24 px-4 py-3 text-right">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reward</span>
                    </th>
                    <th className="w-28 px-4 py-3 text-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Submissions</span>
                    </th>
                    <th className="w-28 px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredBounties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No bounties found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBounties.map((bounty) => (
                      <tr key={bounty.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{bounty.title}</p>
                          <p
                            className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500"
                            style={{ fontFamily: "'Source Code Pro', monospace" }}
                          >
                            {bounty.id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{bounty.organizationName}</td>
                        <td className="px-4 py-3">
                          <BountyStatusBadge status={bounty.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className="text-sm font-semibold text-slate-900 dark:text-white"
                            style={{ fontFamily: "'Source Code Pro', monospace" }}
                          >
                            {formatCurrency(bounty.rewardAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                          {bounty.submissionCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(bounty.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subTab === 'submissions' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Search submissions..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
              />
            </div>
            <div className="relative">
              <select
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value as SubmissionStatus | 'all')}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
              >
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="needs_more_info">Needs Info</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="min-w-[250px] px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bounty</span>
                    </th>
                    <th className="w-36 px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</span>
                    </th>
                    <th className="w-28 px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                    </th>
                    <th className="w-28 px-4 py-3 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Submitted</span>
                    </th>
                    <th className="w-28 px-4 py-3 text-right">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Override</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No submissions found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.bountyTitle}</p>
                          <p
                            className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500"
                            style={{ fontFamily: "'Source Code Pro', monospace" }}
                          >
                            {sub.id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{sub.participantName}</td>
                        <td className="px-4 py-3">
                          <SubmissionStatusBadge status={sub.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(sub.submittedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onOverrideSubmission?.(sub.id, sub.participantName, sub.status)}
                            className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-100 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-300 dark:hover:bg-pink-950/50"
                          >
                            Override
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
