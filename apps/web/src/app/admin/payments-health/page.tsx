'use client';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { usePaymentsHealth } from '@/hooks/useAdmin';
import { formatDateTime } from '@/lib/utils/format';

export default function AdminPaymentsHealthPage() {
  const { data, isLoading, error, refetch } = usePaymentsHealth();

  if (isLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;
  if (!data) return null;

  const providerSeverity =
    data.paymentsProvider === 'stitch_live'
      ? 'success'
      : data.paymentsProvider === 'stitch_sandbox'
        ? 'warning'
        : 'danger';

  const probeSeverity = data.stitchTokenProbe.ok ? 'success' : 'danger';
  const killSwitchSeverity = data.killSwitch.active ? 'danger' : 'success';

  return (
    <>
      <PageHeader
        title="Payments Health"
        subtitle="Stitch Express connectivity, webhook status, and kill switch"
        actions={
          <Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />
        }
      />

      {data.killSwitch.active ? (
        <Message
          severity="error"
          className="w-full mb-4"
          text={`Financial Kill Switch is ACTIVE${data.killSwitch.reason ? ` — ${data.killSwitch.reason}` : ''}. All outbound payouts are halted.`}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card title="Provider">
          <div className="flex items-center gap-2">
            <Tag value={data.paymentsProvider} severity={providerSeverity} />
          </div>
          <p className="text-sm text-text-muted mt-2">
            PAYMENTS_PROVIDER env flag. `stitch_live` is production.
          </p>
        </Card>

        <Card title="Stitch Token Probe">
          <div className="flex items-center gap-2">
            <Tag
              value={data.stitchTokenProbe.ok ? 'OK' : 'FAIL'}
              severity={probeSeverity}
            />
            <span className="text-sm text-text-muted">
              {data.stitchTokenProbe.latencyMs}ms
            </span>
          </div>
          {data.stitchTokenProbe.error ? (
            <p className="text-sm text-red-600 mt-2">{data.stitchTokenProbe.error}</p>
          ) : null}
        </Card>

        <Card title="Financial Kill Switch">
          <div className="flex items-center gap-2">
            <Tag
              value={data.killSwitch.active ? 'ACTIVE' : 'off'}
              severity={killSwitchSeverity}
            />
          </div>
          {data.killSwitch.reason ? (
            <p className="text-sm text-text-muted mt-2">{data.killSwitch.reason}</p>
          ) : null}
        </Card>
      </div>

      <Card title="Last Stitch Webhook" className="mb-6">
        {data.lastWebhook ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-text-muted">Event type</div>
              <div className="font-mono">{data.lastWebhook.eventType}</div>
            </div>
            <div>
              <div className="text-text-muted">Received</div>
              <div>{formatDateTime(data.lastWebhook.receivedAt)}</div>
            </div>
            <div>
              <div className="text-text-muted">Status</div>
              <Tag value={data.lastWebhook.status} />
            </div>
            <div>
              <div className="text-text-muted">Svix ID</div>
              <div className="font-mono text-xs break-all">{data.lastWebhook.externalEventId}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No webhook events received yet.</p>
        )}
      </Card>

      <Card title="Config Fingerprints">
        <p className="text-sm text-text-muted mb-3">
          First 12 chars of SHA-256 of each secret. Mismatches across environments are a config-drift red flag.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-text-muted">STITCH_CLIENT_ID</div>
            <div className="font-mono">{data.credsHashes.clientId}</div>
          </div>
          <div>
            <div className="text-text-muted">STITCH_CLIENT_SECRET</div>
            <div className="font-mono">{data.credsHashes.clientSecret}</div>
          </div>
          <div>
            <div className="text-text-muted">STITCH_WEBHOOK_SECRET</div>
            <div className="font-mono">{data.credsHashes.webhookSecret}</div>
          </div>
        </div>
      </Card>
    </>
  );
}
