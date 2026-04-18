'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputSwitch } from 'primereact/inputswitch';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Dialog } from 'primereact/dialog';
import { Panel } from 'primereact/panel';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabMenu } from 'primereact/tabmenu';
import { BreadCrumb } from 'primereact/breadcrumb';
import type { Nullable } from 'primereact/ts-helpers';
import { BarChart3, Inbox, Settings, Check, Search, Star, ExternalLink, Home } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

const MOCK_TABLE_DATA = [
  { id: 1, name: 'Alice Johnson', role: 'Participant', status: 'Active' },
  { id: 2, name: 'Bob Smith', role: 'Business Admin', status: 'Active' },
  { id: 3, name: 'Carol Lee', role: 'Super Admin', status: 'Active' },
  { id: 4, name: 'Dave Park', role: 'Participant', status: 'Suspended' },
];

const DROPDOWN_OPTIONS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Facebook', value: 'facebook' },
];

// Render a small Lucide icon as a ReactNode string replacement for TabMenu's
// MenuItem icon prop (which accepts a className OR a ReactNode in recent
// PrimeReact versions). We pass ReactNode via a render function wrapped into
// the `template` slot for consistency. Here we use the `icon` prop which
// accepts ReactNode in PrimeReact 10.
const TAB_ITEMS: { label: string; Icon: LucideIcon }[] = [
  { label: 'Overview', Icon: BarChart3 },
  { label: 'Submissions', Icon: Inbox },
  { label: 'Settings', Icon: Settings },
];

const BREADCRUMB_ITEMS = [
  { label: 'Admin', url: '/admin' },
  { label: 'Users', url: '/admin/users' },
  { label: 'Alice Johnson' },
];

export default function PrimeReactSection() {
  const [textValue, setTextValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [numberValue, setNumberValue] = useState<Nullable<number>>(42);
  const [passwordValue, setPasswordValue] = useState('');
  const [dropdownValue, setDropdownValue] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState<Nullable<Date>>(null);
  const [switchValue, setSwitchValue] = useState(false);
  const [checkValue, setCheckValue] = useState(false);
  const [paginatorFirst, setPaginatorFirst] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-10">
      {/* Buttons */}
      <div className="glass-card p-6">
        <h4 className="text-base font-heading font-semibold text-text-primary mb-4">Buttons</h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-2">Severities</p>
            <div className="flex flex-wrap gap-2">
              <Button label="Primary" />
              <Button label="Secondary" severity="secondary" />
              <Button label="Danger" severity="danger" />
              <Button label="Success" severity="success" />
              <Button label="Warning" severity="warning" />
              <Button label="Info" severity="info" />
              <Button label="Help" severity="help" />
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">Variants</p>
            <div className="flex flex-wrap gap-2">
              <Button label="Text" text />
              <Button label="Outlined" outlined />
              <Button label="Raised" raised />
              <Button icon={<Check size={16} strokeWidth={2} />} rounded />
              <Button icon={<Search size={16} strokeWidth={2} />} severity="secondary" rounded outlined />
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">Sizes</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button label="Small" size="small" />
              <Button label="Normal" />
              <Button label="Large" size="large" />
              <Button icon={<Star size={14} strokeWidth={2} />} size="small" rounded />
            </div>
          </div>
        </div>
      </div>

      {/* Form Inputs */}
      <div className="glass-card p-6">
        <h4 className="text-base font-heading font-semibold text-text-primary mb-4">Form Inputs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-text-muted">InputText</label>
            <InputText value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Type something..." className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted">InputNumber</label>
            <InputNumber value={numberValue} onValueChange={(e) => setNumberValue(e.value)} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted">Password</label>
            <Password value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} toggleMask className="w-full" inputClassName="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted">Dropdown</label>
            <Dropdown value={dropdownValue} options={DROPDOWN_OPTIONS} onChange={(e) => setDropdownValue(e.value)} placeholder="Select channel" className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted">Calendar</label>
            <Calendar value={dateValue} onChange={(e) => setDateValue(e.value)} showIcon className="w-full" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <InputSwitch checked={switchValue} onChange={(e) => setSwitchValue(e.value)} />
              <label className="text-xs text-text-muted">InputSwitch ({switchValue ? 'ON' : 'OFF'})</label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={checkValue} onChange={(e) => setCheckValue(e.checked ?? false)} />
              <label className="text-xs text-text-muted">Checkbox ({checkValue ? 'checked' : 'unchecked'})</label>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-text-muted">InputTextarea</label>
            <InputTextarea value={textareaValue} onChange={(e) => setTextareaValue(e.target.value)} rows={3} placeholder="Write a description..." className="w-full" />
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="glass-card p-6">
        <h4 className="text-base font-heading font-semibold text-text-primary mb-4">Data Display</h4>
        <DataTable value={MOCK_TABLE_DATA} stripedRows size="small" className="mb-4">
          <Column field="id" header="ID" style={{ width: '4rem' }} />
          <Column field="name" header="Name" />
          <Column field="role" header="Role" />
          <Column field="status" header="Status" />
        </DataTable>
        <Paginator
          first={paginatorFirst}
          rows={10}
          totalRecords={120}
          onPageChange={(e) => setPaginatorFirst(e.first)}
          className="border-t border-glass-border"
        />
      </div>

      {/* Overlays */}
      <div className="glass-card p-6">
        <h4 className="text-base font-heading font-semibold text-text-primary mb-4">Overlays</h4>
        <div className="space-y-4">
          <Button label="Open dialog" icon={<ExternalLink size={16} strokeWidth={2} />} onClick={() => setDialogVisible(true)} />
          <Dialog
            visible={dialogVisible}
            onHide={() => setDialogVisible(false)}
            header="NeoGlass Dialog"
            modal
            className="w-full max-w-lg"
          >
            <p className="text-text-secondary text-sm">
              This is a PrimeReact Dialog styled with NeoGlass design tokens.
            </p>
          </Dialog>
          <Panel header="Collapsible Panel" toggleable className="glass-card !border-glass-border">
            <p className="text-text-secondary text-sm">
              Panel content with glass styling. Use for grouped sections.
            </p>
          </Panel>
        </div>
      </div>

      {/* Indicators */}
      <div className="glass-card p-6">
        <h4 className="text-base font-heading font-semibold text-text-primary mb-4">Indicators</h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-2">Tag severities</p>
            <div className="flex flex-wrap gap-2">
              <Tag value="Default" />
              <Tag value="Success" severity="success" />
              <Tag value="Info" severity="info" />
              <Tag value="Warning" severity="warning" />
              <Tag value="Danger" severity="danger" />
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">Message severities</p>
            <div className="space-y-2">
              <Message severity="success" text="Operation completed successfully" className="w-full" />
              <Message severity="info" text="Informational message here" className="w-full" />
              <Message severity="warn" text="Warning: please review before continuing" className="w-full" />
              <Message severity="error" text="Error: something went wrong" className="w-full" />
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">ProgressSpinner</p>
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="glass-card p-6">
        <h4 className="text-base font-heading font-semibold text-text-primary mb-4">Navigation</h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-2">TabMenu</p>
            <TabMenu
              model={TAB_ITEMS.map((t) => ({
                label: t.label,
                icon: <t.Icon size={14} strokeWidth={2} />,
              }))}
              activeIndex={activeTab}
              onTabChange={(e) => setActiveTab(e.index)}
            />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-2">BreadCrumb</p>
            <BreadCrumb model={BREADCRUMB_ITEMS} home={{ icon: <Home size={14} strokeWidth={2} />, url: '/' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
