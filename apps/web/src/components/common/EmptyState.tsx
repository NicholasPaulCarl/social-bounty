'use client';

import { Button } from 'primereact/button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  ctaIcon?: string;
  /** Material Symbols icon name (e.g. "inbox", "search"). Falls back to PrimeIcon if prefixed with pi- */
  materialIcon?: string;
}

export function EmptyState({
  icon = 'pi-inbox',
  title,
  message,
  ctaLabel,
  ctaAction,
  ctaIcon,
  materialIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
        {materialIcon ? (
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '2rem' }}>
            {materialIcon}
          </span>
        ) : (
          <i className={`pi ${icon} text-on-surface-variant`} style={{ fontSize: '2rem' }} />
        )}
      </div>
      <h3 className="text-lg font-bold text-on-surface font-headline">{title}</h3>
      {message && <p className="text-on-surface-variant mt-2 text-center max-w-md">{message}</p>}
      {ctaLabel && ctaAction && (
        <Button
          label={ctaLabel}
          icon={ctaIcon ? `pi ${ctaIcon}` : undefined}
          outlined
          className="mt-6"
          onClick={ctaAction}
        />
      )}
    </div>
  );
}
