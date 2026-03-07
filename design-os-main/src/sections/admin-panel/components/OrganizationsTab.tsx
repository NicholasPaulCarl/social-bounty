import { useState, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  Eye,
  Ban,
  RotateCcw,
  Inbox,
  Users,
  Megaphone,
} from 'lucide-react'
import type { AdminOrganization, OrgStatus } from '@/../product/sections/admin-panel/types'
import { OrgStatusBadge } from './StatusBadges'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface OrganizationsTabProps {
  organizations: AdminOrganization[]
  onViewOrg?: (orgId: string) => void
  onSuspendOrg?: (orgId: string, orgName: string) => void
  onReinstateOrg?: (orgId: string, orgName: string) => void
}

export function OrganizationsTab({
  organizations,
  onViewOrg,
  onSuspendOrg,
  onReinstateOrg,
}: OrganizationsTabProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrgStatus | 'all'>('all')

  const filtered = useMemo(() => {
    let result = organizations
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.contactEmail.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter)
    }
    return result
  }, [organizations, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrgStatus | 'all')}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="min-w-[180px] px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organization</span>
                </th>
                <th className="w-24 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                </th>
                <th className="w-24 px-4 py-3 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Members</span>
                </th>
                <th className="w-24 px-4 py-3 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bounties</span>
                </th>
                <th className="w-48 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact</span>
                </th>
                <th className="w-28 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created</span>
                </th>
                <th className="w-24 px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No organizations found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{org.name}</p>
                        <p
                          className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500"
                          style={{ fontFamily: "'Source Code Pro', monospace" }}
                        >
                          {org.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OrgStatusBadge status={org.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="h-3 w-3" />
                        {org.memberCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <Megaphone className="h-3 w-3" />
                        {org.bountyCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{org.contactEmail}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(org.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewOrg?.(org.id)}
                          title="View organization"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {org.status === 'active' ? (
                          <button
                            onClick={() => onSuspendOrg?.(org.id, org.name)}
                            title="Suspend organization"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        ) : org.status === 'suspended' ? (
                          <button
                            onClick={() => onReinstateOrg?.(org.id, org.name)}
                            title="Reinstate organization"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Showing {filtered.length} of {organizations.length} organizations
      </p>
    </div>
  )
}
