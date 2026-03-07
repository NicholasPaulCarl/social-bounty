import { LogOut, Settings, ChevronUp } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface UserMenuProps {
  user: { name: string; avatarUrl?: string; role?: string }
  collapsed: boolean
  onLogout?: () => void
  onSettings?: () => void
}

export function UserMenu({ user, collapsed, onLogout, onSettings }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={menuRef} className="relative px-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => {
              onSettings?.()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <button
            onClick={() => {
              onLogout?.()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        title={collapsed ? user.name : undefined}
        className={`
          flex w-full items-center gap-3 rounded-lg px-3 py-2.5
          text-sm transition-colors duration-150
          hover:bg-slate-100 dark:hover:bg-slate-800
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
            {initials}
          </span>
        )}
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <div
                className="truncate font-medium text-slate-900 dark:text-slate-100"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {user.name}
              </div>
              {user.role && (
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.role}
                </div>
              )}
            </div>
            <ChevronUp
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                open ? '' : 'rotate-180'
              }`}
            />
          </>
        )}
      </button>
    </div>
  )
}
