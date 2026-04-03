'use client';

import { useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { setGlobalToast } from '@/hooks/useToast';

export function Providers({ children }: { children: React.ReactNode | any }) {
  const toastRef = useRef<Toast>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <AuthProvider>
          <Toast
            ref={(ref) => {
              (toastRef as React.MutableRefObject<Toast | null>).current = ref;
              setGlobalToast(ref);
            }}
            position="top-right"
          />
          <ConfirmDialog />
          {children}
        </AuthProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  );
}
