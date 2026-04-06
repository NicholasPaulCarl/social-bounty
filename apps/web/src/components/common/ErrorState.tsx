'use client';

import { Button } from 'primereact/button';
import { ApiError } from '@/lib/api/client';

interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error?.message || 'An unexpected error occurred.';

  const statusCode = error instanceof ApiError ? error.statusCode : undefined;

  const title = statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Access Denied' : 'Something went wrong';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-error" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>
          error
        </span>
      </div>
      <h3 className="text-lg font-bold text-on-surface font-headline">{title}</h3>

      <div className="bg-error-container p-4 rounded-2xl flex items-center space-x-4 mt-4 max-w-md">
        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        </div>
        <div>
          <p className="font-bold text-error">Error</p>
          <p className="text-sm text-error/80">{errorMessage}</p>
        </div>
      </div>

      {onRetry && (
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          outlined
          className="mt-6"
          onClick={onRetry}
        />
      )}
    </div>
  );
}
