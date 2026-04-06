'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';

export default function SignupPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setLoading(true);

    try {
      await authApi.signup({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      showSuccess('Account created! Please check your email to verify your account.');
      router.push('/login');
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

  return (
    <>
      <h2 className="text-2xl font-bold text-on-surface text-center mb-8 font-headline tracking-tight">Create Account</h2>

      {error && (
        <div className="bg-error-container p-4 rounded-2xl flex items-center space-x-3 mb-6">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="group">
            <label htmlFor="firstName" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
              First Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
              <InputText
                id="firstName"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
                className={`w-full pl-14 ${fieldErrors.firstName ? 'p-invalid' : ''}`}
              />
            </div>
            {fieldErrors.firstName && (
              <small className="text-error ml-4 mt-1 block">{fieldErrors.firstName}</small>
            )}
          </div>
          <div className="group">
            <label htmlFor="lastName" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
              Last Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
              <InputText
                id="lastName"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
                className={`w-full pl-14 ${fieldErrors.lastName ? 'p-invalid' : ''}`}
              />
            </div>
            {fieldErrors.lastName && (
              <small className="text-error ml-4 mt-1 block">{fieldErrors.lastName}</small>
            )}
          </div>
        </div>

        <div className="group">
          <label htmlFor="email" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
            <InputText
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className={`w-full pl-14 ${fieldErrors.email ? 'p-invalid' : ''}`}
              placeholder="you@example.com"
            />
          </div>
          {fieldErrors.email && (
            <small className="text-error ml-4 mt-1 block">{fieldErrors.email}</small>
          )}
        </div>

        <div className="group">
          <label htmlFor="password" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">lock</span>
            <Password
              id="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              toggleMask
              className={`w-full ${fieldErrors.password ? 'p-invalid' : ''}`}
              inputClassName="w-full pl-14"
            />
          </div>
          {fieldErrors.password && (
            <small className="text-error ml-4 mt-1 block">{fieldErrors.password}</small>
          )}
        </div>

        <div className="group">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 ml-4 group-focus-within:text-primary transition-colors">
            Confirm Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">lock</span>
            <Password
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              required
              feedback={false}
              toggleMask
              className={`w-full ${fieldErrors.confirmPassword ? 'p-invalid' : ''}`}
              inputClassName="w-full pl-14"
            />
          </div>
          {fieldErrors.confirmPassword && (
            <small className="text-error ml-4 mt-1 block">{fieldErrors.confirmPassword}</small>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            label="Create Account"
            icon="pi pi-user-plus"
            loading={loading}
            className="w-full"
          />
        </div>
      </form>

      <p className="text-sm text-on-surface-variant text-center mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:opacity-80 transition-opacity font-medium">
          Sign In
        </Link>
      </p>
    </>
  );
}
