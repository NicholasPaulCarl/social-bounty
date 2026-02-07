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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <i className="pi pi-exclamation-circle text-danger-500" style={{ fontSize: '4rem' }} />
        <h1 className="text-2xl font-bold text-neutral-900 mt-6">Something went wrong</h1>
        <p className="text-neutral-600 mt-2 max-w-md mx-auto">
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
