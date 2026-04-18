'use client';

import { Button } from 'primereact/button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  ctaIcon?: string;
}

export function EmptyState({
  icon = 'pi-inbox',
  title,
  message,
  ctaLabel,
  ctaAction,
  ctaIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-pink-600/10 blur-2xl rounded-full" />
        <i
          className={`pi ${icon} text-text-muted relative text-[2rem] sm:text-[3rem]`}
        />
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
          icon={ctaIcon ? `pi ${ctaIcon}` : undefined}
          outlined
          className="mt-4 sm:mt-6"
          onClick={ctaAction}
        />
      )}
    </div>
  );
}
