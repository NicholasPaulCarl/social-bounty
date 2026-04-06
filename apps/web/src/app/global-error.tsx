'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-on-surface mt-6">Something went wrong</h1>
            <p className="text-on-surface-variant mt-2 max-w-md mx-auto">
              {error.message || 'A critical error occurred. Please try again.'}
            </p>
            <button
              onClick={reset}
              className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
