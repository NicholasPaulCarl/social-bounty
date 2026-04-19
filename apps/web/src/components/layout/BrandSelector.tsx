'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ChevronDown, BadgeCheck, Check, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyBrands } from '@/hooks/useBrand';
import { useToast } from '@/hooks/useToast';
import { getUploadUrl } from '@/lib/api/client';
import type { MyBrandListItem } from '@social-bounty/shared';

interface BrandSelectorProps {
  collapsed?: boolean;
}

/**
 * Stable-ish hue per brand id so the square tile fallback stays consistent
 * across renders. Hash keeps identical brand ids mapped to identical hues.
 */
function hueForBrand(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const positive = ((hash % 360) + 360) % 360;
  return positive;
}

function BrandDisc({
  brand,
  size = 28,
}: {
  brand: Pick<MyBrandListItem, 'id' | 'name' | 'logo'>;
  size?: number;
}) {
  if (brand.logo) {
    const url = getUploadUrl(brand.logo);
    if (url) {
      return (
        <div
          className="relative rounded-lg overflow-hidden shrink-0"
          style={{ width: size, height: size }}
        >
          <Image src={url} alt={brand.name} fill className="object-cover" />
        </div>
      );
    }
  }

  const hue = hueForBrand(brand.id);
  return (
    <div
      className="inline-flex items-center justify-center rounded-lg text-white font-heading font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 70% 45%)`,
        fontSize: size <= 28 ? 12 : 14,
        letterSpacing: '-0.02em',
      }}
      aria-hidden="true"
    >
      {brand.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function BrandSelector({ collapsed = false }: BrandSelectorProps) {
  const { user, switchBrand } = useAuth();
  const { data: brands } = useMyBrands();
  const overlayRef = useRef<OverlayPanel>(null);
  const router = useRouter();
  const toast = useToast();

  if (!brands || brands.length <= 1) return null;

  const activeBrand = brands.find((b) => b.id === user?.brandId);
  if (!activeBrand) return null;

  const handleSwitch = async (brand: MyBrandListItem) => {
    overlayRef.current?.hide();
    if (brand.id === activeBrand.id) return;
    try {
      await switchBrand(brand.id);
      toast.showSuccess(`Switched to ${brand.name}`);
    } catch {
      toast.showError('Failed to switch brand');
    }
  };

  const seatLabel = (brand: MyBrandListItem) => {
    const count = brand.bountiesPosted ?? 0;
    return `Brand · ${count} ${count === 1 ? 'bounty' : 'bounties'}`;
  };

  // Brand is "verified" from the user-visible perspective once status flips to ACTIVE.
  const isVerified = (brand: MyBrandListItem) => brand.status === 'ACTIVE';

  if (collapsed) {
    return (
      <>
        <button
          className="flex items-center justify-center w-full p-2 rounded-[10px] hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
          onClick={(e) => overlayRef.current?.toggle(e)}
          aria-label={`Switch workspace — current: ${activeBrand.name}`}
          title={activeBrand.name}
        >
          <BrandDisc brand={activeBrand} size={36} />
        </button>
        <BrandSwitcherOverlay
          overlayRef={overlayRef}
          brands={brands}
          activeBrand={activeBrand}
          onSwitch={handleSwitch}
          onManage={() => router.push('/business/brands')}
          isVerified={isVerified}
          seatLabel={seatLabel}
        />
      </>
    );
  }

  return (
    <>
      <button
        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[10px] bg-bg-elevated border border-slate-200 hover:bg-slate-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
        onClick={(e) => overlayRef.current?.toggle(e)}
        aria-haspopup="menu"
        aria-label={`Switch workspace — current: ${activeBrand.name}`}
      >
        <BrandDisc brand={activeBrand} size={30} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {activeBrand.name}
            </span>
            {isVerified(activeBrand) && (
              <BadgeCheck
                size={12}
                strokeWidth={2.2}
                className="text-pink-600 shrink-0"
                aria-label="Verified brand"
              />
            )}
          </div>
          <div className="text-[11px] text-text-muted truncate">{seatLabel(activeBrand)}</div>
        </div>
        <ChevronDown size={14} strokeWidth={2} className="text-text-muted shrink-0" />
      </button>
      <BrandSwitcherOverlay
        overlayRef={overlayRef}
        brands={brands}
        activeBrand={activeBrand}
        onSwitch={handleSwitch}
        onManage={() => router.push('/business/brands')}
        isVerified={isVerified}
        seatLabel={seatLabel}
      />
    </>
  );
}

interface BrandSwitcherOverlayProps {
  overlayRef: React.RefObject<OverlayPanel | null>;
  brands: MyBrandListItem[];
  activeBrand: MyBrandListItem;
  onSwitch: (brand: MyBrandListItem) => void;
  onManage: () => void;
  isVerified: (brand: MyBrandListItem) => boolean;
  seatLabel: (brand: MyBrandListItem) => string;
}

function BrandSwitcherOverlay({
  overlayRef,
  brands,
  activeBrand,
  onSwitch,
  onManage,
  isVerified,
  seatLabel,
}: BrandSwitcherOverlayProps) {
  return (
    <OverlayPanel
      ref={overlayRef}
      className="!bg-white !border !border-slate-200 !rounded-xl !shadow-level-3 !p-1.5"
      style={{ minWidth: 260 }}
    >
      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
        Switch workspace
      </div>
      {brands.map((brand) => {
        const active = brand.id === activeBrand.id;
        return (
          <button
            key={brand.id}
            onClick={() => onSwitch(brand)}
            className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 ${
              active ? 'bg-pink-50' : 'hover:bg-slate-100'
            }`}
          >
            <BrandDisc brand={brand} size={28} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-text-primary truncate">
                  {brand.name}
                </span>
                {isVerified(brand) && (
                  <BadgeCheck
                    size={12}
                    strokeWidth={2.2}
                    className="text-pink-600 shrink-0"
                    aria-label="Verified"
                  />
                )}
              </div>
              <div className="text-[11px] text-text-muted truncate">{seatLabel(brand)}</div>
            </div>
            {active && (
              <Check size={14} strokeWidth={2.2} className="text-pink-600 shrink-0" />
            )}
          </button>
        );
      })}
      <div className="h-px bg-slate-100 my-1" />
      <button
        onClick={() => {
          overlayRef.current?.hide();
          onManage();
        }}
        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left text-text-secondary hover:bg-slate-100 transition-colors text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600"
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-bg-elevated text-text-muted shrink-0">
          <Plus size={14} strokeWidth={2} />
        </span>
        Add a brand workspace
      </button>
    </OverlayPanel>
  );
}
