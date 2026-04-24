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
import { RefreshCw } from 'lucide-react';

export default function AdminPaymentsHealthPage() {
  const { data, isLoading, error, refetch } = usePaymentsHealth();

  if (isLoading) return <LoadingState type="cards-grid" cards={4} />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;
  if (!data) return null;

  // Agent 1B renames the legacy shared DTO fields to neutral names.
  // Cast bridges the handoff window within Wave 1.
  const health = data as unknown as {
    paymentsProvider: string;
    tokenProbe: { ok: boolean; latencyMs: number; error?: string };
    killSwitch: { active: boolean; reason?: string };
    lastWebhook: {
      eventType: string;
      receivedAt: string;
      status: string;
      externalEventId: string;
    } | null;
    credsHashes: { clientId: string; clientSecret: string; webhookSecret: string };
  };

  const providerSeverity =
    health.paymentsProvider === 'tradesafe_live'
      ? 'success'
      : health.paymentsProvider === 'tradesafe_sandbox'
        ? 'warning'
        : 'danger';

  const probeSeverity = health.tokenProbe.ok ? 'success' : 'danger';
  const killSwitchSeverity = health.killSwitch.active ? 'danger' : 'success';

  return (
    <>
      <PageHeader
        title="Payments health"
        subtitle="TradeSafe connectivity, webhook status, and kill switch"
        actions={
          <Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />
        }
      />

      {health.killSwitch.active ? (
        <Message
          severity="error"
          className="w-full mb-4"
          text={`Financial Kill Switch is ACTIVE${health.killSwitch.reason ? ` — ${health.killSwitch.reason}` : ''}. All outbound payouts are halted.`}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card title="Provider">
          <div className="flex items-center gap-2">
            <Tag value={health.paymentsProvider} severity={providerSeverity} />
          </div>
          <p className="text-sm text-text-muted mt-2">
            PAYMENTS_PROVIDER env flag. `tradesafe_live` is production.
          </p>
        </Card>

        <Card title="TradeSafe Token Probe">
          <div className="flex items-center gap-2">
            <Tag
              value={health.tokenProbe.ok ? 'OK' : 'FAIL'}
              severity={probeSeverity}
            />
            <span className="text-sm text-text-muted">
              {health.tokenProbe.latencyMs}ms
            </span>
          </div>
          {health.tokenProbe.error ? (
            <p className="text-sm text-red-600 mt-2">{health.tokenProbe.error}</p>
          ) : null}
        </Card>

        <Card title="Financial Kill Switch">
          <div className="flex items-center gap-2">
            <Tag
              value={health.killSwitch.active ? 'ACTIVE' : 'off'}
              severity={killSwitchSeverity}
            />
          </div>
          {health.killSwitch.reason ? (
            <p className="text-sm text-text-muted mt-2">{health.killSwitch.reason}</p>
          ) : null}
        </Card>
      </div>

      <Card title="Last TradeSafe Webhook" className="mb-6">
        {health.lastWebhook ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-text-muted">Event type</div>
              <div className="font-mono tabular-nums">{health.lastWebhook.eventType}</div>
            </div>
            <div>
              <div className="text-text-muted">Received</div>
              <div className="font-mono tabular-nums">{formatDateTime(health.lastWebhook.receivedAt)}</div>
            </div>
            <div>
              <div className="text-text-muted">Status</div>
              <Tag value={health.lastWebhook.status} />
            </div>
            <div>
              <div className="text-text-muted">Svix ID</div>
              <div className="font-mono text-xs break-all">{health.lastWebhook.externalEventId}</div>
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
            <div className="text-text-muted">TRADESAFE_CLIENT_ID</div>
            <div className="font-mono tabular-nums">{health.credsHashes.clientId}</div>
          </div>
          <div>
            <div className="text-text-muted">TRADESAFE_CLIENT_SECRET</div>
            <div className="font-mono tabular-nums">{health.credsHashes.clientSecret}</div>
          </div>
          <div>
            <div className="text-text-muted">TRADESAFE_WEBHOOK_SECRET</div>
            <div className="font-mono tabular-nums">{health.credsHashes.webhookSecret}</div>
          </div>
        </div>
      </Card>
    </>
  );
}
