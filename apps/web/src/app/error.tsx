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
    <div className="min-h-screen flex items-center justify-center bg-abyss px-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full" />
          <i
            className="pi pi-exclamation-circle text-rose-400 relative"
            style={{ fontSize: '4rem' }}
          />
        </div>
        <h1 className="text-2xl font-heading font-bold text-primary mb-3">
          Something went wrong
        </h1>
        <p className="text-secondary mb-2">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && (
          <p className="text-muted text-sm mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          className="mt-4"
          onClick={reset}
        />
      </div>
    </div>
  );
}
