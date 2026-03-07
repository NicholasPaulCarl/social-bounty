import { Search, FileText, Briefcase, ClipboardCheck, Shield } from 'lucide-react'
import { AppShell } from './components/AppShell'
import type { NavItem } from './components/MainNav'

export default function ShellPreview() {
  const navigationItems: NavItem[] = [
    { label: 'Marketplace', href: '/marketplace', icon: Search, isActive: true },
    { label: 'My Submissions', href: '/submissions', icon: FileText, badge: 3 },
    { label: 'Bounty Management', href: '/bounties', icon: Briefcase },
    { label: 'Review Center', href: '/reviews', icon: ClipboardCheck, badge: 12 },
    { label: 'Admin Panel', href: '/admin', icon: Shield },
  ]

  const user = {
    name: 'Alex Morgan',
    role: 'Super Admin',
    avatarUrl: undefined,
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      onNavigate={(href) => console.log('Navigate to:', href)}
      onLogout={() => console.log('Logout')}
      onSettings={() => console.log('Settings')}
    >
      <div className="p-8">
        <h1
          className="text-2xl font-bold text-slate-900 dark:text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Bounty Marketplace
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Browse and discover available bounties. This is the content area where section screen designs will render.
        </p>

        {/* Placeholder content grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                  Live
                </span>
                <span
                  className="text-lg font-bold text-slate-900 dark:text-white"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  ${(i * 25).toFixed(2)}
                </span>
              </div>
              <h3
                className="font-semibold text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Sample Bounty {i}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Complete a task and submit proof of completion to earn the reward.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {i * 2} submissions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
