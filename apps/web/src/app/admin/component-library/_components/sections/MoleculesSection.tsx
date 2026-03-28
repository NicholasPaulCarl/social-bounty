'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { ComponentDemo } from '../ComponentDemo';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { VerifiedLinkInput } from '@/components/common/VerifiedLinkInput';
import { SectionPanel } from '@/components/bounty-form/SectionPanel';

export default function MoleculesSection() {
  const [linkValue, setLinkValue] = useState('');

  return (
    <div className="space-y-12">
      {/* PageHeader */}
      <ComponentDemo
        name="PageHeader"
        description="Page title with optional breadcrumbs, subtitle, and action buttons."
        importPath="import { PageHeader } from '@/components/common/PageHeader'"
        code={`<PageHeader\n  title="Bounties"\n  subtitle="Manage all platform bounties"\n  breadcrumbs={[{ label: 'Dashboard', url: '/admin/dashboard' }, { label: 'Bounties' }]}\n  actions={<Button label="Create" icon="pi pi-plus" />}\n/>`}
        props={[
          { name: 'title', type: 'string', default: '—', required: true, description: 'Page title' },
          { name: 'subtitle', type: 'string', default: '—', description: 'Description below title' },
          { name: 'breadcrumbs', type: 'MenuItem[]', default: '—', description: 'PrimeReact breadcrumb items' },
          { name: 'actions', type: 'ReactNode', default: '—', description: 'Right-aligned action buttons' },
        ]}
      >
        <PageHeader
          title="Bounties"
          subtitle="Manage all platform bounties"
          breadcrumbs={[
            { label: 'Dashboard', url: '/admin/dashboard' },
            { label: 'Bounties' },
          ]}
          actions={<Button label="Create" icon="pi pi-plus" size="small" />}
        />
      </ComponentDemo>

      {/* LoadingState */}
      <ComponentDemo
        name="LoadingState"
        description="Skeleton and spinner loading placeholders for different layout contexts."
        importPath="import { LoadingState } from '@/components/common/LoadingState'"
        code={`<LoadingState type="inline" />\n<LoadingState type="card" />`}
        props={[
          { name: 'type', type: "'table' | 'card' | 'cards-grid' | 'form' | 'detail' | 'page' | 'inline'", default: '—', required: true, description: 'Loading layout variant' },
          { name: 'rows', type: 'number', default: '10', description: 'Number of skeleton rows (table)' },
          { name: 'columns', type: 'number', default: '4', description: 'Number of skeleton columns (table)' },
          { name: 'cards', type: 'number', default: '6', description: 'Number of skeleton cards (cards-grid)' },
        ]}
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs text-text-muted mb-2">inline</p>
            <LoadingState type="inline" />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">card</p>
            <LoadingState type="card" />
          </div>
        </div>
      </ComponentDemo>

      {/* ErrorState */}
      <ComponentDemo
        name="ErrorState"
        description="Error display with icon, message, and optional retry button."
        importPath="import { ErrorState } from '@/components/common/ErrorState'"
        code={`<ErrorState\n  error={new Error('Failed to load bounties')}\n  onRetry={() => refetch()}\n/>`}
        props={[
          { name: 'error', type: 'Error | null', default: '—', required: true, description: 'The error object to display' },
          { name: 'onRetry', type: '() => void', default: '—', description: 'Retry callback' },
        ]}
      >
        <ErrorState
          error={new Error('Failed to load bounties. Please try again.')}
          onRetry={() => alert('Retry clicked')}
        />
      </ComponentDemo>

      {/* EmptyState */}
      <ComponentDemo
        name="EmptyState"
        description="Placeholder when a list or section has no content."
        importPath="import { EmptyState } from '@/components/common/EmptyState'"
        code={`<EmptyState\n  icon="pi-search"\n  title="No bounties found"\n  message="Try adjusting your filters"\n  ctaLabel="Clear Filters"\n  ctaAction={() => clearFilters()}\n/>`}
        props={[
          { name: 'icon', type: 'string', default: "'pi-inbox'", description: 'PrimeIcons class suffix' },
          { name: 'title', type: 'string', default: '—', required: true, description: 'Primary message' },
          { name: 'message', type: 'string', default: '—', description: 'Secondary description' },
          { name: 'ctaLabel', type: 'string', default: '—', description: 'Call-to-action button label' },
          { name: 'ctaAction', type: '() => void', default: '—', description: 'CTA click handler' },
        ]}
      >
        <EmptyState
          icon="pi-search"
          title="No bounties found"
          message="Try adjusting your filters or create a new bounty."
          ctaLabel="Create Bounty"
          ctaAction={() => alert('Create clicked')}
          ctaIcon="pi-plus"
        />
      </ComponentDemo>

      {/* VerifiedLinkInput */}
      <ComponentDemo
        name="VerifiedLinkInput"
        description="URL input that verifies link accessibility on blur via the API."
        importPath="import { VerifiedLinkInput } from '@/components/common/VerifiedLinkInput'"
        code={`const [url, setUrl] = useState('');\n\n<VerifiedLinkInput value={url} onChange={setUrl} />`}
        props={[
          { name: 'value', type: 'string', default: '—', required: true, description: 'Current URL value' },
          { name: 'onChange', type: '(value: string) => void', default: '—', required: true, description: 'Change handler' },
          { name: 'placeholder', type: 'string', default: "'https://instagram.com/p/...'", description: 'Input placeholder' },
        ]}
      >
        <div className="max-w-md">
          <VerifiedLinkInput value={linkValue} onChange={setLinkValue} />
        </div>
      </ComponentDemo>

      {/* SectionPanel */}
      <ComponentDemo
        name="SectionPanel"
        description="Numbered, collapsible form section with completion and error indicators."
        importPath="import { SectionPanel } from '@/components/bounty-form/SectionPanel'"
        code={`<SectionPanel\n  number={1}\n  title="Channel Selection"\n  icon="pi-globe"\n  isComplete={true}\n  hasError={false}\n  helperText="Choose platforms and formats"\n>\n  <p>Form fields here</p>\n</SectionPanel>`}
        props={[
          { name: 'number', type: 'number', default: '—', required: true, description: 'Section number' },
          { name: 'title', type: 'string', default: '—', required: true, description: 'Section heading' },
          { name: 'icon', type: 'string', default: '—', required: true, description: 'PrimeIcon class' },
          { name: 'isComplete', type: 'boolean', default: '—', required: true, description: 'Shows green check when true' },
          { name: 'hasError', type: 'boolean', default: '—', required: true, description: 'Shows red exclamation when true' },
          { name: 'helperText', type: 'string', default: '—', description: 'Description shown below title' },
        ]}
      >
        <SectionPanel
          number={1}
          title="Channel Selection"
          icon="pi-globe"
          isComplete={true}
          hasError={false}
          helperText="Choose which social platforms and post formats are eligible."
        >
          <p className="text-sm text-text-secondary">Form fields would go here.</p>
        </SectionPanel>
      </ComponentDemo>
    </div>
  );
}
