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
      <>
        <div className="text-center py-8">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <p className="text-on-surface-variant mt-4">Verifying your email...</p>
        </div>
      </>
    );
  }

  if (status === 'success') {
    return (
      <>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-success" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-headline tracking-tight">Email Verified</h2>
          <p className="text-on-surface-variant mt-3">
            Your email has been verified. You can now sign in.
          </p>
          <Link
            href="/login"
            className="inline-block mt-8 px-8 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition-all active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>cancel</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface font-headline tracking-tight">Verification Failed</h2>
        <div className="bg-error-container p-4 rounded-2xl flex items-center space-x-3 mt-4 max-w-sm mx-auto">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm text-error">{error}</p>
        </div>
        <div className="mt-8 space-y-4">
          <Button
            label="Resend Verification Email"
            icon="pi pi-send"
            outlined
            onClick={handleResend}
            loading={resending}
          />
          <div>
            <Link href="/login" className="text-sm text-primary hover:opacity-80 transition-opacity font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState type="inline" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
