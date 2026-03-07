import { type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  isActive?: boolean
  badge?: number
}

interface MainNavProps {
  items: NavItem[]
  collapsed: boolean
  onNavigate?: (href: string) => void
}

export function MainNav({ items, collapsed, onNavigate }: MainNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            title={collapsed ? item.label : undefined}
            className={`
              group relative flex items-center gap-3 rounded-lg px-3 py-2.5
              text-sm font-medium transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
              ${
                item.isActive
                  ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }
            `}
          >
            {item.isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-pink-500 dark:bg-pink-400" />
            )}
            <Icon
              className={`h-5 w-5 shrink-0 ${
                item.isActive
                  ? 'text-pink-600 dark:text-pink-400'
                  : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
              }`}
            />
            {!collapsed && (
              <>
                <span className="truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
            {collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
