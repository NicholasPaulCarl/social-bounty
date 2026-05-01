import { useState } from 'react';
import {
  Button, Badge, FilterChip, Card, KPI,
  Empty, Skeleton, Spinner,
  VerifBadge, Segmented, Stepper,
  Modal, Toast,
} from '../components';
import { Search, Inbox, AlertTriangle, Star } from 'lucide-react';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h4 className="text-lg font-heading font-semibold mb-4">{title}</h4>
      <div className="card p-6">{children}</div>
    </div>
  );
}

function ButtonSection() {
  return (
    <SectionCard title="Button">
      <p className="eyebrow mb-3">Variants</p>
      <div className="flex flex-wrap gap-3 mb-6">
        {(['primary', 'secondary', 'ghost', 'danger'] as const).map((v) => (
          <Button key={v} variant={v}>{v}</Button>
        ))}
      </div>
      <p className="eyebrow mb-3">Sizes</p>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <Button key={s} size={s} variant="primary">Size {s}</Button>
        ))}
      </div>
      <p className="eyebrow mb-3">With Icons</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" icon={<Search size={16} />}>Search</Button>
        <Button variant="secondary" iconRight={<Star size={16} />}>Favorite</Button>
        <Button variant="ghost" icon={<Search size={16} />} />
      </div>
    </SectionCard>
  );
}

function BadgeSection() {
  return (
    <SectionCard title="Badge">
      <div className="flex flex-wrap gap-3">
        {(['neutral', 'brand', 'success', 'warning', 'danger', 'info'] as const).map((t) => (
          <Badge key={t} tone={t}>{t}</Badge>
        ))}
      </div>
    </SectionCard>
  );
}

function FilterChipSection() {
  const [chips, setChips] = useState(['Instagram', 'TikTok', 'Facebook']);
  return (
    <SectionCard title="FilterChip">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <FilterChip key={c} onRemove={() => setChips((prev) => prev.filter((x) => x !== c))}>
            {c}
          </FilterChip>
        ))}
        <FilterChip>No remove</FilterChip>
      </div>
      {chips.length < 3 && (
        <button
          className="text-sm text-pink-600 mt-3 underline"
          onClick={() => setChips(['Instagram', 'TikTok', 'Facebook'])}
        >
          Reset chips
        </button>
      )}
    </SectionCard>
  );
}

function CardSection() {
  return (
    <SectionCard title="Card">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h5 className="font-heading font-semibold mb-2">Standard Card</h5>
          <p className="body-sm text-text-secondary">Default card with surface background and border.</p>
        </Card>
        <Card feature>
          <h5 className="font-heading font-semibold mb-2">Feature Card</h5>
          <p className="body-sm text-text-secondary">Elevated card for highlighted content.</p>
        </Card>
      </div>
    </SectionCard>
  );
}

function KPISection() {
  return (
    <SectionCard title="KPI Tile">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Total Earnings" value="R 12,345" delta={{ dir: 'up', pct: 18 }} />
        <KPI label="Active Bounties" value="47" meta="across 12 brands" />
        <KPI label="Conversion" value="23.5" unit="%" delta={{ dir: 'down', pct: 3 }} />
        <KPI label="Revenue" value="R 1,247" large delta={{ dir: 'up', pct: 42 }} feature />
      </div>
    </SectionCard>
  );
}

function EmptySection() {
  return (
    <SectionCard title="Empty State">
      <div className="grid md:grid-cols-2 gap-6">
        {(['default', 'brand', 'success', 'warning'] as const).map((tone) => (
          <Empty
            key={tone}
            tone={tone}
            icon={<Inbox size={24} />}
            title={`No results (${tone})`}
            body="Try adjusting your filters or search terms."
            action={<Button variant="secondary" size="sm">Clear filters</Button>}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function SkeletonSection() {
  return (
    <SectionCard title="Skeleton">
      <div className="space-y-4 max-w-md">
        <div>
          <span className="label-sm text-text-muted">line</span>
          <Skeleton shape="line" />
        </div>
        <div>
          <span className="label-sm text-text-muted">line-lg</span>
          <Skeleton shape="line-lg" />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="label-sm text-text-muted">circle</span>
            <Skeleton shape="circle" />
          </div>
          <div className="flex-1">
            <span className="label-sm text-text-muted">rect</span>
            <Skeleton shape="rect" w="100%" h="80px" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SpinnerSection() {
  return (
    <SectionCard title="Spinner">
      <div className="flex items-center gap-8">
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <Spinner size={s} />
            <span className="text-xs text-text-muted">{s}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2 bg-pink-600 p-4 rounded-lg">
          <Spinner onPink />
          <span className="text-xs text-white">onPink</span>
        </div>
      </div>
    </SectionCard>
  );
}

function VerifBadgeSection() {
  return (
    <SectionCard title="VerifBadge">
      <div className="flex flex-wrap gap-4">
        {(['verified', 'scraping', 'removed', 'pending'] as const).map((s) => (
          <VerifBadge key={s} state={s} />
        ))}
      </div>
    </SectionCard>
  );
}

function SegmentedSection() {
  const [value, setValue] = useState('all');
  return (
    <SectionCard title="Segmented">
      <Segmented
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'draft', label: 'Draft' },
        ]}
        value={value}
        onChange={setValue}
      />
      <p className="text-sm text-text-muted mt-3">Selected: {value}</p>
    </SectionCard>
  );
}

function StepperSection() {
  const [current, setCurrent] = useState(1);
  return (
    <SectionCard title="Stepper">
      <Stepper steps={['Details', 'Rewards', 'Rules', 'Review']} current={current} />
      <div className="flex gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={() => setCurrent(Math.max(0, current - 1))}>
          Back
        </Button>
        <Button variant="primary" size="sm" onClick={() => setCurrent(Math.min(4, current + 1))}>
          Next
        </Button>
      </div>
    </SectionCard>
  );
}

function ModalSection() {
  const [open, setOpen] = useState(false);
  const [danger, setDanger] = useState(false);
  return (
    <SectionCard title="Modal">
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => { setDanger(false); setOpen(true); }}>
          Open Modal
        </Button>
        <Button variant="danger" onClick={() => { setDanger(true); setOpen(true); }}>
          Open Danger Modal
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={danger ? 'Delete Bounty?' : 'Confirm Action'}
        subtitle={danger ? 'This cannot be undone.' : 'Please review the details below.'}
        danger={danger}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => setOpen(false)}>
              {danger ? 'Delete' : 'Confirm'}
            </Button>
          </div>
        }
      >
        <p className="body">
          This is the modal body content. It supports any React children.
        </p>
      </Modal>
    </SectionCard>
  );
}

function ToastSection() {
  return (
    <SectionCard title="Toast">
      <div className="space-y-3 max-w-lg">
        {(['info', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Toast
            key={tone}
            tone={tone}
            title={`${tone.charAt(0).toUpperCase() + tone.slice(1)} toast`}
            body={`This is a ${tone} notification message.`}
          />
        ))}
      </div>
    </SectionCard>
  );
}

export function ComponentsSection() {
  return (
    <section id="components">
      <h2 className="text-2xl font-heading font-bold mb-6">Components</h2>
      <ButtonSection />
      <BadgeSection />
      <FilterChipSection />
      <CardSection />
      <KPISection />
      <EmptySection />
      <SkeletonSection />
      <SpinnerSection />
      <VerifBadgeSection />
      <SegmentedSection />
      <StepperSection />
      <ModalSection />
      <ToastSection />
    </section>
  );
}
