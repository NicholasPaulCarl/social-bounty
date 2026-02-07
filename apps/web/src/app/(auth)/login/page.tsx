'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
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
    <Card>
      <h2 className="text-xl font-semibold text-neutral-900 text-center mb-6">Sign In</h2>

      {error && <Message severity="error" text={error} className="w-full mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
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
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
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

        <Button
          type="submit"
          label="Sign In"
          icon="pi pi-sign-in"
          loading={loading}
          className="w-full"
        />
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
          Forgot your password?
        </Link>
        <p className="text-sm text-neutral-500">
          {"Don't have an account? "}
          <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </Card>
  );
}
