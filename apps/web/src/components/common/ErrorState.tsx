'use client';

import { Button } from 'primereact/button';
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
      ? 'Not Found'
      : statusCode === 403
        ? 'Access Denied'
        : 'Something went wrong';

  const icon =
    statusCode === 404
      ? 'pi-search'
      : statusCode === 403
        ? 'pi-lock'
        : 'pi-exclamation-circle';

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-danger-600/20 blur-2xl rounded-full" />
        <i
          className={`pi ${icon} text-danger-600 relative text-[2rem] sm:text-[3rem]`}
        />
      </div>
      <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary mt-4 sm:mt-6">
        {title}
      </h3>
      <p className="text-sm text-text-secondary mt-2 text-center max-w-md">{message}</p>
      {onRetry && (
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          outlined
          className="mt-4 sm:mt-6"
          onClick={onRetry}
        />
      )}
    </div>
  );
}
