'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import {
  useFinanceOverview,
  useToggleKillSwitch,
  useRunReconciliation,
} from '@/hooks/useFinanceAdmin';
import { financeAdminApi } from '@/lib/api/finance-admin';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCents, formatDateTime } from '@/lib/utils/format';
import { csvFilename, saveBlob } from '@/lib/utils/download';

export default function FinanceOverviewPage() {
  const toast = useToast();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useFinanceOverview();
  const toggle = useToggleKillSwitch();
  const recon = useRunReconciliation();
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [killReason, setKillReason] = useState('');
  const [reconResult, setReconResult] = useState<{ findings: number; killActivated: boolean } | null>(null);
  const [downloadingLedger, setDownloadingLedger] = useState(false);

  const handleDownloadLedger = async () => {
    setDownloadingLedger(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const blob = await financeAdminApi.downloadExport('ledger', { since: sevenDaysAgo });
      saveBlob(blob, csvFilename('ledger'));
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'Could not download CSV.');
    } finally {
      setDownloadingLedger(false);
    }
  };

  if (isLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;
  if (!data) return null;

  const ksActive = data.killSwitchActive;

  const onToggleKill = async () => {
    if (killReason.trim().length < 10) {
      toast.showError('Reason must be at least 10 characters.');
      return;
    }
    try {
      await toggle.mutateAsync({ active: !ksActive, reason: killReason.trim() });
      toast.showSuccess(ksActive ? 'Kill Switch deactivated.' : 'Kill Switch ACTIVATED.');
      setKillDialogOpen(false);
      setKillReason('');
      refetch();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : "Couldn't toggle Kill Switch.");
    }
  };

  const onRunRecon = async () => {
    try {
      const r = await recon.mutateAsync();
      setReconResult({ findings: r.findings.length, killActivated: r.killSwitchActivated });
      toast.showSuccess(
        r.findings.length === 0
          ? 'Reconciliation green — no findings.'
          : `Reconciliation found ${r.findings.length} issue(s).`,
      );
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : "Reconciliation run failed.");
    }
  };

  return (
    <>
      <PageHeader
        title="Finance Overview"
        subtitle="Live ledger balances, exceptions, and Kill Switch control"
        actions={
          <div className="flex gap-2">
            <Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />
            <Button
              label="Run reconciliation"
              icon="pi pi-search"
              outlined
              loading={recon.isPending}
              onClick={onRunRecon}
            />
            <Button
              label="Download ledger CSV"
              icon="pi pi-download"
              outlined
              loading={downloadingLedger}
              onClick={handleDownloadLedger}
            />
          </div>
        }
      />

      {ksActive && (
        <Message
          severity="error"
          className="w-full mb-4"
          text="Financial Kill Switch is ACTIVE. All non-compensating ledger writes are blocked."
        />
      )}

      {reconResult && (
        <Message
          severity={reconResult.findings === 0 ? 'success' : 'warn'}
          className="w-full mb-4"
          text={`Reconciliation: ${reconResult.findings} finding(s)${reconResult.killActivated ? ' — Kill Switch auto-activated' : ''}`}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Kill Switch">
          <div className="flex items-center gap-2 mb-2">
            <Tag value={ksActive ? 'ACTIVE' : 'off'} severity={ksActive ? 'danger' : 'success'} />
          </div>
          <Button
            label={ksActive ? 'Deactivate Kill Switch' : 'ACTIVATE Kill Switch'}
            severity={ksActive ? 'success' : 'danger'}
            size="small"
            onClick={() => setKillDialogOpen(true)}
          />
        </Card>

        <Card title="Open Exceptions">
          <div className="text-3xl font-semibold">{data.openExceptions}</div>
          <p className="text-sm text-text-muted mt-1">RecurringIssue rows not yet resolved.</p>
        </Card>

        <Card title="Recent groups">
          <div className="text-3xl font-semibold">{data.recentGroups.length}</div>
          <p className="text-sm text-text-muted mt-1">Latest 20 ledger transaction groups.</p>
        </Card>
      </div>

      <Card title="Balances by account" className="mb-6">
        <DataTable
          value={Object.entries(data.balancesByAccount).map(([account, cents]) => ({ account, cents }))}
          size="small"
        >
          <Column field="account" header="Account" />
          <Column
            field="cents"
            header="Balance"
            body={(r: { cents: string }) => <span className="font-mono">{formatCents(r.cents)}</span>}
          />
        </DataTable>
      </Card>

      <Card title="Recent transaction groups">
        <DataTable
          value={data.recentGroups}
          size="small"
          className="cursor-pointer"
          onRowClick={(e) => router.push(`/admin/finance/groups/${(e.data as { id: string }).id}`)}
        >
          <Column field="actionType" header="Action" />
          <Column field="referenceId" header="Reference" body={(r) => <span className="font-mono text-xs">{r.referenceId}</span>} />
          <Column field="description" header="Description" />
          <Column
            field="totalCents"
            header="Total"
            body={(r: { totalCents: string }) => <span className="font-mono">{formatCents(r.totalCents)}</span>}
          />
          <Column field="createdAt" header="When" body={(r) => formatDateTime(r.createdAt)} />
        </DataTable>
      </Card>

      <Dialog
        header={ksActive ? 'Deactivate Kill Switch' : 'Activate Kill Switch'}
        visible={killDialogOpen}
        onHide={() => setKillDialogOpen(false)}
        style={{ width: '480px' }}
      >
        <p className="text-sm text-text-muted mb-3">
          {ksActive
            ? 'Deactivating will allow ledger writes to resume. Provide a reason for the audit log.'
            : 'Activating will block all non-compensating ledger writes platform-wide. Provide a reason for the audit log.'}
        </p>
        <InputTextarea
          value={killReason}
          onChange={(e) => setKillReason(e.target.value)}
          rows={4}
          className="w-full"
          placeholder="Reason (min 10 chars)"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button label="Cancel" outlined onClick={() => setKillDialogOpen(false)} />
          <Button
            label={ksActive ? 'Deactivate' : 'ACTIVATE'}
            severity={ksActive ? 'success' : 'danger'}
            loading={toggle.isPending}
            onClick={onToggleKill}
          />
        </div>
      </Dialog>
    </>
  );
}
