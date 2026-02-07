'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
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
      <Card>
        <div className="text-center py-8">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <p className="text-neutral-600 mt-4">Verifying your email...</p>
        </div>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card>
        <div className="text-center">
          <i className="pi pi-check-circle text-success-500" style={{ fontSize: '3rem' }} />
          <h2 className="text-xl font-semibold text-neutral-900 mt-4">Email Verified</h2>
          <p className="text-neutral-600 mt-2">
            Your email has been verified. You can now sign in.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-center">
        <i className="pi pi-times-circle text-danger-500" style={{ fontSize: '3rem' }} />
        <h2 className="text-xl font-semibold text-neutral-900 mt-4">Verification Failed</h2>
        <Message severity="error" text={error} className="mt-4" />
        <div className="mt-6 space-y-3">
          <Button
            label="Resend Verification Email"
            icon="pi pi-send"
            outlined
            onClick={handleResend}
            loading={resending}
          />
          <div>
            <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState type="inline" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
