'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { InputText } from 'primereact/inputtext';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { useHunters } from '@/hooks/useHunters';
import { HUNTER_INTERESTS, SocialChannel } from '@social-bounty/shared';
import { getUploadUrl } from '@/lib/api/client';
import type { HunterListItem } from '@social-bounty/shared';
// Lucide 1.8 omits Instagram/Facebook brand glyphs (trademark policy).
// Camera → Instagram, ThumbsUp → Facebook per ICONS.md §Social brand marks.
import { Camera, Music2, ThumbsUp, Link2, ArrowRight, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatFollowers(count: number | null): string {
  if (count === null || count === undefined) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const PLATFORM_ICONS: Record<SocialChannel, { Icon: LucideIcon; color: string }> = {
  [SocialChannel.INSTAGRAM]: { Icon: Camera, color: 'text-pink-400' },
  [SocialChannel.TIKTOK]: { Icon: Music2, color: 'text-pink-600' },
  [SocialChannel.FACEBOOK]: { Icon: ThumbsUp, color: 'text-slate-500' },
};

// ─── Hunter Card ─────────────────────────────────────────────────────────

interface HunterCardProps {
  hunter: HunterListItem;
  index: number;
}

function HunterCard({ hunter, index }: HunterCardProps) {
  const topInterests = hunter.interests.slice(0, 3);
  const topSocials = hunter.socialLinks.slice(0, 3);

  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-glow-brand transition-all duration-normal cursor-pointer animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        {hunter.profilePictureUrl ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-glass-border">
            <Image
              src={getUploadUrl(hunter.profilePictureUrl)!}
              alt={`${hunter.firstName} ${hunter.lastName}`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full shrink-0 bg-pink-600/10 border border-pink-600/30 flex items-center justify-center text-pink-600 font-heading font-bold text-sm">
            {getInitials(hunter.firstName, hunter.lastName)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-heading font-semibold text-text-primary truncate">
            {hunter.firstName} {hunter.lastName}
          </p>
          {hunter.bio && (
            <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">{hunter.bio}</p>
          )}
        </div>
      </div>

      {/* Interest pills */}
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
          {hunter.interests.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-glass-bg text-text-muted border border-glass-border">
              +{hunter.interests.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Social links */}
      {topSocials.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {topSocials.map((link) => {
            const config = PLATFORM_ICONS[link.platform];
            const PlatformIcon = config?.Icon ?? Link2;
            const followers = formatFollowers(link.followerCount);
            return (
              <div key={link.platform} className="flex items-center gap-1.5 text-xs text-text-muted">
                <PlatformIcon size={14} strokeWidth={2} className={config?.color ?? 'text-text-muted'} />
                {followers && <span>{followers}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-1">
        <Link
          href={`/hunters/${hunter.id}`}
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

export default function HuntersDirectoryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  // Debounce search
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

  const { data, isLoading, error, refetch } = useHunters(params);

  const handleInterestToggle = useCallback(
    (interest: string) => {
      setSelectedInterest((prev) => (prev === interest ? null : interest));
    },
    [],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Hunter Directory"
        subtitle="Browse and discover talented Hunters"
      />

      {/* Search */}
      <div className="mb-5">
        <span className="p-input-icon-left w-full sm:w-80">
          <Search size={16} strokeWidth={2} />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hunters..."
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
          icon="pi-users"
          title="No hunters found"
          message={
            selectedInterest || debouncedSearch
              ? 'Try adjusting your search or filters.'
              : 'No hunters have joined the platform yet.'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((hunter, i) => (
              <HunterCard key={hunter.id} hunter={hunter} index={i} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <p className="text-center text-text-muted text-sm mt-8">
              Showing {data.data.length} of {data.meta.total} hunters
            </p>
          )}
        </>
      )}
    </div>
  );
}
