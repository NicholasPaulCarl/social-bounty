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
      <div className="glass-card p-8 animate-fade-up">
        <div className="text-center">
          <i className="pi pi-exclamation-circle text-accent-rose" style={{ fontSize: '3rem' }} />
          <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6 mt-4">Invalid Reset Link</h2>
          <p className="text-text-secondary text-sm mt-2">This password reset link is invalid or has expired.</p>
          <Link
            href="/forgot-password"
            className="inline-block mt-6 text-accent-cyan hover:text-accent-cyan/80 font-medium"
          >
            Request a new link
          </Link>
        </div>
      </div>
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
    <div className="glass-card p-8 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">Reset Password</h2>

      {error && <p className="text-accent-rose text-xs mt-1 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
          <label htmlFor="confirmPassword" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState type="inline" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
