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
      <div className="glass-card p-8 animate-fade-up">
        <div className="text-center">
          <i className="pi pi-envelope text-accent-cyan" style={{ fontSize: '3rem' }} />
          <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6 mt-4">Check your email</h2>
          <p className="text-text-secondary text-sm mt-2">
            If an account exists with <strong>{email}</strong>, we have sent a password reset link.
          </p>
          <Link href="/login" className="inline-block mt-6 text-accent-cyan hover:text-accent-cyan/80 font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">Forgot Password</h2>
      <p className="text-text-secondary text-sm text-center mb-6">
        Enter your email and we will send you a reset link.
      </p>

      {error && <p className="text-accent-rose text-xs mt-1 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
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

      <p className="text-sm text-center mt-6">
        <Link href="/login" className="text-accent-cyan hover:text-accent-cyan/80 font-medium">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
