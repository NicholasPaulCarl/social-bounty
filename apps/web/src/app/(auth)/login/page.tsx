'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { AlertCircle, ArrowRight, Loader2, LogIn, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { OtpChannel } from '@social-bounty/shared';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<OtpChannel>(OtpChannel.EMAIL);
  const [switchCount, setSwitchCount] = useState(0);
  const [switchPending, setSwitchPending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const isSmsChannel = selectedChannel === OtpChannel.SMS;

  const identifierPayload = isSmsChannel
    ? { phoneNumber }
    : { email };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.requestOtp({ ...identifierPayload, channel: selectedChannel });
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
      const response = await authApi.verifyOtp({ ...identifierPayload, otp });
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
      await authApi.requestOtp({ ...identifierPayload, channel: selectedChannel });
      setCooldown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Couldn\u2019t resend the code. Try again.');
      }
    }
  }, [cooldown, email, phoneNumber, selectedChannel, identifierPayload]);

  const handleChangeIdentifier = () => {
    setStep('email');
    setOtp('');
    setError('');
    setSwitchCount(0);
    setSelectedChannel(OtpChannel.EMAIL);
  };

  async function handleChannelSwitch() {
    setSwitchPending(true);
    setError('');
    try {
      await authApi.switchOtpChannel(identifierPayload);
      const newChannel = selectedChannel === OtpChannel.EMAIL ? OtpChannel.SMS : OtpChannel.EMAIL;
      setSelectedChannel(newChannel);
      setSwitchCount((n) => n + 1);
      setCooldown(0);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 429) {
        setError('Too many channel switches — wait a minute and try again.');
      } else {
        setError("Couldn't switch channel. Try again.");
      }
    } finally {
      setSwitchPending(false);
    }
  }

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
              htmlFor="identifier"
              className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
            >
              {isSmsChannel ? 'Contact Number' : 'Email'}
            </label>
            {isSmsChannel ? (
              <InputText
                id="identifier"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full"
                placeholder="+27 81 234 5678"
              />
            ) : (
              <InputText
                id="identifier"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="you@example.com"
              />
            )}
          </div>

          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              How should we send your code?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedChannel(OtpChannel.EMAIL)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
                  selectedChannel === OtpChannel.EMAIL
                    ? 'border-pink-600 bg-pink-50 text-pink-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                aria-pressed={selectedChannel === OtpChannel.EMAIL}
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel(OtpChannel.SMS)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
                  selectedChannel === OtpChannel.SMS
                    ? 'border-pink-600 bg-pink-50 text-pink-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                aria-pressed={selectedChannel === OtpChannel.SMS}
              >
                <MessageSquare className="h-4 w-4" />
                <span>SMS</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            {loading ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <ArrowRight size={18} strokeWidth={2} />
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <p className="text-sm text-text-secondary text-center">
            {isSmsChannel
              ? <>We sent a 6-digit code to <strong>{phoneNumber}</strong></>
              : <>We sent a 6-digit code to <strong>{email}</strong></>}
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
              onClick={handleChangeIdentifier}
              className="text-pink-600 hover:text-pink-700 transition-colors duration-fast"
            >
              {isSmsChannel ? 'Use a different number' : 'Use a different email'}
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

          {switchCount < 2 && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleChannelSwitch}
                disabled={switchPending}
                className="text-sm text-pink-600 hover:underline disabled:opacity-50"
              >
                <RefreshCw className="inline h-3 w-3 mr-1" />
                Try {selectedChannel === OtpChannel.EMAIL ? 'SMS' : 'Email'} instead
              </button>
            </div>
          )}
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
