'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Star } from 'lucide-react';

interface UpsellBannerProps {
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function UpsellBanner({ message, ctaLabel = 'Upgrade to Pro', ctaUrl = '/settings/subscription' }: UpsellBannerProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-pink-600/20 bg-pink-600/5">
      <p className="text-sm text-text-secondary">{message}</p>
      <Button
        label={ctaLabel}
        icon={<Star size={16} strokeWidth={2} />}
        size="small"
        outlined
        className="shrink-0 text-pink-600 border-pink-600/40 hover:bg-pink-600/10"
        onClick={() => router.push(ctaUrl)}
      />
    </div>
  );
}
