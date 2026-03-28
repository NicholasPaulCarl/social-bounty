'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

const DEMO_ACCOUNTS = [
  { label: 'Demo Participant', email: 'participant@demo.com', icon: 'pi pi-user', severity: 'info' as const },
  { label: 'Demo Business Admin', email: 'admin@demo.com', icon: 'pi pi-briefcase', severity: 'success' as const },
  { label: 'Demo Super Admin', email: 'superadmin@demo.com', icon: 'pi pi-shield', severity: 'warning' as const },
];

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
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

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setDemoLoading(demoEmail);

    try {
      await login(demoEmail, 'DemoPassword123!');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="glass-card p-8 shadow-level-3 animate-fade-up">
      {/* ── Heading ── */}
      <h2 className="text-xl font-heading font-semibold text-text-primary text-center mb-6">
        Sign In
      </h2>

      {/* ── Error message ── */}
      {error && (
        <div className="mb-4 rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          <i className="pi pi-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      {/* ── Login form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Email
          </label>
          <InputText
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full glass-input !bg-glass-bg !border-glass-border !text-text-primary placeholder:!text-text-muted focus:!border-accent-cyan focus:!shadow-ring-glow-cyan"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Password
          </label>
          <Password
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            feedback={false}
            toggleMask
            className="w-full [&_.p-password-input]:glass-input [&_.p-password-input]:!bg-glass-bg [&_.p-password-input]:!border-glass-border [&_.p-password-input]:!text-text-primary [&_.p-password-input]:placeholder:!text-text-muted [&_.p-password-input]:focus:!border-accent-cyan [&_.p-password-input]:focus:!shadow-ring-glow-cyan"
            inputClassName="w-full"
          />
        </div>

        {/* ── Primary CTA ── */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white
                     bg-gradient-to-r from-accent-cyan to-accent-blue
                     shadow-glow-cyan hover:shadow-glow-cyan-intense
                     transition-all duration-normal
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <i className="pi pi-spinner pi-spin" />
          ) : (
            <i className="pi pi-sign-in" />
          )}
          Sign In
        </button>
      </form>

      {/* ── Links ── */}
      <div className="mt-6 text-center space-y-2">
        <Link
          href="/forgot-password"
          className="text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors duration-fast"
        >
          Forgot your password?
        </Link>
        <p className="text-sm text-text-muted">
          {"Don't have an account? "}
          <Link
            href="/signup"
            className="text-accent-cyan hover:text-accent-cyan/80 font-medium transition-colors duration-fast"
          >
            Sign Up
          </Link>
        </p>
      </div>

      {/* ── Demo accounts ── */}
      {isDemoMode && (
        <div className="mt-8">
          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border" />
            </div>
            <span className="relative bg-bg-surface/80 px-3 text-xs uppercase tracking-wider text-text-muted">
              Or sign in as a demo user
            </span>
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading || (demoLoading !== null && demoLoading !== account.email)}
                onClick={() => handleDemoLogin(account.email)}
                className="group w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                           border border-glass-border bg-glass-bg text-text-secondary
                           hover:bg-glass-hover hover:text-text-primary hover:border-accent-cyan/40 hover:shadow-glow-cyan
                           transition-all duration-normal
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {demoLoading === account.email ? (
                  <i className="pi pi-spinner pi-spin text-accent-cyan" />
                ) : (
                  <i className={`${account.icon} text-accent-cyan`} />
                )}
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
