'use client';

import Link from 'next/link';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useState } from 'react';
import { useInboundFunding } from '@/hooks/useFinanceAdmin';
import { financeAdminApi } from '@/lib/api/finance-admin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/hooks/useToast';
import { formatCents, formatDateTime } from '@/lib/utils/format';
import { csvFilename, saveBlob } from '@/lib/utils/download';
import { Download, RefreshCw } from 'lucide-react';

const STATUS_SEVERITY: Record<string, 'success' | 'warning' | 'danger' | 'info' | undefined> = {
  CREATED: 'info',
  INITIATED: 'info',
  CAPTURED: 'warning',
  SETTLED: 'success',
  FAILED: 'danger',
  EXPIRED: 'danger',
  REFUNDED: 'warning',
};

export default function InboundFundingPage() {
  const { data, isLoading, error, refetch } = useInboundFunding(100);
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await financeAdminApi.downloadExport('inbound');
      saveBlob(blob, csvFilename('inbound'));
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'Could not download CSV.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Inbound funding"
        subtitle="Brand bounty funding via Stitch hosted checkout"
        actions={
          <div className="flex gap-2">
            <Button
              label="Download CSV"
              icon={<Download size={16} strokeWidth={2} />}
              outlined
              loading={downloading}
              onClick={handleDownload}
            />
            <Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />
          </div>
        }
      />
      <Card>
        <DataTable value={data ?? []} size="small" stripedRows paginator rows={20}>
          <Column
            field="bountyId"
            header="Bounty"
            body={(r) => (
              <Link className="text-primary underline" href={`/admin/bounties/${r.bountyId}`}>
                {r.bounty?.title || r.bountyId.slice(0, 8)}
              </Link>
            )}
          />
          <Column
            field="status"
            header="Status"
            body={(r) => <Tag value={r.status} severity={STATUS_SEVERITY[r.status] ?? null} />}
          />
          <Column
            field="amountCents"
            header="Amount"
            body={(r) => <span className="font-mono tabular-nums">{formatCents(r.amountCents, r.currency)}</span>}
          />
          <Column
            field="merchantReference"
            header="merchantReference"
            body={(r) => <span className="font-mono tabular-nums text-xs">{r.merchantReference}</span>}
          />
          <Column
            field="stitchPaymentId"
            header="Stitch payment id"
            body={(r) => (
              <span className="font-mono text-xs">{r.stitchPaymentId ?? '—'}</span>
            )}
          />
          <Column field="createdAt" header="Created" body={(r) => <span className="font-mono tabular-nums">{formatDateTime(r.createdAt)}</span>} />
        </DataTable>
      </Card>
    </>
  );
}
