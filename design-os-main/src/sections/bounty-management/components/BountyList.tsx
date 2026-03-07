import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Rocket,
  Pause,
  Play,
  XCircle,
  Copy,
  Star,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  Inbox,
} from 'lucide-react'
import type { BountyManagementProps, Bounty, BountyStatus } from '@/../product/sections/bounty-management/types'
import { StatusBadge, PriorityBadge } from './StatusBadge'

type SortField = 'title' | 'status' | 'rewardAmount' | 'submissionCount' | 'createdAt'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 6

const statusTabs: { label: string; value: BountyStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Live', value: 'live' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
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

export function BountyList({
  bounties,
  categories,
  onCreateBounty,
  onViewBounty,
  onEditBounty,
  onPublishBounty,
  onPauseBounty,
  onResumeBounty,
  onCloseBounty,
  onDuplicateBounty,
}: BountyManagementProps) {
  const [activeTab, setActiveTab] = useState<BountyStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  const filtered = useMemo(() => {
    let result = bounties
    if (activeTab !== 'all') {
      result = result.filter((b) => b.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((b) => b.title.toLowerCase().includes(q))
    }
    return result
  }, [bounties, activeTab, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'rewardAmount':
          cmp = a.rewardAmount - b.rewardAmount
          break
        case 'submissionCount':
          cmp = a.submissionCount - b.submissionCount
          break
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

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
    const total = bounties.length
    const live = bounties.filter((b) => b.status === 'live').length
    const totalReward = bounties.reduce((sum, b) => sum + b.rewardAmount, 0)
    const totalSubs = bounties.reduce((sum, b) => sum + b.submissionCount, 0)
    return { total, live, totalReward, totalSubs }
  }, [bounties])

  function getRowActions(bounty: Bounty) {
    const actions: { icon: typeof Eye; label: string; action: () => void; destructive?: boolean }[] = [
      { icon: Eye, label: 'View Details', action: () => onViewBounty?.(bounty.id) },
    ]
    if (bounty.status === 'draft' || bounty.status === 'live') {
      actions.push({ icon: Pencil, label: 'Edit', action: () => onEditBounty?.(bounty.id) })
    }
    if (bounty.status === 'draft') {
      actions.push({ icon: Rocket, label: 'Publish', action: () => onPublishBounty?.(bounty.id) })
    }
    if (bounty.status === 'live') {
      actions.push({ icon: Pause, label: 'Pause', action: () => onPauseBounty?.(bounty.id) })
    }
    if (bounty.status === 'paused') {
      actions.push({ icon: Play, label: 'Resume', action: () => onResumeBounty?.(bounty.id) })
    }
    if (bounty.status !== 'closed') {
      actions.push({ icon: XCircle, label: 'Close', action: () => onCloseBounty?.(bounty.id), destructive: true })
    }
    actions.push({ icon: Copy, label: 'Duplicate', action: () => onDuplicateBounty?.(bounty.id) })
    return actions
  }

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Bounty Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage bounties for your organization.
            </p>
          </div>
          <button
            onClick={() => onCreateBounty?.()}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md active:scale-[0.98] dark:bg-pink-500 dark:hover:bg-pink-600"
          >
            <Plus className="h-4 w-4" />
            Create Bounty
          </button>
        </div>

        {/* Stats cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: 'Total Bounties', value: stats.total, icon: FileText, color: 'text-slate-600 dark:text-slate-300' },
            { label: 'Currently Live', value: stats.live, icon: Rocket, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Total Reward Value', value: formatCurrency(stats.totalReward), icon: DollarSign, color: 'text-pink-600 dark:text-pink-400' },
            { label: 'Total Submissions', value: stats.totalSubs, icon: Inbox, color: 'text-blue-600 dark:text-blue-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              </div>
              <p
                className="mt-2 text-xl font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/60">
            {statusTabs.map((tab) => {
              const count =
                tab.value === 'all'
                  ? bounties.length
                  : bounties.filter((b) => b.status === tab.value).length
              return (
                <button
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); setPage(1) }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] text-slate-400 dark:text-slate-500">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bounties..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30 sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {[
                    { field: 'title' as SortField, label: 'Bounty', width: 'min-w-[280px]' },
                    { field: 'status' as SortField, label: 'Status', width: 'w-28' },
                    { field: 'rewardAmount' as SortField, label: 'Reward', width: 'w-28' },
                    { field: 'submissionCount' as SortField, label: 'Submissions', width: 'w-32' },
                    { field: 'createdAt' as SortField, label: 'Created', width: 'w-32' },
                  ].map((col) => (
                    <th
                      key={col.field}
                      className={`${col.width} px-4 py-3 text-left`}
                    >
                      <button
                        onClick={() => toggleSort(col.field)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        {col.label}
                        <SortIcon field={col.field} />
                      </button>
                    </th>
                  ))}
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {search ? 'No bounties match your search' : 'No bounties yet'}
                      </p>
                      {!search && (
                        <button
                          onClick={() => onCreateBounty?.()}
                          className="mt-3 text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                        >
                          Create your first bounty
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((bounty) => (
                    <tr
                      key={bounty.id}
                      onClick={() => onViewBounty?.(bounty.id)}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-pink-700 dark:text-white dark:group-hover:text-pink-300">
                                {bounty.title}
                              </p>
                              {bounty.featured && (
                                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{categoryMap[bounty.categoryId]?.name}</span>
                              <span className="text-slate-300 dark:text-slate-600">&#183;</span>
                              <PriorityBadge priority={bounty.priority} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={bounty.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-sm font-semibold text-slate-900 dark:text-white"
                          style={{ fontFamily: "'Source Code Pro', monospace" }}
                        >
                          {formatCurrency(bounty.rewardAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {bounty.submissionCount}
                          </span>
                          {bounty.maxSubmissions && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              / {bounty.maxSubmissions}
                            </span>
                          )}
                        </div>
                        {bounty.maxSubmissions > 0 && (
                          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-blue-400 transition-all dark:bg-blue-500"
                              style={{ width: `${Math.min(100, (bounty.submissionCount / bounty.maxSubmissions) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(bounty.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenu(openMenu === bounty.id ? null : bounty.id)
                            }}
                            className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openMenu === bounty.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                {getRowActions(bounty).map((action) => (
                                  <button
                                    key={action.label}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      action.action()
                                      setOpenMenu(null)
                                    }}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                      action.destructive
                                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <action.icon className="h-4 w-4" />
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
