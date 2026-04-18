'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { useAuth } from '@/hooks/useAuth';
import { useMyBrands } from '@/hooks/useBrand';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getUploadUrl } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import type { MyBrandListItem } from '@social-bounty/shared';

export default function MyBrandsPage() {
  const router = useRouter();
  const { user, switchBrand } = useAuth();
  const { data: brands, isLoading, error, refetch } = useMyBrands();
  const toast = useToast();

  const handleSwitch = async (brand: MyBrandListItem) => {
    if (user?.brandId === brand.id) return;
    try {
      await switchBrand(brand.id);
      toast.showSuccess(`Switched to ${brand.name}`);
    } catch {
      toast.showError('Failed to switch brand');
    }
  };

  if (isLoading) return <LoadingState type="cards-grid" cards={3} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My Brands"
        subtitle="Manage your brand profiles"
        actions={
          <Button
            label="Create Brand"
            icon="pi pi-plus"
            onClick={() => router.push('/business/brands/create')}
          />
        }
      />

      {!brands || brands.length === 0 ? (
        <EmptyState
          icon="pi-building"
          title="No Brands Yet"
          message="Create your first brand to start posting bounties."
          ctaLabel="Create Brand"
          ctaAction={() => router.push('/business/brands/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand, i) => {
            const isActive = user?.brandId === brand.id;
            return (
              <div
                key={brand.id}
                className={`glass-card p-5 flex flex-col gap-4 animate-fade-up transition-all duration-normal ${
                  isActive ? 'ring-2 ring-pink-600 shadow-glow-brand' : ''
                }`}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-3">
                  {brand.logo ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 ring-2 ring-glass-border">
                      <Image
                        src={getUploadUrl(brand.logo)!}
                        alt={brand.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg shrink-0 bg-pink-600/10 border border-pink-600/30 flex items-center justify-center text-pink-600 font-heading font-bold text-sm">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-text-primary truncate">{brand.name}</p>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-pink-600/20 text-pink-600 font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    {brand.handle && (
                      <p className="text-sm text-text-muted">@{brand.handle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <StatusBadge type="brand" value={brand.status} />
                  <span>{brand.bountiesPosted} bounties</span>
                  <span className="capitalize">{brand.role.toLowerCase()}</span>
                </div>

                <div className="flex gap-2 mt-auto pt-2">
                  {!isActive && (
                    <Button
                      label="Switch"
                      icon="pi pi-sync"
                      size="small"
                      outlined
                      onClick={() => handleSwitch(brand)}
                    />
                  )}
                  <Button
                    label="Edit"
                    icon="pi pi-pencil"
                    size="small"
                    outlined
                    onClick={() => router.push(`/business/brands/${brand.id}/edit`)}
                  />
                  <Button
                    label="View"
                    icon="pi pi-eye"
                    size="small"
                    text
                    onClick={() => router.push(`/brands/${brand.handle || brand.id}`)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
