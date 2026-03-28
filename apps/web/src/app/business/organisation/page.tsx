'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganisation } from '@/hooks/useOrganisation';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/utils/format';

export default function BusinessOrganisationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const orgId = user?.organisationId || '';
  const { data: org, isLoading, error, refetch } = useOrganisation(orgId);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  if (!org || !orgId) {
    return (
      <EmptyState
        icon="pi-building"
        title="No Organisation"
        message="You are not part of any organisation yet. Create one to start posting bounties."
        ctaLabel="Create Organisation"
        ctaAction={() => router.push('/create-organisation')}
      />
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Organisation"
        actions={
          <div className="flex gap-2">
            <Button label="Edit" icon="pi pi-pencil" outlined onClick={() => router.push('/business/organisation/edit')} />
            <Button label="Members" icon="pi pi-users" outlined onClick={() => router.push('/business/organisation/members')} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {org.logo && (
                  <img src={org.logo} alt={org.name} className="w-16 h-16 rounded-lg object-cover border border-glass-border" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{org.name}</h2>
                  <StatusBadge type="organisation" value={org.status} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-1">Contact Email</h3>
                <p className="text-text-primary">{org.contactEmail}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-text-muted">Status</dt>
                <dd><StatusBadge type="organisation" value={org.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Created</dt>
                <dd className="text-sm font-medium text-text-primary">{formatDate(org.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-text-muted">Members</dt>
                <dd className="text-sm font-medium text-text-primary">{org.memberCount ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
