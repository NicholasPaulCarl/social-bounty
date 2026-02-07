'use client';

import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useBusinessDashboard } from '@/hooks/useDashboard';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useBusinessDashboard();

  if (isLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const stats = [
    { label: 'Total Bounties', value: data.bounties.total, icon: 'pi-megaphone', href: '/business/bounties' },
    { label: 'Active Bounties', value: data.bounties.byStatus?.LIVE ?? 0, icon: 'pi-check-circle', href: '/business/bounties' },
    { label: 'Pending Reviews', value: data.submissions.pendingReview, icon: 'pi-clock', href: '/business/bounties' },
    { label: 'Total Submissions', value: data.submissions.total, icon: 'pi-file', href: '/business/bounties' },
  ];

  return (
    <>
      <PageHeader
        title="Business Dashboard"
        actions={
          <Button label="Create Bounty" icon="pi pi-plus" onClick={() => router.push('/business/bounties/new')} />
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(stat.href)}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50">
                <i className={`pi ${stat.icon} text-primary-600 text-xl`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
