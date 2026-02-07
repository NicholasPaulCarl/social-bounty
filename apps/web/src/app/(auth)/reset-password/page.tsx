'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { LoadingState } from '@/components/common/LoadingState';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess } = useToast();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Card>
        <div className="text-center">
          <i className="pi pi-exclamation-circle text-danger-500" style={{ fontSize: '3rem' }} />
          <h2 className="text-xl font-semibold text-neutral-900 mt-4">Invalid Reset Link</h2>
          <p className="text-neutral-600 mt-2">This password reset link is invalid or has expired.</p>
          <Link
            href="/forgot-password"
            className="inline-block mt-6 text-primary-600 hover:text-primary-700 font-medium"
          >
            Request a new link
          </Link>
        </div>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      showSuccess('Password reset successfully! Please sign in.');
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold text-neutral-900 text-center mb-6">Reset Password</h2>

      {error && <Message severity="error" text={error} className="w-full mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
            New Password
          </label>
          <Password
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            toggleMask
            className="w-full"
            inputClassName="w-full"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            Confirm New Password
          </label>
          <Password
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            feedback={false}
            toggleMask
            className="w-full"
            inputClassName="w-full"
          />
        </div>

        <Button
          type="submit"
          label="Reset Password"
          icon="pi pi-lock"
          loading={loading}
          className="w-full"
        />
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState type="inline" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
