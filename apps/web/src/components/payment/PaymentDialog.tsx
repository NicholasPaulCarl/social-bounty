'use client';

import { useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
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
    <div className="space-y-5">
      <div className="bg-surface-container rounded-2xl p-6 text-center">
        <p className="text-sm text-on-surface-variant">Total Amount</p>
        <p className="text-3xl font-bold text-on-surface font-headline">{currency} {amount}</p>
      </div>

      <PaymentElement />

      {error && (
        <div className="bg-error-container p-4 rounded-2xl flex items-center space-x-3">
          <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-sm text-error">{error}</p>
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
          icon={processing ? 'pi pi-spin pi-spinner' : 'pi pi-credit-card'}
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
      modal
      closable={false}
      draggable={false}
    >
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: 'stripe' },
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
