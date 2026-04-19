'use client';

import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from 'primereact/button';

interface EmptyStateProps {
  Icon?: LucideIcon;
  title: string;
  message?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  CtaIcon?: LucideIcon;
}

export function EmptyState({
  Icon = Inbox,
  title,
  message,
  ctaLabel,
  ctaAction,
  CtaIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-600/10 blur-2xl rounded-full" />
        <Icon size={48} strokeWidth={2} className="text-text-muted relative" />
      </div>
      <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary mt-4 sm:mt-6">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-text-secondary mt-2 text-center max-w-md">{message}</p>
      )}
      {ctaLabel && ctaAction && (
        <Button
          label={ctaLabel}
          icon={CtaIcon ? <CtaIcon size={16} strokeWidth={2} /> : undefined}
          outlined
          className="mt-4 sm:mt-6"
          onClick={ctaAction}
        />
      )}
    </div>
  );
}
