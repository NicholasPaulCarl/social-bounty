'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { LoadingState } from '@/components/common/LoadingState';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setError('No verification token provided.');
        return;
      }

      try {
        await authApi.verifyEmail({ token });
        setStatus('success');
      } catch (err) {
        setStatus('error');
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Verification failed. The link may have expired.');
        }
      }
    }
    verify();
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
    } catch {
      // Silently fail - don't reveal email existence
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="glass-card p-8 animate-fade-up">
        <div className="text-center py-8">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <p className="text-text-secondary text-sm mt-4">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="glass-card p-8 animate-fade-up">
        <div className="text-center">
          <i className="pi pi-check-circle text-accent-emerald" style={{ fontSize: '3rem' }} />
          <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6 mt-4">Email Verified</h2>
          <p className="text-text-secondary text-sm mt-2">
            Your email has been verified. You can now sign in.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-accent-cyan hover:text-accent-cyan/80 font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-up">
      <div className="text-center">
        <i className="pi pi-times-circle text-accent-rose" style={{ fontSize: '3rem' }} />
        <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6 mt-4">Verification Failed</h2>
        <p className="text-accent-rose text-xs mt-1 mt-4">{error}</p>
        <div className="mt-6 space-y-3">
          <Button
            label="Resend Verification Email"
            icon="pi pi-send"
            outlined
            onClick={handleResend}
            loading={resending}
          />
          <div>
            <Link href="/login" className="text-accent-cyan hover:text-accent-cyan/80 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState type="inline" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
