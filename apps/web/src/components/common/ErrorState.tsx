'use client';

import { Button } from 'primereact/button';
import { Search, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/api/client';

interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : error?.message || 'An unexpected error occurred.';

  const statusCode = error instanceof ApiError ? error.statusCode : undefined;

  const title =
    statusCode === 404
      ? 'Not found'
      : statusCode === 403
        ? 'Access denied'
        : 'Something went wrong';

  const Icon = statusCode === 404 ? Search : statusCode === 403 ? Lock : AlertCircle;

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-danger-600/20 blur-2xl rounded-full" />
        <Icon
          size={48}
          strokeWidth={2}
          className="text-danger-600 relative"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary mt-4 sm:mt-6">
        {title}
      </h3>
      <p className="text-sm text-text-secondary mt-2 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button
          label="Try again"
          icon={<RefreshCw size={16} strokeWidth={2} />}
          outlined
          className="mt-4 sm:mt-6"
          onClick={onRetry}
        />
      )}
    </div>
  );
}
