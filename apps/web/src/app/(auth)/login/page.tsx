'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="glass-card p-8 shadow-level-3 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">
        Sign In
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          <i className="pi pi-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
          >
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

        <div>
          <label
            htmlFor="password"
            className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
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
            className="w-full"
            inputClassName="w-full"
          />
        </div>

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
    </div>
  );
}
