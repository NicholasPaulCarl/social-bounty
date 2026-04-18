'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export default function SignupPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
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
        setError('An unexpected error occurred. Please try again.');
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
      await authApi.requestOtp({ email: form.email });
      setCooldown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to resend code. Please try again.');
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
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">
        Create Account
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-danger-600/30 bg-danger-600/10 px-4 py-3 text-sm text-danger-600">
          <i className="pi pi-exclamation-circle mr-2" />
          {error}
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
                First Name
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
                Last Name
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
              <p className="text-sm font-medium text-text-primary">Register as a Brand</p>
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
                  Brand Name
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
                  Brand Contact Email
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
            className="group relative w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white
                       bg-gradient-to-r from-pink-600 to-blue-600
                       shadow-glow-brand hover:shadow-glow-brand-intense
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
        <form onSubmit={handleSignup} className="space-y-5">
          <p className="text-sm text-text-secondary text-center">
            We sent a 6-digit code to <strong>{form.email}</strong>
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
                       bg-gradient-to-r from-pink-600 to-blue-600
                       shadow-glow-brand hover:shadow-glow-brand-intense
                       transition-all duration-normal
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <i className="pi pi-spinner pi-spin" />
            ) : (
              <i className="pi pi-user-plus" />
            )}
            Create Account
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-pink-600 hover:text-pink-600/80 transition-colors duration-fast"
            >
              Use different email
            </button>
            {cooldown > 0 ? (
              <span className="text-text-muted">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-pink-600 hover:text-pink-600/80 transition-colors duration-fast"
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      )}

      <p className="text-sm text-text-muted text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-pink-600 hover:text-pink-600/80 font-medium transition-colors duration-fast">
          Sign In
        </Link>
      </p>
    </div>
  );
}
