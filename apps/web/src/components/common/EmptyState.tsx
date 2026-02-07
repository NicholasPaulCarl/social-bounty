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
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <i className={`pi ${icon} text-neutral-400`} style={{ fontSize: '3rem' }} />
      <h3 className="text-lg font-semibold text-neutral-700 mt-4">{title}</h3>
      {message && <p className="text-sm text-neutral-500 mt-2 text-center max-w-md">{message}</p>}
      {ctaLabel && ctaAction && (
        <Button
          label={ctaLabel}
          icon={ctaIcon ? `pi ${ctaIcon}` : undefined}
          outlined
          className="mt-4"
          onClick={ctaAction}
        />
      )}
    </div>
  );
}
