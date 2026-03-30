'use client';

const TERMINOLOGY = [
  { use: 'Hunter', never: 'User, participant, influencer, creator' },
  { use: 'Bounty', never: 'Task, job, gig, campaign' },
  { use: 'Bounty Board', never: 'Marketplace, listings, feed' },
  { use: 'Submission', never: 'Entry, deliverable, upload' },
  { use: 'Proof', never: 'Evidence, attachment' },
  { use: 'Reward', never: 'Payment, payout (except brand-admin)' },
  { use: 'Brand', never: 'Client, company, advertiser' },
  { use: 'Claim', never: 'Apply, sign up, accept' },
];

const PRIMARY_COLORS = [
  { name: 'primary-50', hex: '#fdf2f8', desc: 'Tinted backgrounds' },
  { name: 'primary-100', hex: '#fce7f3', desc: 'Hover backgrounds' },
  { name: 'primary-200', hex: '#fbcfe8', desc: 'Borders, dividers' },
  { name: 'primary-400', hex: '#f472b6', desc: 'Icons, secondary buttons' },
  { name: 'primary-500', hex: '#ec4899', desc: 'Primary brand — buttons, links' },
  { name: 'primary-600', hex: '#db2777', desc: 'Hover / active state' },
  { name: 'primary-700', hex: '#be185d', desc: 'Pressed, focus rings' },
];

const STATUS_COLORS = [
  { name: 'Success', hex: '#22c55e', desc: 'Approved, Live, earned' },
  { name: 'Warning', hex: '#f59e0b', desc: 'Pending, Needs More Info' },
  { name: 'Danger', hex: '#ef4444', desc: 'Rejected, Error, Suspended' },
  { name: 'Info', hex: '#3b82f6', desc: 'Submitted, informational' },
  { name: 'Reward', hex: '#f59e0b', desc: 'Reward amounts, achievements' },
];

const TONE_EXAMPLES = [
  { context: 'Wins / milestones', energy: 'High', example: "Boom! That's 10 bounties crushed this week." },
  { context: 'Features / help', energy: 'Medium', example: 'Bounties have a status — Draft, Live, Paused, or Closed.' },
  { context: 'Empty states', energy: 'Medium-high', example: "The board's full of fresh bounties. Pick one and get started." },
  { context: 'Confirmations', energy: 'Low-medium', example: "Submission received. You'll hear back once the brand reviews it." },
  { context: 'Rejections', energy: 'Low', example: "This one didn't land. Here's the feedback — give it another shot." },
  { context: 'Security / legal', energy: 'Neutral', example: 'Your account has been suspended. Contact support if this is an error.' },
];

const LOVED_WORDS = ['hunt', 'earn', 'claim', 'crush it', 'drop', 'fresh', 'fast', 'real', 'proof', 'reward', 'board', 'quest', 'level up', 'unlock'];
const AVOID_WORDS = ['leverage', 'synergy', 'utilise', 'stakeholder', 'deliverable', 'optimise', 'circle back', 'pipeline', 'holistic', 'solution', 'disrupt', 'ecosystem'];

export default function BrandSection() {
  return (
    <div className="space-y-12">
      {/* Positioning */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-text-primary">Social Bounty</h3>
            <p className="text-sm text-text-muted">The bounty board for the internet.</p>
          </div>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          Brands post small, rewarding tasks. Hunters complete them daily for real income. We cut out agencies, kill gatekeeping, and make UGC simple, direct, and fun.
        </p>
        <div className="flex gap-4">
          <div className="glass-card p-3 text-center flex-1">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tagline</p>
            <p className="font-heading font-bold text-accent-cyan">Hunt. Create. Earn.</p>
          </div>
          <div className="glass-card p-3 text-center flex-1">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Archetype</p>
            <p className="font-heading font-bold text-accent-amber">The Jester</p>
          </div>
        </div>
      </div>

      {/* Terminology */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Terminology</h3>
        <p className="text-sm text-text-secondary mb-4">Always use these terms in all UI, copy, and marketing.</p>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Use This</th>
                <th className="text-left px-4 py-3 font-medium">Never This</th>
              </tr>
            </thead>
            <tbody>
              {TERMINOLOGY.map((t) => (
                <tr key={t.use} className="border-t border-glass-border/30">
                  <td className="px-4 py-2.5 font-semibold text-accent-emerald">{t.use}</td>
                  <td className="px-4 py-2.5 text-accent-rose/70 line-through decoration-accent-rose/30">{t.never}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Colors */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Brand Colours — Pink Primary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {PRIMARY_COLORS.map((c) => (
            <div key={c.name} className="text-center">
              <div className="w-full h-16 rounded-xl mb-2 border border-glass-border" style={{ backgroundColor: c.hex }} />
              <p className="text-xs font-mono text-text-muted">{c.hex}</p>
              <p className="text-xs text-text-secondary mt-0.5">{c.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Colors */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Status & Semantic Colours</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUS_COLORS.map((c) => (
            <div key={c.name} className="glass-card p-4 text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ backgroundColor: c.hex }} />
              <p className="text-sm font-semibold text-text-primary">{c.name}</p>
              <p className="text-xs text-text-muted mt-1">{c.desc}</p>
              <p className="text-xs font-mono text-text-muted mt-1">{c.hex}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Typography</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Headings</p>
            <p className="font-heading text-2xl font-bold text-text-primary">Space Grotesk</p>
            <p className="text-xs text-text-muted mt-2 font-mono">font-heading</p>
            <p className="text-sm text-text-secondary mt-2">Bold, quirky, unmistakably modern. This is where the Jester shows up visually.</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Body</p>
            <p className="font-body text-2xl font-medium text-text-primary">Inter</p>
            <p className="text-xs text-text-muted mt-2 font-mono">font-body</p>
            <p className="text-sm text-text-secondary mt-2">Clean and effortlessly readable. 400–500 weight for body copy.</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Code / Data</p>
            <p className="font-mono text-2xl font-medium text-text-primary">Source Code Pro</p>
            <p className="text-xs text-text-muted mt-2 font-mono">font-mono</p>
            <p className="text-sm text-text-secondary mt-2">Monospaced precision for reward amounts, dates, and IDs.</p>
          </div>
        </div>
      </div>

      {/* Voice & Tone */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Voice & Tone</h3>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Context</th>
                <th className="text-left px-4 py-3 font-medium">Energy</th>
                <th className="text-left px-4 py-3 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {TONE_EXAMPLES.map((t) => (
                <tr key={t.context} className="border-t border-glass-border/30">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{t.context}</td>
                  <td className="px-4 py-2.5 text-accent-amber">{t.energy}</td>
                  <td className="px-4 py-2.5 text-text-secondary italic">&ldquo;{t.example}&rdquo;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Words We Love / Avoid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h4 className="text-sm font-heading font-semibold text-accent-emerald uppercase tracking-wider mb-3">Words We Love</h4>
          <div className="flex flex-wrap gap-2">
            {LOVED_WORDS.map((w) => (
              <span key={w} className="px-3 py-1 text-xs font-medium bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30 rounded-full">
                {w}
              </span>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-sm font-heading font-semibold text-accent-rose uppercase tracking-wider mb-3">Words We Avoid</h4>
          <div className="flex flex-wrap gap-2">
            {AVOID_WORDS.map((w) => (
              <span key={w} className="px-3 py-1 text-xs font-medium bg-accent-rose/10 text-accent-rose border border-accent-rose/30 rounded-full line-through">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-Ship Checklist */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Pre-Ship Checklist</h3>
        <div className="glass-card p-6 space-y-3">
          {[
            'Colours match the palette roles',
            'Typography uses the correct font for its role (heading, body, data)',
            'Icons are from Lucide/PrimeIcons, used consistently',
            'Bounty cards follow the standard card pattern',
            'Success/reward states include celebration',
            'Empty states have personality',
            'Error states are empathetic and helpful',
            'All user-facing copy uses correct terminology (Hunter, Bounty, Reward)',
            'Overall feel is energetic and game-like, not corporate',
            'Mobile-first — it works on a phone before desktop',
            'No words from the avoid list',
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer group">
              <input type="checkbox" className="mt-0.5 accent-accent-cyan" />
              <span className="group-hover:text-text-primary transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
