'use client';

import { Button } from 'primereact/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
          <div className="absolute inset-0 bg-danger-600/20 blur-2xl rounded-full" />
          <AlertCircle size={64} strokeWidth={1.5} className="text-danger-600 relative" />
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
          icon={<RefreshCw size={16} strokeWidth={2} />}
          className="mt-4"
          onClick={reset}
        />
      </div>
    </div>
  );
}
