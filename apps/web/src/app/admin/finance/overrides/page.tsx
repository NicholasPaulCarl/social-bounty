'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { usePostOverride } from '@/hooks/useFinanceAdmin';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Trash2, Plus, Send } from 'lucide-react';
import type { OverrideLeg } from '@social-bounty/shared';

const ACCOUNTS = [
  'brand_cash_received',
  'brand_reserve',
  'brand_refundable',
  'hunter_pending',
  'hunter_clearing',
  'hunter_available',
  'hunter_paid',
  'hunter_net_payable',
  'commission_revenue',
  'admin_fee_revenue',
  'global_fee_revenue',
  'processing_expense',
  'payout_fee_recovery',
  'bank_charges',
  'gateway_clearing',
  'payout_in_transit',
].map((a) => ({ label: a, value: a }));

const TYPES = [
  { label: 'DEBIT', value: 'DEBIT' },
  { label: 'CREDIT', value: 'CREDIT' },
];

const emptyLeg = (): OverrideLeg => ({ account: '', type: 'DEBIT', amountCents: '' });

export default function FinanceOverridesPage() {
  const toast = useToast();
  const post = usePostOverride();

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [legs, setLegs] = useState<OverrideLeg[]>([emptyLeg(), emptyLeg()]);
  const [confirmText, setConfirmText] = useState('');

  const updateLeg = (i: number, patch: Partial<OverrideLeg>) =>
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const debitSum = legs
    .filter((l) => l.type === 'DEBIT' && l.amountCents)
    .reduce((s, l) => s + BigInt(l.amountCents || '0'), 0n);
  const creditSum = legs
    .filter((l) => l.type === 'CREDIT' && l.amountCents)
    .reduce((s, l) => s + BigInt(l.amountCents || '0'), 0n);
  const balanced = debitSum === creditSum && debitSum > 0n;
  const valid =
    balanced &&
    reason.trim().length >= 10 &&
    description.trim().length >= 10 &&
    legs.every((l) => l.account && l.amountCents && /^\d+$/.test(l.amountCents)) &&
    confirmText === 'OVERRIDE';

  const onSubmit = async () => {
    if (!valid) return;
    try {
      const result = await post.mutateAsync({ reason: reason.trim(), description: description.trim(), legs });
      toast.showSuccess(`Override posted as group ${result.transactionGroupId.slice(0, 8)}…`);
      setReason('');
      setDescription('');
      setLegs([emptyLeg(), emptyLeg()]);
      setConfirmText('');
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : "Couldn't post override.");
    }
  };

  return (
    <>
      <PageHeader
        title="Manual override"
        subtitle="Compensating ledger entries — bypasses Kill Switch by design"
      />
      <Message
        severity="warn"
        className="w-full mb-4"
        text="Overrides write append-only compensating entries to the ledger. They run even when the Kill Switch is active. Every entry is audited; both debits and credits must balance."
      />

      <Card title="New override" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium block mb-1">Reason (audit log)</label>
            <InputText
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full"
              placeholder="Min 10 chars — e.g. KB-2026-04-15-001 reconciliation correction"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Description (group label)</label>
            <InputText
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
              placeholder="Min 10 chars — short label visible on the ledger"
            />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {legs.map((leg, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <label className="text-xs font-medium block mb-1">Account</label>
                <Dropdown
                  value={leg.account}
                  options={ACCOUNTS}
                  onChange={(e) => updateLeg(i, { account: e.value })}
                  className="w-full"
                  placeholder="Select account"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1">Type</label>
                <Dropdown
                  value={leg.type}
                  options={TYPES}
                  onChange={(e) => updateLeg(i, { type: e.value })}
                  className="w-full"
                />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium block mb-1">Amount (cents)</label>
                <InputText
                  value={leg.amountCents}
                  onChange={(e) =>
                    updateLeg(i, { amountCents: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full"
                  placeholder="Integer cents"
                />
              </div>
              <div className="col-span-2">
                <Button
                  icon={<Trash2 size={14} strokeWidth={2} />}
                  outlined
                  severity="danger"
                  size="small"
                  disabled={legs.length <= 2}
                  onClick={() => setLegs((prev) => prev.filter((_, idx) => idx !== i))}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          label="Add leg"
          icon={<Plus size={14} strokeWidth={2} />}
          outlined
          size="small"
          onClick={() => setLegs((prev) => [...prev, emptyLeg()])}
        />

        <div className="mt-4 p-3 rounded bg-surface-subtle text-sm font-mono tabular-nums">
          DEBIT total: {debitSum.toString()} cents<br />
          CREDIT total: {creditSum.toString()} cents<br />
          {balanced ? (
            <span className="text-success-600">Balanced</span>
          ) : (
            <span className="text-danger-600">Unbalanced — debits must equal credits, both &gt; 0</span>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium block mb-1">
            Type the word <strong>OVERRIDE</strong> to confirm
          </label>
          <InputText
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full md:w-64"
            placeholder="OVERRIDE"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            label="Post override"
            icon={<Send size={16} strokeWidth={2} />}
            severity="warning"
            disabled={!valid}
            loading={post.isPending}
            onClick={onSubmit}
          />
        </div>
      </Card>
    </>
  );
}
