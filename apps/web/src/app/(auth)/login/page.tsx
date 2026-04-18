'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { AlertCircle, ArrowRight, Loader2, LogIn } from 'lucide-react';
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
        setError('Something went wrong. Try again.');
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
        setError('Something went wrong. Try again.');
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
        setError('Couldn\u2019t resend the code. Try again.');
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
      <p className="eyebrow text-center mb-2">Welcome back</p>
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">
        Log in
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-danger-600/30 bg-danger-600/10 px-4 py-3 text-sm text-danger-600 flex items-start gap-2">
          <AlertCircle size={18} strokeWidth={2} className="flex-none mt-0.5" />
          <span>{error}</span>
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
            className="btn btn-primary btn-lg w-full rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <ArrowRight size={18} strokeWidth={2} />
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
              Verification code
            </label>
            <InputText
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="w-full text-center font-mono tabular-nums text-lg tracking-[0.3em]"
              placeholder="000000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="btn btn-primary btn-lg w-full rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <LogIn size={18} strokeWidth={2} />
            )}
            Log in
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-pink-600 hover:text-pink-700 transition-colors duration-fast"
            >
              Use a different email
            </button>
            {cooldown > 0 ? (
              <span className="text-text-muted font-mono tabular-nums">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-pink-600 hover:text-pink-700 transition-colors duration-fast"
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-text-muted">
          {'Don\u2019t have an account? '}
          <Link
            href="/signup"
            className="text-pink-600 hover:text-pink-700 font-medium transition-colors duration-fast"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
