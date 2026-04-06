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
    <>
      <h2 className="text-2xl font-bold text-on-surface text-center mb-8 font-headline tracking-tight">Sign In</h2>

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

        <div className="group">
          <label htmlFor="password" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">lock</span>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            label="Sign In"
            icon="pi pi-sign-in"
            loading={loading}
            className="w-full"
          />
        </div>
      </form>

      <div className="mt-8 text-center space-y-3">
        <Link href="/forgot-password" className="text-sm text-primary hover:opacity-80 transition-opacity font-medium">
          Forgot your password?
        </Link>
        <p className="text-sm text-on-surface-variant">
          {"Don't have an account? "}
          <Link href="/signup" className="text-primary hover:opacity-80 transition-opacity font-medium">
            Sign Up
          </Link>
        </p>
      </div>

      {isDemoMode && (
        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <span className="relative bg-surface-container-low px-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Or sign in as a demo user
            </span>
          </div>
          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                type="button"
                label={account.label}
                icon={account.icon}
                severity={account.severity}
                outlined
                loading={demoLoading === account.email}
                disabled={loading || (demoLoading !== null && demoLoading !== account.email)}
                onClick={() => handleDemoLogin(account.email)}
                className="w-full"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
