import { useState, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  Eye,
  Ban,
  RotateCcw,
  KeyRound,
  Inbox,
} from 'lucide-react'
import type { AdminUser, UserRole, UserStatus } from '@/../product/sections/admin-panel/types'
import { UserStatusBadge } from './StatusBadges'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface UsersTabProps {
  users: AdminUser[]
  onViewUser?: (userId: string) => void
  onSuspendUser?: (userId: string, userName: string) => void
  onReinstateUser?: (userId: string, userName: string) => void
  onForcePasswordReset?: (userId: string, userName: string) => void
}

export function UsersTab({
  users,
  onViewUser,
  onSuspendUser,
  onReinstateUser,
  onForcePasswordReset,
}: UsersTabProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')

  const filtered = useMemo(() => {
    let result = users
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (statusFilter !== 'all') {
      result = result.filter((u) => u.status === statusFilter)
    }
    return result
  }, [users, search, roleFilter, statusFilter])

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
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
            >
              <option value="all">All roles</option>
              <option value="participant">Participant</option>
              <option value="business_admin">Business Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-slate-600 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="min-w-[200px] px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</span>
                </th>
                <th className="w-48 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</span>
                </th>
                <th className="w-28 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</span>
                </th>
                <th className="w-24 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                </th>
                <th className="w-36 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organization</span>
                </th>
                <th className="w-24 px-4 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Joined</span>
                </th>
                <th className="w-32 px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No users found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p
                          className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500"
                          style={{ fontFamily: "'Source Code Pro', monospace" }}
                        >
                          {user.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {user.role === 'business_admin' ? 'Business Admin' : 'Participant'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {user.organizationName ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(user.joinedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewUser?.(user.id)}
                          title="View user"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => onSuspendUser?.(user.id, user.name)}
                            title="Suspend user"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onReinstateUser?.(user.id, user.name)}
                            title="Reinstate user"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onForcePasswordReset?.(user.id, user.name)}
                          title="Force password reset"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
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
        Showing {filtered.length} of {users.length} users
      </p>
    </div>
  )
}
