'use client';

import { useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Loader2, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  amount: string;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ amount, currency, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
    } else {
      onSuccess();
    }
  }, [stripe, elements, onSuccess]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="glass-card p-4 sm:p-5 text-center">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Amount</p>
        <p className="text-2xl sm:text-3xl font-heading font-bold text-success-600">
          {currency} {amount}
        </p>
      </div>

      <PaymentElement />

      {error && (
        <div className="border border-danger-600/30 bg-danger-600/10 rounded-lg px-4 py-3">
          <p className="text-danger-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          onClick={onCancel}
          disabled={processing}
        />
        <Button
          label={processing ? 'Processing...' : 'Pay Now'}
          icon={processing
            ? <Loader2 size={16} strokeWidth={2} className="animate-spin" />
            : <CreditCard size={16} strokeWidth={2} />}
          onClick={handleSubmit}
          disabled={!stripe || processing}
        />
      </div>
    </div>
  );
}

interface PaymentDialogProps {
  visible: boolean;
  onHide: () => void;
  clientSecret: string;
  amount: string;
  currency: string;
  onSuccess: () => void;
}

export function PaymentDialog({ visible, onHide, clientSecret, amount, currency, onSuccess }: PaymentDialogProps) {
  if (!clientSecret) return null;

  return (
    <Dialog
      header="Complete Payment"
      visible={visible}
      onHide={onHide}
      style={{ width: '480px' }}
      breakpoints={{ '640px': '95vw' }}
      modal
      closable={false}
      draggable={false}
    >
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#db2777',
              colorBackground: '#ffffff',
              colorText: '#0f172a',
              colorDanger: '#e11d48',
              borderRadius: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
          },
        }}
      >
        <PaymentForm
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onCancel={onHide}
        />
      </Elements>
    </Dialog>
  );
}
