'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
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
    <div className="glass-card p-8 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-text-primary text-center mb-6">
        Create Account
      </h2>

      {error && <Message severity="error" text={error} className="w-full mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-5">
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
              <small className="text-accent-rose text-xs mt-1 block">{fieldErrors.firstName}</small>
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
              <small className="text-accent-rose text-xs mt-1 block">{fieldErrors.lastName}</small>
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
            <small className="text-accent-rose text-xs mt-1 block">{fieldErrors.email}</small>
          )}
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
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
            toggleMask
            className={`w-full ${fieldErrors.password ? 'p-invalid' : ''}`}
            inputClassName="w-full"
          />
          {fieldErrors.password && (
            <small className="text-accent-rose text-xs mt-1 block">{fieldErrors.password}</small>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
          >
            Confirm Password
          </label>
          <Password
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            required
            feedback={false}
            toggleMask
            className={`w-full ${fieldErrors.confirmPassword ? 'p-invalid' : ''}`}
            inputClassName="w-full"
          />
          {fieldErrors.confirmPassword && (
            <small className="text-accent-rose text-xs mt-1 block">{fieldErrors.confirmPassword}</small>
          )}
        </div>

        <Button
          type="submit"
          label="Create Account"
          icon="pi pi-user-plus"
          loading={loading}
          className="w-full"
        />
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-accent-cyan hover:text-accent-cyan/80 font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
