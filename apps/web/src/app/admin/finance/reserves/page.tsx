'use client';

import Link from 'next/link';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useReserves } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatCents } from '@/lib/utils/format';

export default function ReservesPage() {
  const { data, isLoading, error, refetch } = useReserves();
  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const drifted = (data ?? []).filter((r) => r.drift);

  return (
    <>
      <PageHeader
        title="Brand reserves"
        subtitle="Per-bounty brand_reserve balance vs face value"
        actions={<Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />}
      />
      {drifted.length > 0 && (
        <Message
          severity="warn"
          className="w-full mb-4"
          text={`${drifted.length} bounty/bounties have reserve drift (balance ≠ face value and ≠ 0).`}
        />
      )}
      <Card>
        <DataTable
          value={data ?? []}
          size="small"
          stripedRows
          paginator
          rows={25}
          rowClassName={(r) => (r.drift ? 'bg-yellow-50' : '')}
        >
          <Column
            field="bountyId"
            header="Bounty"
            body={(r) => (
              <Link href={`/admin/bounties/${r.bountyId}`} className="text-primary underline">
                {r.title}
              </Link>
            )}
          />
          <Column
            field="paymentStatus"
            header="Payment"
            body={(r) => <Tag value={r.paymentStatus} />}
          />
          <Column
            field="faceValueCents"
            header="Face value"
            body={(r) => <span className="font-mono">{formatCents(r.faceValueCents)}</span>}
          />
          <Column
            field="reserveBalanceCents"
            header="Reserve balance"
            body={(r) => (
              <span className="font-mono">{formatCents(r.reserveBalanceCents)}</span>
            )}
          />
          <Column
            field="drift"
            header="Drift"
            body={(r) =>
              r.drift ? (
                <Tag value="DRIFT" severity="warning" />
              ) : (
                <Tag value="ok" severity="success" />
              )
            }
          />
        </DataTable>
      </Card>
    </>
  );
}
