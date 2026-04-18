'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Megaphone, CheckCircle2, Clock, File, Plus } from 'lucide-react';
import { useBusinessDashboard } from '@/hooks/useDashboard';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

const STAT_CONFIG = [
  { label: 'Total bounties',    Icon: Megaphone,    href: '/business/bounties' },
  { label: 'Active bounties',   Icon: CheckCircle2, href: '/business/bounties' },
  { label: 'Pending reviews',   Icon: Clock,        href: '/business/bounties' },
  { label: 'Total submissions', Icon: File,         href: '/business/bounties' },
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
        title="Business dashboard"
        actions={
          <Button
            label="Create bounty"
            icon={<Plus size={18} strokeWidth={2} />}
            onClick={() => router.push('/business/bounties/new')}
          />
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CONFIG.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card p-6 cursor-pointer hover:shadow-md transition-shadow rounded-xl"
            onClick={() => router.push(stat.href)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-pink-100 text-pink-600">
                <stat.Icon size={24} strokeWidth={2} />
              </div>
              <div>
                <p className="font-mono tabular-nums text-2xl font-bold text-text-primary">{statValues[i]}</p>
                <p className="eyebrow">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
