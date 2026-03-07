import { useState } from 'react'
import { PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react'
import { MainNav, type NavItem } from './MainNav'
import { UserMenu } from './UserMenu'

interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavItem[]
  user: { name: string; avatarUrl?: string; role?: string }
  productName?: string
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onSettings?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  productName = 'Social Bounty',
  onNavigate,
  onLogout,
  onSettings,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center px-3' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-600 dark:bg-pink-500">
          <span className="text-sm font-bold text-white">SB</span>
        </div>
        {!collapsed && (
          <span
            className="truncate text-lg font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {productName}
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <MainNav items={navigationItems} collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* Collapse Toggle */}
      <div className="hidden border-t border-slate-200 px-3 py-2 dark:border-slate-700 lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User Menu */}
      <div className="border-t border-slate-200 py-3 dark:border-slate-700">
        <UserMenu
          user={user}
          collapsed={collapsed}
          onLogout={onLogout}
          onSettings={onSettings}
        />
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-2 top-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span
            className="text-lg font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {productName}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
