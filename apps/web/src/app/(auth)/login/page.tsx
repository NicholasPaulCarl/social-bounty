'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.requestOtp({ email });
      setStep('otp');
      setCooldown(60);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.verifyOtp({ email, otp });
      login(response);
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

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setError('');
    try {
      await authApi.requestOtp({ email });
      setCooldown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    }
  }, [cooldown, email]);

  const handleChangeEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
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

      {step === 'email' ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
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
              <i className="pi pi-arrow-right" />
            )}
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <p className="text-sm text-text-secondary text-center">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          <div>
            <label
              htmlFor="otp"
              className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
            >
              Verification Code
            </label>
            <InputText
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="w-full text-center text-lg tracking-[0.3em]"
              placeholder="000000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
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

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-accent-cyan hover:text-accent-cyan/80 transition-colors duration-fast"
            >
              Use different email
            </button>
            {cooldown > 0 ? (
              <span className="text-text-muted">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-accent-cyan hover:text-accent-cyan/80 transition-colors duration-fast"
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
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
