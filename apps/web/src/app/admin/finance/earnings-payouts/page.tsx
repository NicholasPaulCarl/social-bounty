'use client';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useEarningsPayouts } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatCents } from '@/lib/utils/format';
import { RefreshCw } from 'lucide-react';

const ACCOUNT_LABELS: Record<string, string> = {
  hunter_pending: 'Pending (gross, awaiting split)',
  hunter_net_payable: 'Net payable (in clearance)',
  hunter_clearing: 'Clearing (held / clawback)',
  hunter_available: 'Available (eligible for payout)',
  payout_in_transit: 'In transit (sent to TradeSafe)',
  hunter_paid: 'Paid (settled to bank)',
};

const ACCOUNT_ORDER = [
  'hunter_pending',
  'hunter_net_payable',
  'hunter_clearing',
  'hunter_available',
  'payout_in_transit',
  'hunter_paid',
];

export default function EarningsPayoutsPage() {
  const { data, isLoading, error, refetch } = useEarningsPayouts();
  if (isLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const rows = ACCOUNT_ORDER.map((account) => ({
    account,
    label: ACCOUNT_LABELS[account] ?? account,
    cents: (data ?? {})[account] ?? '0',
  }));

  return (
    <>
      <PageHeader
        title="Earnings & payouts"
        subtitle="Hunter-side ledger totals across the payout pipeline"
        actions={<Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />}
      />
      <Card>
        <DataTable value={rows} size="small">
          <Column field="account" header="Account" body={(r) => <span className="font-mono tabular-nums">{r.account}</span>} />
          <Column field="label" header="What it means" />
          <Column
            field="cents"
            header="Total"
            body={(r) => <span className="font-mono tabular-nums">{formatCents(r.cents)}</span>}
          />
        </DataTable>
      </Card>
    </>
  );
}
