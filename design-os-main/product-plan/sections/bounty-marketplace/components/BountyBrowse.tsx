import { useState, useMemo } from 'react'
import {
  Search,
  Grid3X3,
  List,
  DollarSign,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Building2,
  Tag,
  SlidersHorizontal,
  X,
  Inbox,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  XCircle,
  Sparkles,
} from 'lucide-react'
import type {
  BountyMarketplaceProps,
  MarketplaceBounty,
  BountySortOption,
  LayoutMode,
  SubmissionStatus,
} from '../types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDeadline(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date('2026-03-07T12:00:00Z')
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Ended'
  if (diffDays === 0) return 'Ends today'
  if (diffDays === 1) return 'Ends tomorrow'
  if (diffDays <= 7) return `${diffDays}d left`
  return `Ends ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function isFull(bounty: MarketplaceBounty) {
  return bounty.maxSubmissions !== null && bounty.currentSubmissions >= bounty.maxSubmissions
}

function spotsText(bounty: MarketplaceBounty) {
  if (bounty.maxSubmissions === null) return `${bounty.currentSubmissions} submitted`
  const remaining = bounty.maxSubmissions - bounty.currentSubmissions
  if (remaining <= 0) return 'Full'
  return `${remaining} of ${bounty.maxSubmissions} spots left`
}

const submissionStatusConfig: Record<SubmissionStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  submitted: { label: 'Submitted', color: 'text-blue-600 dark:text-blue-400', icon: Clock },
  in_review: { label: 'In Review', color: 'text-amber-600 dark:text-amber-400', icon: Eye },
  needs_more_info: { label: 'Needs Info', color: 'text-orange-600 dark:text-orange-400', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-600 dark:text-red-400', icon: XCircle },
}

const sortOptions: { value: BountySortOption; label: string; icon: typeof Clock }[] = [
  { value: 'newest', label: 'Newest', icon: Sparkles },
  { value: 'ending_soon', label: 'Ending Soon', icon: Clock },
  { value: 'highest_reward', label: 'Highest Reward', icon: TrendingUp },
]

export function BountyBrowse({
  bounties,
  categories,
  organizations,
  userSubmissions,
  onViewBounty,
}: BountyMarketplaceProps) {
  const [layout, setLayout] = useState<LayoutMode>('grid')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<BountySortOption>('newest')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const orgMap = useMemo(
    () => Object.fromEntries(organizations.map((o) => [o.id, o])),
    [organizations]
  )
  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )
  const submissionMap = useMemo(
    () => Object.fromEntries(userSubmissions.map((s) => [s.bountyId, s])),
    [userSubmissions]
  )

  const filtered = useMemo(() => {
    let result = bounties
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.categoryId === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.shortDescription.toLowerCase().includes(q)
      )
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'ending_soon': {
          const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity
          return aEnd - bEnd
        }
        case 'highest_reward':
          return b.rewardAmount - a.rewardAmount
        default:
          return 0
      }
    })
    return result
  }, [bounties, categoryFilter, search, sort])

  const activeFilterCount = (categoryFilter !== 'all' ? 1 : 0)

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Bounty Marketplace
          </h1>
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Find bounties, complete tasks, earn rewards.
          </p>
        </div>

        {/* Search & Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bounties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white dark:bg-pink-500">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as BountySortOption)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Layout toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setLayout('grid')}
                className={`rounded-l-lg p-2 transition-colors ${
                  layout === 'grid'
                    ? 'bg-pink-600 text-white dark:bg-pink-500'
                    : 'bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`rounded-r-lg p-2 transition-colors ${
                  layout === 'list'
                    ? 'bg-pink-600 text-white dark:bg-pink-500'
                    : 'bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="text-xs font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-pink-600 text-white dark:bg-pink-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-pink-600 text-white dark:bg-pink-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} bount{filtered.length === 1 ? 'y' : 'ies'} available
          </p>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 dark:border-slate-800 dark:bg-slate-900">
            <Inbox className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-base font-medium text-slate-500 dark:text-slate-400">
              No bounties match your filters
            </p>
            <button
              onClick={() => {
                setSearch('')
                setCategoryFilter('all')
              }}
              className="mt-3 text-sm font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
            >
              Reset filters
            </button>
          </div>
        ) : layout === 'grid' ? (
          /* Card Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bounty) => {
              const org = orgMap[bounty.organizationId]
              const cat = catMap[bounty.categoryId]
              const submission = submissionMap[bounty.id]
              const full = isFull(bounty)
              const deadline = formatDeadline(bounty.endDate)

              return (
                <button
                  key={bounty.id}
                  onClick={() => onViewBounty?.(bounty.id)}
                  className={`group relative flex flex-col rounded-2xl border bg-white p-5 text-left transition-all hover:shadow-md dark:bg-slate-900 ${
                    full
                      ? 'border-slate-200 opacity-60 dark:border-slate-800'
                      : 'border-slate-200 hover:border-pink-200 dark:border-slate-800 dark:hover:border-pink-800'
                  }`}
                >
                  {/* Top row: org + category */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {org?.name.charAt(0) ?? '?'}
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{org?.name}</span>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {cat?.name}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-1.5 text-sm font-bold text-slate-900 group-hover:text-pink-700 dark:text-white dark:group-hover:text-pink-300">
                    {bounty.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                    {bounty.shortDescription}
                  </p>

                  {/* Reward */}
                  <div className="mb-3 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-pink-500" />
                    <span
                      className="text-lg font-bold text-slate-900 dark:text-white"
                      style={{ fontFamily: "'Source Code Pro', monospace" }}
                    >
                      {formatCurrency(bounty.rewardAmount)}
                    </span>
                  </div>

                  {/* Footer: deadline + spots */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Users className="h-3 w-3" />
                      <span>{spotsText(bounty)}</span>
                    </div>
                    {deadline && (
                      <div className={`flex items-center gap-1 text-xs ${
                        deadline.includes('left') && parseInt(deadline) <= 3
                          ? 'font-semibold text-orange-600 dark:text-orange-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        <span>{deadline}</span>
                      </div>
                    )}
                  </div>

                  {/* Submission status overlay */}
                  {submission && (
                    <div className="absolute right-3 top-3">
                      {(() => {
                        const cfg = submissionStatusConfig[submission.status]
                        const Icon = cfg.icon
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm dark:bg-slate-900/90 ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        )
                      })()}
                    </div>
                  )}

                  {/* Full badge */}
                  {full && !submission && (
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        Full
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          /* List Layout */
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filtered.map((bounty) => {
                const org = orgMap[bounty.organizationId]
                const cat = catMap[bounty.categoryId]
                const submission = submissionMap[bounty.id]
                const full = isFull(bounty)
                const deadline = formatDeadline(bounty.endDate)

                return (
                  <button
                    key={bounty.id}
                    onClick={() => onViewBounty?.(bounty.id)}
                    className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                      full ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Reward circle */}
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/30">
                      <span
                        className="text-sm font-bold text-pink-700 dark:text-pink-300"
                        style={{ fontFamily: "'Source Code Pro', monospace" }}
                      >
                        ${bounty.rewardAmount}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-pink-700 dark:text-white dark:group-hover:text-pink-300">
                          {bounty.title}
                        </h3>
                        {full && (
                          <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            Full
                          </span>
                        )}
                        {submission && (
                          <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold ${submissionStatusConfig[submission.status].color}`}>
                            {submissionStatusConfig[submission.status].label}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <span>{org?.name}</span>
                        <span>&middot;</span>
                        <span>{cat?.name}</span>
                        <span>&middot;</span>
                        <span>{spotsText(bounty)}</span>
                        {deadline && (
                          <>
                            <span>&middot;</span>
                            <span className={
                              deadline.includes('left') && parseInt(deadline) <= 3
                                ? 'font-semibold text-orange-500'
                                : ''
                            }>{deadline}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
