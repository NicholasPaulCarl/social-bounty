'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { useWalletDashboard, useRequestWithdrawal } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency } from '@/lib/utils/format';
import { PayoutMethod } from '@social-bounty/shared';
import type { RequestWithdrawalRequest } from '@social-bounty/shared';

const METHOD_OPTIONS = [
  { label: 'PayPal', value: PayoutMethod.PAYPAL },
  { label: 'Bank Transfer', value: PayoutMethod.BANK_TRANSFER },
  { label: 'E-Wallet', value: PayoutMethod.E_WALLET },
];

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50_000;

export default function WithdrawPage() {
  const router = useRouter();
  const { data: dashboard, isLoading, error, refetch } = useWalletDashboard();
  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawal();

  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [destination, setDestination] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) return <LoadingState type="page" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const available = dashboard ? parseFloat(dashboard.balance.available) : 0;
  const currency = dashboard?.balance.currency ?? 'ZAR';

  const handleDestChange = (key: string, val: string) => {
    setDestination((prev) => ({ ...prev, [key]: val }));
  };

  function validateDestination(): boolean {
    if (!method) return false;
    if (method === PayoutMethod.PAYPAL) return !!destination.email?.trim();
    if (method === PayoutMethod.BANK_TRANSFER) {
      return !!(destination.bankName?.trim() && destination.accountNumber?.trim() && destination.branchCode?.trim() && destination.holderName?.trim());
    }
    if (method === PayoutMethod.E_WALLET) return !!destination.walletId?.trim();
    return false;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitted(true);

    if (!amount) { setFormError('Please enter an amount.'); return; }
    if (amount < MIN_AMOUNT) { setFormError(`Minimum withdrawal is ${formatCurrency(MIN_AMOUNT, currency)}.`); return; }
    if (amount > MAX_AMOUNT) { setFormError(`Maximum withdrawal is ${formatCurrency(MAX_AMOUNT, currency)}.`); return; }
    if (amount > available) { setFormError(`Insufficient balance. Available: ${formatCurrency(available, currency)}.`); return; }
    if (!method) { setFormError('Please select a withdrawal method.'); return; }
    if (!validateDestination()) { setFormError('Please fill in all required destination fields.'); return; }

    const payload: RequestWithdrawalRequest = { amount, method, destination };
    requestWithdrawal(payload, {
      onSuccess: () => router.push('/wallet'),
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to submit withdrawal request.';
        setFormError(message);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Request Withdrawal"
        subtitle="Transfer your earnings to your preferred payment method"
        breadcrumbs={[{ label: 'Wallet', url: '/wallet' }, { label: 'Withdraw' }]}
      />

      <div className="max-w-xl animate-fade-up">
        <div className="glass-card p-6">
          {/* Available balance hint */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-accent-emerald/5 border border-accent-emerald/20 mb-6">
            <span className="text-sm text-text-muted">Available to withdraw</span>
            <span className="text-lg font-bold text-accent-emerald">{formatCurrency(available, currency)}</span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Amount <span className="text-accent-rose">*</span>
              </label>
              <InputNumber
                value={amount}
                onValueChange={(e) => setAmount(e.value ?? null)}
                mode="currency"
                currency={currency}
                locale="en-ZA"
                min={MIN_AMOUNT}
                max={Math.min(MAX_AMOUNT, available)}
                className="w-full"
                placeholder={`Min ${formatCurrency(MIN_AMOUNT, currency)}`}
                invalid={submitted && (!amount || amount < MIN_AMOUNT || amount > available)}
              />
              <p className="text-xs text-text-muted">
                Min: {formatCurrency(MIN_AMOUNT, currency)} · Max: {formatCurrency(Math.min(MAX_AMOUNT, available), currency)}
              </p>
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Withdrawal Method <span className="text-accent-rose">*</span>
              </label>
              <Dropdown
                value={method}
                options={METHOD_OPTIONS}
                onChange={(e) => { setMethod(e.value); setDestination({}); }}
                placeholder="Select method"
                className="w-full"
                invalid={submitted && !method}
              />
            </div>

            {/* Dynamic destination fields */}
            {method === PayoutMethod.PAYPAL && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  PayPal Email <span className="text-accent-rose">*</span>
                </label>
                <InputText
                  value={destination.email ?? ''}
                  onChange={(e) => handleDestChange('email', e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full"
                  invalid={submitted && !destination.email?.trim()}
                />
              </div>
            )}

            {method === PayoutMethod.BANK_TRANSFER && (
              <div className="space-y-4 p-4 rounded-lg bg-elevated/30 border border-glass-border">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Bank Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">
                      Bank Name <span className="text-accent-rose">*</span>
                    </label>
                    <InputText
                      value={destination.bankName ?? ''}
                      onChange={(e) => handleDestChange('bankName', e.target.value)}
                      placeholder="e.g. FNB"
                      className="w-full"
                      invalid={submitted && !destination.bankName?.trim()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">
                      Branch Code <span className="text-accent-rose">*</span>
                    </label>
                    <InputText
                      value={destination.branchCode ?? ''}
                      onChange={(e) => handleDestChange('branchCode', e.target.value)}
                      placeholder="e.g. 250655"
                      className="w-full"
                      invalid={submitted && !destination.branchCode?.trim()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">
                      Account Number <span className="text-accent-rose">*</span>
                    </label>
                    <InputText
                      value={destination.accountNumber ?? ''}
                      onChange={(e) => handleDestChange('accountNumber', e.target.value)}
                      placeholder="Account number"
                      className="w-full"
                      invalid={submitted && !destination.accountNumber?.trim()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary">
                      Account Holder Name <span className="text-accent-rose">*</span>
                    </label>
                    <InputText
                      value={destination.holderName ?? ''}
                      onChange={(e) => handleDestChange('holderName', e.target.value)}
                      placeholder="Full name"
                      className="w-full"
                      invalid={submitted && !destination.holderName?.trim()}
                    />
                  </div>
                </div>
              </div>
            )}

            {method === PayoutMethod.E_WALLET && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Wallet ID / Phone Number <span className="text-accent-rose">*</span>
                </label>
                <InputText
                  value={destination.walletId ?? ''}
                  onChange={(e) => handleDestChange('walletId', e.target.value)}
                  placeholder="e.g. +27 82 000 0000"
                  className="w-full"
                  invalid={submitted && !destination.walletId?.trim()}
                />
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-sm">
                <i className="pi pi-exclamation-triangle mr-2" />
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                label="Cancel"
                outlined
                className="flex-1"
                onClick={() => router.push('/wallet')}
                disabled={isPending}
              />
              <Button
                type="submit"
                label="Submit Request"
                icon="pi pi-send"
                className="flex-1 bg-accent-emerald border-accent-emerald text-background hover:bg-accent-emerald/90"
                loading={isPending}
              />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
