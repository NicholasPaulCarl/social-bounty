'use client';

import { useRef } from 'react';
import type { Toast } from 'primereact/toast';

let globalToast: Toast | null = null;

export function setGlobalToast(ref: Toast | null) {
  globalToast = ref;
}

export function useToast() {
  const toastRef = useRef<Toast>(null);
  const toast = toastRef.current || globalToast;

  return {
    toastRef,
    showSuccess: (detail: string, summary = 'Success') => {
      toast?.show({ severity: 'success', summary, detail, life: 3000 });
    },
    showError: (detail: string, summary = 'Error') => {
      toast?.show({ severity: 'error', summary, detail, life: 5000 });
    },
    showInfo: (detail: string, summary = 'Info') => {
      toast?.show({ severity: 'info', summary, detail, life: 3000 });
    },
    showWarn: (detail: string, summary = 'Warning') => {
      toast?.show({ severity: 'warn', summary, detail, life: 4000 });
    },
  };
}
