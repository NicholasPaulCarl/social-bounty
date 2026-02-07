'use client';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
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

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <i className="pi pi-exclamation-circle text-danger-500" style={{ fontSize: '3rem' }} />
      <h3 className="text-lg font-semibold text-neutral-700 mt-4">
        {statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Access Denied' : 'Something went wrong'}
      </h3>
      <Message severity="error" text={message} className="mt-4" />
      {onRetry && (
        <Button
          label="Try Again"
          icon="pi pi-refresh"
          outlined
          className="mt-4"
          onClick={onRetry}
        />
      )}
    </div>
  );
}
