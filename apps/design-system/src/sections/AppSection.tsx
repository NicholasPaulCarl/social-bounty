import { useState } from 'react';
import {
  Compass, Send, FolderCheck, Wallet, Inbox, LayoutDashboard,
  Megaphone, ClipboardCheck, Users, TrendingUp, CreditCard,
  Bell, Settings, Search, ChevronsLeft, ChevronsRight, ChevronUp,
  X, LogOut, BadgeCheck, Clock, Globe, Lock, Camera, Instagram,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Reusable sub-components matching AppSidebar.tsx exactly ─────── */

function CountPip({ count, urgent = false, collapsedDot = false }: {
  count: number; urgent?: boolean; collapsedDot?: boolean;
}) {
  if (!count) return null;
  if (collapsedDot) {
    return (
      <span
        className={`absolute top-1 right-1 block w-2 h-2 rounded-full border-2 border-white ${
          urgent ? 'bg-danger-500' : 'bg-pink-600'
        }`}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full font-mono tabular-nums font-bold text-[11px] leading-none ${
      urgent ? 'bg-danger-600 text-white' : 'bg-pink-100 text-pink-700'
    }`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NavSectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="mx-5 mt-[14px] mb-1.5 h-px bg-slate-200" aria-hidden="true" />;
  }
  return (
    <div className="px-5 pt-[14px] pb-1.5 text-[10px] font-bold uppercase tracking-[0.10em] text-text-muted">
      {label}
    </div>
  );
}

function CreatorIdentity({ initials, name, role, collapsed }: {
  initials: string; name: string; role: string; collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full font-heading font-bold text-[13px] text-pink-700 bg-gradient-to-br from-pink-100 to-pink-50">
          {initials}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] bg-bg-elevated border border-slate-200">
      <div className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-full font-heading font-bold text-[13px] text-pink-700 bg-gradient-to-br from-pink-100 to-pink-50 shrink-0">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-primary truncate">{name}</div>
        <div className="text-[11px] text-text-muted truncate">{role}</div>
      </div>
    </div>
  );
}

interface NavItem {
  label: string;
  Icon: LucideIcon;
  href: string;
  badge?: number;
  urgent?: boolean;
}

function NavItemRow({ item, active, collapsed }: {
  item: NavItem; active: boolean; collapsed: boolean;
}) {
  const badge = item.badge ?? 0;
  const Icon = item.Icon;

  const baseClasses =
    'relative group flex items-center rounded-[10px] text-[13px] transition-[background,color] duration-normal ease-standard';
  const layoutClasses = collapsed
    ? 'justify-center mx-2 py-[10px]'
    : 'gap-3 mx-2 px-3 py-[9px]';
  const activeClasses = active
    ? 'bg-pink-50 text-pink-700 font-semibold'
    : 'text-text-secondary font-medium hover:bg-slate-100';

  return (
    <a href="#" className={`${baseClasses} ${layoutClasses} ${activeClasses}`} onClick={e => e.preventDefault()}>
      {active && !collapsed && (
        <span className="absolute -left-2 top-2 bottom-2 w-[3px] rounded bg-pink-600" aria-hidden="true" />
      )}
      <span className="relative inline-flex shrink-0">
        <Icon size={collapsed ? 20 : 18} strokeWidth={2} />
        {collapsed && badge > 0 && <CountPip count={badge} urgent={item.urgent} collapsedDot />}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 font-heading whitespace-nowrap overflow-hidden text-ellipsis">
            {item.label}
          </span>
          {badge > 0 && <CountPip count={badge} urgent={item.urgent} />}
        </>
      )}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50" aria-hidden="true">
          {item.label}
        </span>
      )}
    </a>
  );
}

/* ── Sample nav data ────────────────────────────────────────────── */

const PARTICIPANT_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'Discover',
    items: [
      { label: 'Browse Bounties', Icon: Compass, href: '/bounties' },
      { label: 'My Submissions', Icon: Send, href: '/my-submissions', badge: 2 },
      { label: 'Saved', Icon: FolderCheck, href: '/saved' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Earnings', Icon: Wallet, href: '/earnings' },
      { label: 'Inbox', Icon: Inbox, href: '/inbox', badge: 5 },
    ],
  },
];

const BUSINESS_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', Icon: LayoutDashboard, href: '/business/dashboard' },
      { label: 'Campaigns', Icon: Megaphone, href: '/business/bounties' },
      { label: 'Submissions', Icon: ClipboardCheck, href: '/business/submissions', badge: 12 },
      { label: 'Team', Icon: Users, href: '/business/team' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Analytics', Icon: TrendingUp, href: '/business/analytics' },
      { label: 'Billing', Icon: CreditCard, href: '/business/billing' },
    ],
  },
];

/* ── Bounty Card (static replica) ───────────────────────────────── */

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360;
}

function BrandAvatar({ name, size = 24 }: { name: string; size?: number }) {
  const h = hashHue(name);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: 9999,
        background: `hsl(${h} 80% 92%)`, color: `hsl(${h} 70% 35%)`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-heading)', fontWeight: 700,
        fontSize: size <= 24 ? 11 : 13, letterSpacing: '-0.02em',
        flex: 'none', userSelect: 'none',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function FormatChip({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-elevated text-text-secondary"
      style={{ padding: '2px 8px', fontSize: 11, fontWeight: 500, lineHeight: 1, height: 22 }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

function StatusDot() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="block w-2 h-2 rounded-full bg-success-500" />
      <span className="uppercase text-[10px] font-bold tracking-wide text-success-600">Live</span>
    </span>
  );
}

function DemoBountyCard({ reward, brand, title, chips, time, access, ribbon }: {
  reward: string; brand: string; title: string;
  chips: { Icon: LucideIcon; label: string }[];
  time?: { label: string; urgent?: boolean };
  access: { Icon: LucideIcon; label: string; color: string };
  ribbon?: string;
}) {
  return (
    <article
      className="bounty-card relative flex cursor-pointer flex-col bg-surface"
      style={{
        border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-xl)',
        padding: 16, gap: 10, minHeight: 168,
        boxShadow: 'var(--shadow-level-1)', overflow: 'hidden',
      }}
    >
      {ribbon && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: ribbon === 'Submitted' ? 'var(--slate-700)' : 'var(--pink-600)',
          color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          padding: '4px 10px', borderBottomLeftRadius: 8, textTransform: 'uppercase',
        }}>
          {ribbon}
        </div>
      )}
      <div className="flex items-start justify-between" style={{ gap: 8 }}>
        <div className="font-mono tabular-nums" style={{
          fontSize: 26, fontWeight: 700, lineHeight: 1,
          color: 'var(--pink-600)', letterSpacing: '-0.02em',
        }}>
          {reward}
        </div>
        <StatusDot />
      </div>
      <div className="flex items-center" style={{ gap: 8, marginTop: -2 }}>
        <BrandAvatar name={brand} />
        <span className="text-text-secondary" style={{
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180,
        }}>
          {brand}
        </span>
        <span style={{ color: 'var(--pink-600)', display: 'inline-flex' }}>
          <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <h3 className="font-heading text-text-primary" style={{
        fontWeight: 600, fontSize: 16, lineHeight: 1.25, margin: 0,
        letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {title}
      </h3>
      {chips.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {chips.map((c, i) => <FormatChip key={i} Icon={c.Icon} label={c.label} />)}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div className="flex items-center justify-between" style={{
        fontSize: 12, color: 'var(--text-secondary)', paddingTop: 8,
        borderTop: '1px solid var(--slate-100)',
      }}>
        {time ? (
          <span className="inline-flex items-center" style={{
            gap: 4, color: time.urgent ? 'var(--warning-600)' : 'var(--text-secondary)',
            fontWeight: time.urgent ? 700 : 500,
          }}>
            <Clock size={12} strokeWidth={2} />
            {time.label}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No deadline</span>
        )}
        <span className="inline-flex items-center" style={{ gap: 4, color: access.color, fontWeight: 500 }}>
          <access.Icon size={12} strokeWidth={2} />
          {access.label}
        </span>
      </div>
    </article>
  );
}

/* ── Template Card (from user's HTML) ───────────────────────────── */

function TemplateCard({ icon: IconComp, title, description }: {
  icon: LucideIcon; title: string; description: string;
}) {
  return (
    <a
      className="group block rounded-xl border border-slate-200 bg-surface px-3 py-3 sm:px-4 sm:py-3.5 text-left transition-all hover:border-pink-600/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
      href="#"
      onClick={e => e.preventDefault()}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pink-600/10 text-pink-600 transition-colors group-hover:bg-pink-600/15"
          aria-hidden="true"
          style={{ width: 32, height: 32 }}
        >
          <IconComp size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block font-semibold text-text-primary" style={{ fontSize: 13, lineHeight: 1.25 }}>
            {title}
          </span>
          <span className="mt-0.5 block text-text-muted" style={{ fontSize: 11, lineHeight: 1.35 }}>
            {description}
          </span>
        </div>
      </div>
    </a>
  );
}

/* ── Main Section ───────────────────────────────────────────────── */

export function AppSection() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section id="app-components">
      <h2 className="text-2xl font-heading font-bold mb-6">App Components</h2>

      {/* Sidebar */}
      <h4 className="text-lg font-heading font-semibold mb-4">Sidebar Navigation</h4>
      <div className="flex gap-6 mb-10">
        {[false, true].map((isCollapsed) => (
          <div
            key={String(isCollapsed)}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
            style={{ width: isCollapsed ? 72 : 256, height: 520 }}
          >
            {/* Brand mark */}
            <div className={`flex items-center min-h-14 ${isCollapsed ? 'justify-center px-0 py-4' : 'justify-between px-[18px] py-4'}`}>
              <a href="#" onClick={e => e.preventDefault()} className="inline-flex items-center gap-2 font-heading font-bold tracking-tight text-[17px] text-text-primary">
                <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-pink-600 to-blue-600 text-white text-[13px] font-bold">S</span>
                {!isCollapsed && <span>social<span className="text-pink-600">bounty</span></span>}
              </a>
              {!isCollapsed && (
                <button className="inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors">
                  <ChevronsLeft size={16} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Identity */}
            <div className={isCollapsed ? 'px-0 pb-2' : 'px-3 pb-2'}>
              <CreatorIdentity initials="MK" name="Mikhail K." role="Creator" collapsed={isCollapsed} />
            </div>

            {/* Search */}
            {!isCollapsed && (
              <div className="px-3 pb-2.5 pt-1.5">
                <div className="flex items-center gap-2 px-2.5 py-2 bg-bg-elevated rounded-lg text-text-muted text-xs" role="search">
                  <Search size={14} strokeWidth={2} className="shrink-0" />
                  <span className="flex-1">Search</span>
                  <kbd className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-text-muted">⌘K</kbd>
                </div>
              </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto pb-2">
              {PARTICIPANT_NAV.map((section) => (
                <div key={section.label}>
                  <NavSectionLabel label={section.label} collapsed={isCollapsed} />
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item, i) => (
                      <NavItemRow key={item.href} item={item} active={i === 0} collapsed={isCollapsed} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-200 flex flex-col gap-0.5 py-2">
              <NavItemRow item={{ label: 'Notifications', Icon: Bell, href: '/inbox', badge: 3 }} active={false} collapsed={isCollapsed} />
              {isCollapsed && (
                <div className="flex justify-center py-1">
                  <button className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors">
                    <ChevronsRight size={16} strokeWidth={2} />
                  </button>
                </div>
              )}
              <div className={isCollapsed ? 'px-0' : 'px-2'}>
                <button className={`flex items-center rounded-[10px] hover:bg-slate-100 transition-colors w-full text-left ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-2'}`}>
                  <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[13px] font-bold shrink-0">MK</div>
                  {!isCollapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-text-primary truncate">Mikhail K.</p>
                        <p className="text-[11px] text-text-muted truncate">Creator</p>
                      </div>
                      <ChevronUp size={14} strokeWidth={2} className="text-text-muted shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Count Pips */}
      <h4 className="text-lg font-heading font-semibold mb-4">Count Pips</h4>
      <div className="card p-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <CountPip count={5} />
            <span className="text-xs text-text-muted">Normal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CountPip count={99} />
            <span className="text-xs text-text-muted">High</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CountPip count={150} />
            <span className="text-xs text-text-muted">Overflow</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CountPip count={3} urgent />
            <span className="text-xs text-text-muted">Urgent</span>
          </div>
          <div className="flex flex-col items-center gap-2 relative w-8 h-8 bg-slate-100 rounded-lg">
            <CountPip count={1} collapsedDot />
            <span className="text-xs text-text-muted mt-9">Dot</span>
          </div>
          <div className="flex flex-col items-center gap-2 relative w-8 h-8 bg-slate-100 rounded-lg">
            <CountPip count={1} urgent collapsedDot />
            <span className="text-xs text-text-muted mt-9">Dot urgent</span>
          </div>
        </div>
      </div>

      {/* Bounty Cards */}
      <h4 className="text-lg font-heading font-semibold mb-4">Bounty Card</h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <DemoBountyCard
          reward="R 500"
          brand="SneakerHub SA"
          title="Unbox our new Air Max 97s on TikTok"
          chips={[
            { Icon: Camera, label: 'IG Reel' },
            { Icon: Camera, label: 'TT Video' },
          ]}
          time={{ label: '3 days left' }}
          access={{ Icon: Globe, label: 'Open', color: 'var(--success-600)' }}
        />
        <DemoBountyCard
          reward="R 1,200"
          brand="Cape Coffee Co"
          title="Review our new cold brew range with honest take"
          chips={[{ Icon: Camera, label: 'IG Feed Post' }]}
          time={{ label: '12 hours left', urgent: true }}
          access={{ Icon: Users, label: '2/10 slots', color: 'var(--slate-500)' }}
          ribbon="Applied"
        />
        <DemoBountyCard
          reward="R 350"
          brand="Fitness First"
          title="Share your workout routine featuring our app"
          chips={[
            { Icon: Camera, label: 'IG Reel' },
            { Icon: Camera, label: 'IG Story' },
          ]}
          time={{ label: '5 days left' }}
          access={{ Icon: Lock, label: 'Apply', color: 'var(--warning-600)' }}
          ribbon="Submitted"
        />
      </div>

      {/* Template Card */}
      <h4 className="text-lg font-heading font-semibold mb-4">Template / Action Card</h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        <TemplateCard
          icon={Megaphone}
          title="Blank bounty"
          description="Start from scratch with a clean slate."
        />
        <TemplateCard
          icon={Camera}
          title="Instagram Reel"
          description="Pre-configured for Instagram Reel submissions."
        />
        <TemplateCard
          icon={ClipboardCheck}
          title="Product Review"
          description="Unboxing or review content across platforms."
        />
      </div>

      {/* Nav Section Labels */}
      <h4 className="text-lg font-heading font-semibold mb-4">Nav Section Labels</h4>
      <div className="card p-6 mb-10">
        <div className="flex gap-8">
          <div style={{ width: 200 }}>
            <p className="text-xs text-text-muted mb-2">Expanded</p>
            <NavSectionLabel label="Discover" collapsed={false} />
            <NavSectionLabel label="Account" collapsed={false} />
          </div>
          <div style={{ width: 72 }}>
            <p className="text-xs text-text-muted mb-2">Collapsed</p>
            <NavSectionLabel label="Discover" collapsed />
            <NavSectionLabel label="Account" collapsed />
          </div>
        </div>
      </div>
    </section>
  );
}
