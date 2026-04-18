'use client';

import { useState, useRef, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

type VerifyStatus = 'idle' | 'verifying' | 'valid' | 'invalid';

interface VerifiedLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function VerifiedLinkInput({
  value,
  onChange,
  placeholder = 'https://instagram.com/p/...',
  className = '',
}: VerifiedLinkInputProps) {
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const verifyUrl = useCallback(async (url: string) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();

    const trimmed = url.trim();
    if (!trimmed) {
      setStatus('idle');
      return;
    }

    // Quick client-side check before hitting the API
    try {
      new URL(trimmed);
    } catch {
      setStatus('invalid');
      return;
    }

    setStatus('verifying');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        `${API_URL}/health/verify-url?url=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      );
      const data = await res.json();
      setStatus(data.active ? 'valid' : 'invalid');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatus('invalid');
      }
    }
  }, []);

  const handleBlur = () => {
    if (value.trim()) {
      verifyUrl(value);
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    // Reset status when user types again
    if (status !== 'idle') {
      setStatus('idle');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <InputText
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full !pr-10"
      />
      {/* Status icon inside the input */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {status === 'verifying' && (
          <Loader2 size={16} strokeWidth={2} className="text-pink-600 animate-spin" />
        )}
        {status === 'valid' && (
          <CheckCircle2 size={16} strokeWidth={2} className="text-success-600" />
        )}
        {status === 'invalid' && (
          <XCircle size={16} strokeWidth={2} className="text-danger-600" />
        )}
      </div>
    </div>
  );
}
