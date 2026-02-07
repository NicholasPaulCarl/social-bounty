'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
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
      <Card>
        <div className="text-center">
          <i className="pi pi-envelope text-primary-500" style={{ fontSize: '3rem' }} />
          <h2 className="text-xl font-semibold text-neutral-900 mt-4">Check your email</h2>
          <p className="text-neutral-600 mt-2">
            If an account exists with <strong>{email}</strong>, we have sent a password reset link.
          </p>
          <Link href="/login" className="inline-block mt-6 text-primary-600 hover:text-primary-700 font-medium">
            Back to Sign In
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-neutral-900 text-center mb-2">Forgot Password</h2>
      <p className="text-sm text-neutral-500 text-center mb-6">
        Enter your email and we will send you a reset link.
      </p>

      {error && <Message severity="error" text={error} className="w-full mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email
          </label>
          <InputText
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
            placeholder="you@example.com"
          />
        </div>

        <Button
          type="submit"
          label="Send Reset Link"
          icon="pi pi-send"
          loading={loading}
          className="w-full"
        />
      </form>

      <p className="text-sm text-neutral-500 text-center mt-6">
        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to Sign In
        </Link>
      </p>
    </Card>
  );
}
