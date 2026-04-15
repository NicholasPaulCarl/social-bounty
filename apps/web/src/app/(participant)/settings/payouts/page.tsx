'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useToast } from '@/hooks/useToast';
import { payoutsApi } from '@/lib/api/payouts';
import { PageHeader } from '@/components/common/PageHeader';

// Banks supported by Stitch Express in South Africa.
// Source: .claude/skills/DevStitchPayments/SKILL.md
const SA_BANKS = [
  { label: 'ABSA', value: 'ABSA' },
  { label: 'Capitec', value: 'CAPITEC' },
  { label: 'FNB', value: 'FNB' },
  { label: 'Nedbank', value: 'NEDBANK' },
  { label: 'Standard Bank', value: 'STANDARD_BANK' },
  { label: 'TymeBank', value: 'TYMEBANK' },
  { label: 'Investec', value: 'INVESTEC' },
  { label: 'African Bank', value: 'AFRICAN_BANK' },
  { label: 'Mercantile', value: 'MERCANTILE' },
  { label: 'Access Bank', value: 'ACCESS_BANK' },
  { label: 'Discovery Bank', value: 'DISCOVERY_BANK' },
  { label: 'Bank Zero', value: 'BANK_ZERO' },
  { label: 'Bidvest', value: 'BIDVEST' },
  { label: 'Sasfin', value: 'SASFIN' },
  { label: 'Al Baraka Bank', value: 'AL_BARAKA_BANK' },
];

const ACCOUNT_TYPES = [
  { label: 'Cheque / Current', value: 'CURRENT' },
  { label: 'Savings', value: 'SAVINGS' },
];

export default function ParticipantPayoutsPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    accountHolderName: '',
    bankCode: '',
    accountNumber: '',
    accountType: 'CURRENT',
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const valid =
    form.accountHolderName.trim().length >= 2 &&
    form.bankCode &&
    /^\d{6,20}$/.test(form.accountNumber) &&
    form.accountType;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    try {
      await payoutsApi.upsertMyBeneficiary({
        accountHolderName: form.accountHolderName.trim(),
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
        accountType: form.accountType,
      });
      setSaved(true);
      toast.showSuccess('Banking details saved. Payouts will begin once you have cleared earnings.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Couldn\'t save banking details. Try again.';
      toast.showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Payout banking"
        subtitle="Where we send your cleared earnings"
      />

      <Card>
        <p className="text-sm text-text-muted mb-4">
          We send your cleared hunter earnings to this account via Stitch Express. Free hunters
          clear 72 hours after a business approves a submission; Pro hunters clear immediately.
          Your account number is encrypted at rest.
        </p>

        {saved && (
          <Message
            severity="success"
            className="w-full mb-4"
            text="Banking details saved. The next payout run will pick you up automatically."
          />
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="accountHolderName" className="text-sm font-medium">
              Account holder name
            </label>
            <InputText
              id="accountHolderName"
              value={form.accountHolderName}
              maxLength={200}
              onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="bankCode" className="text-sm font-medium">Bank</label>
            <Dropdown
              inputId="bankCode"
              value={form.bankCode}
              options={SA_BANKS}
              placeholder="Select a bank"
              onChange={(e) => setForm({ ...form, bankCode: e.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="accountNumber" className="text-sm font-medium">Account number</label>
            <InputText
              id="accountNumber"
              value={form.accountNumber}
              inputMode="numeric"
              placeholder="6–20 digits"
              onChange={(e) =>
                setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 20) })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="accountType" className="text-sm font-medium">Account type</label>
            <Dropdown
              inputId="accountType"
              value={form.accountType}
              options={ACCOUNT_TYPES}
              onChange={(e) => setForm({ ...form, accountType: e.value })}
            />
          </div>

          <div className="md:col-span-2 flex justify-end mt-2">
            <Button
              type="submit"
              label="Save banking details"
              icon="pi pi-check"
              disabled={!valid}
              loading={submitting}
            />
          </div>
        </form>
      </Card>
    </>
  );
}
