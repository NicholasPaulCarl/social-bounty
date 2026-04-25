'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { AlertCircle, ArrowRight, Loader2, Phone, UserPlus } from 'lucide-react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export default function SignupPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    registerAsBrand: false,
    brandName: '',
    brandContactEmail: '',
  });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.contactNumber) {
      errors.contactNumber = 'Phone number is required';
    } else if (!isValidPhoneNumber(form.contactNumber, 'ZA')) {
      errors.contactNumber = 'Enter a valid international phone number (e.g. +27 82 000 0000)';
    }
    if (!form.email.trim()) errors.email = 'Email is required';
    if (form.registerAsBrand) {
      if (!form.brandName.trim()) errors.brandName = 'Brand name is required';
      if (!form.brandContactEmail.trim()) errors.brandContactEmail = 'Brand contact email is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setLoading(true);

    try {
      await authApi.requestOtp({ email: form.email });
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.signup({
        email: form.email,
        otp,
        firstName: form.firstName,
        lastName: form.lastName,
        contactNumber: form.contactNumber.trim(),
        ...(form.registerAsBrand
          ? {
              registerAsBrand: true,
              brandName: form.brandName,
              brandContactEmail: form.brandContactEmail,
            }
          : {}),
      });
      login(response);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          const errors: Record<string, string> = {};
          err.details.forEach((d) => { errors[d.field] = d.message; });
          setFieldErrors(errors);
        }
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
      await authApi.requestOtp({ email: form.email });
      setCooldown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Couldn\u2019t resend the code. Try again.');
      }
    }
  }, [cooldown, form.email]);

  const handleChangeEmail = () => {
    setStep('details');
    setOtp('');
    setError('');
  };

  return (
    <div className="glass-card p-8 animate-fade-up">
      <p className="eyebrow text-center mb-2">Get started</p>
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">
        Create your account
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-danger-600/30 bg-danger-600/10 px-4 py-3 text-sm text-danger-600 flex items-start gap-2">
          <AlertCircle size={18} strokeWidth={2} className="flex-none mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 'details' ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                First name
              </label>
              <InputText
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
                className={`w-full ${fieldErrors.firstName ? 'p-invalid' : ''}`}
              />
              {fieldErrors.firstName && (
                <small className="text-danger-600 text-xs mt-1 block">{fieldErrors.firstName}</small>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Last name
              </label>
              <InputText
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
                className={`w-full ${fieldErrors.lastName ? 'p-invalid' : ''}`}
              />
              {fieldErrors.lastName && (
                <small className="text-danger-600 text-xs mt-1 block">{fieldErrors.lastName}</small>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="contactNumber"
              className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
            >
              Phone number *
            </label>
            <InputText
              id="contactNumber"
              type="tel"
              value={form.contactNumber}
              onChange={(e) => updateField('contactNumber', e.target.value)}
              className={`w-full ${fieldErrors.contactNumber ? 'p-invalid' : ''}`}
              placeholder="+27 82 000 0000"
            />
            {fieldErrors.contactNumber && (
              <small className="text-danger-600 text-xs mt-1 block">{fieldErrors.contactNumber}</small>
            )}
          </div>

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
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className={`w-full ${fieldErrors.email ? 'p-invalid' : ''}`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <small className="text-danger-600 text-xs mt-1 block">{fieldErrors.email}</small>
            )}
          </div>

          {/* Register as Brand toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-glass-border bg-glass-bg/50">
            <div>
              <p className="text-sm font-medium text-text-primary">Register as a brand</p>
              <p className="text-xs text-text-muted">Create a brand profile to post bounties</p>
            </div>
            <InputSwitch
              checked={form.registerAsBrand}
              onChange={(e) => setForm((prev) => ({ ...prev, registerAsBrand: e.value }))}
            />
          </div>

          {form.registerAsBrand && (
            <div className="space-y-4 p-4 rounded-lg border border-pink-600/20 bg-pink-600/5">
              <div>
                <label
                  htmlFor="brandName"
                  className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
                >
                  Brand name
                </label>
                <InputText
                  id="brandName"
                  value={form.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  required
                  className={`w-full ${fieldErrors.brandName ? 'p-invalid' : ''}`}
                  placeholder="Your brand name"
                />
                {fieldErrors.brandName && (
                  <small className="text-danger-600 text-xs mt-1 block">{fieldErrors.brandName}</small>
                )}
              </div>
              <div>
                <label
                  htmlFor="brandContactEmail"
                  className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
                >
                  Brand contact email
                </label>
                <InputText
                  id="brandContactEmail"
                  type="email"
                  value={form.brandContactEmail}
                  onChange={(e) => updateField('brandContactEmail', e.target.value)}
                  required
                  className={`w-full ${fieldErrors.brandContactEmail ? 'p-invalid' : ''}`}
                  placeholder="brand@example.com"
                />
                {fieldErrors.brandContactEmail && (
                  <small className="text-danger-600 text-xs mt-1 block">{fieldErrors.brandContactEmail}</small>
                )}
              </div>
            </div>
          )}

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
        <form onSubmit={handleSignup} className="space-y-5">
          <p className="text-sm text-text-secondary text-center">
            We sent a 6-digit code to <strong>{form.email}</strong>
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
              <UserPlus size={18} strokeWidth={2} />
            )}
            Create account
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

      <p className="text-sm text-text-muted text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-pink-600 hover:text-pink-700 font-medium transition-colors duration-fast">
          Log in
        </Link>
      </p>
    </div>
  );
}
