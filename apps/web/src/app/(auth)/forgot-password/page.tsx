'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
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

  if (submitted) {
    return (
      <>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '2rem' }}>mail</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-headline tracking-tight">Check your email</h2>
          <p className="text-on-surface-variant mt-3">
            If an account exists with <strong className="text-on-surface">{email}</strong>, we have sent a password reset link.
          </p>
          <Link href="/login" className="inline-block mt-8 text-primary hover:opacity-80 transition-opacity font-medium">
            Back to Sign In
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-on-surface text-center mb-2 font-headline tracking-tight">Forgot Password</h2>
      <p className="text-on-surface-variant text-center mb-8">
        Enter your email and we will send you a reset link.
      </p>

      {error && (
        <div className="bg-error-container p-4 rounded-2xl flex items-center space-x-3 mb-6">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="group">
          <label htmlFor="email" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-14"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            label="Send Reset Link"
            icon="pi pi-send"
            loading={loading}
            className="w-full"
          />
        </div>
      </form>

      <p className="text-sm text-on-surface-variant text-center mt-8">
        <Link href="/login" className="text-primary hover:opacity-80 transition-opacity font-medium">
          Back to Sign In
        </Link>
      </p>
    </>
  );
}
