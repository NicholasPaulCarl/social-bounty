'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useBusinessDashboard } from '@/hooks/useDashboard';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

const STAT_CONFIG = [
  { label: 'Total Bounties',    icon: 'pi-megaphone',    iconClass: 'text-cyan-400',    href: '/business/bounties' },
  { label: 'Active Bounties',   icon: 'pi-check-circle', iconClass: 'text-violet-400',  href: '/business/bounties' },
  { label: 'Pending Reviews',   icon: 'pi-clock',        iconClass: 'text-amber-400',   href: '/business/bounties' },
  { label: 'Total Submissions', icon: 'pi-file',         iconClass: 'text-emerald-400', href: '/business/bounties' },
];

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useBusinessDashboard();

  if (isLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const statValues = [
    data.bounties.total,
    data.bounties.byStatus?.LIVE ?? 0,
    data.submissions.pendingReview,
    data.submissions.total,
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Business Dashboard"
        actions={
          <Button label="Create Bounty" icon="pi pi-plus" onClick={() => router.push('/business/bounties/new')} />
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CONFIG.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(stat.href)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg border border-glass-border">
                <i className={`pi ${stat.icon} ${stat.iconClass} text-xl`} />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-text-primary">{statValues[i]}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
