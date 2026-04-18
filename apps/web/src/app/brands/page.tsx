'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InputText } from 'primereact/inputtext';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { useBrandsPublicList } from '@/hooks/useBrand';
import { HUNTER_INTERESTS } from '@social-bounty/shared';
import { getUploadUrl } from '@/lib/api/client';
import type { BrandListItem } from '@social-bounty/shared';
import { Megaphone, ArrowRight, Search, X } from 'lucide-react';

// ─── Brand Card ─────────────────────────────────────────────────────────

interface BrandCardProps {
  brand: BrandListItem;
  index: number;
}

function BrandCard({ brand, index }: BrandCardProps) {
  const topInterests = (brand.targetInterests || []).slice(0, 3);

  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-glow-brand transition-all duration-normal cursor-pointer animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
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
        <div className="min-w-0">
          <p className="font-heading font-semibold text-text-primary truncate">
            {brand.name}
          </p>
          {brand.handle && (
            <p className="text-sm text-text-muted">@{brand.handle}</p>
          )}
        </div>
      </div>

      {brand.bio && (
        <p className="text-sm text-text-secondary line-clamp-2">{brand.bio}</p>
      )}

      {topInterests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topInterests.map((interest) => (
            <span
              key={interest}
              className="px-2 py-0.5 rounded-full text-xs bg-pink-600/10 text-pink-600 border border-pink-600/30"
            >
              {interest}
            </span>
          ))}
          {(brand.targetInterests || []).length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-glass-bg text-text-muted border border-glass-border">
              +{(brand.targetInterests || []).length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>
          <Megaphone size={14} strokeWidth={2} className="mr-1 inline" />
          {brand.bountiesPosted} {brand.bountiesPosted === 1 ? 'bounty' : 'bounties'}
        </span>
      </div>

      <div className="mt-auto pt-1">
        <Link
          href={`/brands/${brand.handle || brand.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-600/80 transition-colors font-medium"
        >
          View Profile
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function BrandsDirectoryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const params = {
    page: 1,
    limit: 24,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedInterest ? { interest: selectedInterest } : {}),
  };

  const { data, isLoading, error, refetch } = useBrandsPublicList(params);

  const handleInterestToggle = useCallback(
    (interest: string) => {
      setSelectedInterest((prev) => (prev === interest ? null : interest));
    },
    [],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Brand Directory"
        subtitle="Browse and discover brands on Social Bounty"
      />

      {/* Search */}
      <div className="mb-5">
        <span className="p-input-icon-left w-full sm:w-80">
          <Search size={16} strokeWidth={2} />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full"
          />
        </span>
      </div>

      {/* Interest filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {HUNTER_INTERESTS.map((interest) => {
          const active = selectedInterest === interest;
          return (
            <button
              key={interest}
              onClick={() => handleInterestToggle(interest)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-fast ${
                active
                  ? 'bg-pink-600 text-bg-void border-pink-600 font-medium shadow-glow-brand'
                  : 'bg-glass-bg text-text-secondary border-glass-border hover:border-pink-600/50 hover:text-pink-600'
              }`}
            >
              {interest}
            </button>
          );
        })}
        {selectedInterest && (
          <button
            onClick={() => setSelectedInterest(null)}
            className="px-3 py-1.5 rounded-full text-sm border border-glass-border text-text-muted hover:text-danger-600 hover:border-danger-600/50 transition-colors"
          >
            <X size={12} strokeWidth={2} className="mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingState type="cards-grid" cards={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon="pi-building"
          title="No brands found"
          message={
            selectedInterest || debouncedSearch
              ? 'Try adjusting your search or filters.'
              : 'No brands have joined the platform yet.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((brand, i) => (
              <BrandCard key={brand.id} brand={brand} index={i} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <p className="text-center text-text-muted text-sm mt-8">
              Showing {data.data.length} of {data.meta.total} brands
            </p>
          )}
        </>
      )}
    </div>
  );
}
