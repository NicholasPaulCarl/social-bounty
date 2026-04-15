'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Overview', href: '/admin/finance' },
  { label: 'Inbound', href: '/admin/finance/inbound' },
  { label: 'Reserves', href: '/admin/finance/reserves' },
  { label: 'Earnings & Payouts', href: '/admin/finance/earnings-payouts' },
  { label: 'Refunds', href: '/admin/finance/refunds' },
  { label: 'Subscriptions', href: '/admin/finance/subscriptions' },
  { label: 'Exceptions', href: '/admin/finance/exceptions' },
  { label: 'Audit Trail', href: '/admin/finance/audit-trail' },
  { label: 'Overrides', href: '/admin/finance/overrides' },
  { label: 'Insights', href: '/admin/finance/insights' },
];

export default function FinanceAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <nav className="flex flex-wrap gap-2 border-b border-border-subtle mb-6 pb-2">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:bg-surface-hover'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
