'use client';

import { Button } from 'primereact/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <i className="pi pi-exclamation-circle text-error" style={{ fontSize: '4rem' }} />
        <h1 className="text-2xl font-bold text-on-surface mt-6">Something went wrong</h1>
        <p className="text-on-surface-variant mt-2 max-w-md mx-auto">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          className="mt-6"
          onClick={reset}
        />
      </div>
    </div>
  );
}
