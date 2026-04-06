'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
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
      <>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error" style={{ fontSize: '2rem', fontVariationSettings: "'FILL' 1" }}>error</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-headline tracking-tight">Invalid Reset Link</h2>
          <p className="text-on-surface-variant mt-3">This password reset link is invalid or has expired.</p>
          <Link
            href="/forgot-password"
            className="inline-block mt-8 text-primary hover:opacity-80 transition-opacity font-medium"
          >
            Request a new link
          </Link>
        </div>
      </>
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
    <>
      <h2 className="text-2xl font-bold text-on-surface text-center mb-8 font-headline tracking-tight">Reset Password</h2>

      {error && (
        <div className="bg-error-container p-4 rounded-2xl flex items-center space-x-3 mb-6">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="group">
          <label htmlFor="password" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            New Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">lock</span>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              toggleMask
              className="w-full"
              inputClassName="w-full pl-14"
            />
          </div>
        </div>

        <div className="group">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            Confirm New Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">lock</span>
            <Password
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full pl-14"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            label="Reset Password"
            icon="pi pi-lock"
            loading={loading}
            className="w-full"
          />
        </div>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState type="inline" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
