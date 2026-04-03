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
      <body
        className="font-sans antialiased"
        style={{
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div
              style={{
                fontSize: '4rem',
                marginBottom: '1.5rem',
                color: '#e11d48',
              }}
            >
              !
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              Critical Error
            </h1>
            <p
              style={{
                color: '#475569',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              {error.message || 'A critical error occurred. Please try again.'}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #db2777, #be185d)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
