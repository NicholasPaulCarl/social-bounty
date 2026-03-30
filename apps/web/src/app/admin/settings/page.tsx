'use client';

import { useState, useEffect } from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAdminSettings, useUpdateSettings } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDateTime } from '@/lib/utils/format';

export default function AdminSettingsPage() {
  const toast = useToast();
  const { data: settings, isLoading, error, refetch } = useAdminSettings();
  const updateSettings = useUpdateSettings();

  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [submissionsEnabled, setSubmissionsEnabled] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (settings) {
      setSignupsEnabled(settings.signupsEnabled);
      setSubmissionsEnabled(settings.submissionsEnabled);
    }
  }, [settings]);

  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const handleSave = () => {
    setFormError('');
    updateSettings.mutate(
      { signupsEnabled, submissionsEnabled },
      {
        onSuccess: () => {
          toast.showSuccess('Settings updated successfully');
          refetch();
        },
        onError: () => setFormError('Failed to update settings'),
      },
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Platform Settings" subtitle="Configure platform-wide settings" />

      <div className="max-w-2xl space-y-6">
        {formError && <Message severity="error" text={formError} className="w-full" />}

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Feature Toggles</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">User Signups</p>
                <p className="text-sm text-text-muted">Allow new users to create accounts.</p>
              </div>
              <InputSwitch checked={signupsEnabled} onChange={(e) => setSignupsEnabled(e.value ?? false)} />
            </div>

            <div className="flex items-center justify-between border-t border-glass-border pt-6">
              <div>
                <p className="font-medium text-text-primary">Submissions</p>
                <p className="text-sm text-text-muted">Allow participants to submit proof for bounties.</p>
              </div>
              <InputSwitch checked={submissionsEnabled} onChange={(e) => setSubmissionsEnabled(e.value ?? false)} />
            </div>
          </div>
        </div>

        {settings && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Last Updated</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-text-muted">Timestamp</dt>
                <dd className="text-sm font-medium text-text-secondary mt-0.5">{formatDateTime(settings.updatedAt)}</dd>
              </div>
              {settings.updatedBy && (
                <div className="border-t border-glass-border pt-3">
                  <dt className="text-sm text-text-muted">Updated By</dt>
                  <dd className="text-sm font-medium text-text-secondary mt-0.5">{settings.updatedBy.email}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            label="Save Settings"
            icon="pi pi-save"
            onClick={handleSave}
            loading={updateSettings.isPending}
          />
        </div>
      </div>
    </div>
  );
}
