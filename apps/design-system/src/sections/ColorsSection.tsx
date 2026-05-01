import { useState } from 'react';

const SCALES: Record<string, Record<string, string>> = {
  Pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
    400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
    800: '#9d174d', 900: '#831843',
  },
  Blue: {
    50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
  },
  Slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a',
  },
  Reward: {
    500: '#f59e0b', 600: '#d97706',
  },
};

const STATUS: Record<string, Record<string, string>> = {
  Success: { 500: '#22c55e', 600: '#16a34a' },
  Warning: { 500: '#f59e0b', 600: '#d97706' },
  Danger: { 500: '#ef4444', 600: '#dc2626' },
  Info: { 500: '#3b82f6', 600: '#2563eb' },
};

const SEMANTIC_BG: Record<string, string> = {
  'bg-void': 'var(--bg-void)',
  'bg-abyss': 'var(--bg-abyss)',
  'bg-surface': 'var(--bg-surface)',
  'bg-elevated': 'var(--bg-elevated)',
  'bg-hover': 'var(--bg-hover)',
};

const SEMANTIC_TEXT: Record<string, string> = {
  'text-primary': 'var(--text-primary)',
  'text-secondary': 'var(--text-secondary)',
  'text-muted': 'var(--text-muted)',
  'text-disabled': 'var(--text-disabled)',
};

const GLASS: Record<string, string> = {
  'glass-bg': 'rgba(255,255,255,0.80)',
  'glass-border': 'rgba(0,0,0,0.08)',
  'glass-hover': 'rgba(0,0,0,0.04)',
  'glass-active': 'rgba(0,0,0,0.06)',
  'glass-overlay': 'rgba(0,0,0,0.30)',
};

function Swatch({ name, value }: { name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const isDark = isColorDark(value);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={copy}
      className="flex flex-col items-center gap-1 group cursor-pointer"
      title={`Click to copy ${value}`}
    >
      <div
        className="w-16 h-16 rounded-lg border border-slate-200 shadow-level-1 transition-transform group-hover:scale-110"
        style={{ background: value }}
      />
      <span className="text-xs font-mono text-text-secondary">{name}</span>
      <span className="text-xs font-mono text-text-muted">
        {copied ? 'Copied!' : value.startsWith('var(') ? '' : value}
      </span>
    </button>
  );
}

function isColorDark(hex: string): boolean {
  if (!hex.startsWith('#')) return false;
  const c = hex.slice(1);
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function ScaleRow({ name, scale }: { name: string; scale: Record<string, string> }) {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-heading font-semibold mb-3">{name}</h4>
      <div className="flex flex-wrap gap-4">
        {Object.entries(scale).map(([step, hex]) => (
          <Swatch key={step} name={`${step}`} value={hex} />
        ))}
      </div>
    </div>
  );
}

export function ColorsSection() {
  return (
    <section id="colors">
      <h2 className="text-2xl font-heading font-bold mb-6">Colors</h2>

      <h3 className="text-xl font-heading font-semibold mb-4 mt-8">Brand & Neutral Scales</h3>
      {Object.entries(SCALES).map(([name, scale]) => (
        <ScaleRow key={name} name={name} scale={scale} />
      ))}

      <h3 className="text-xl font-heading font-semibold mb-4 mt-8">Status Colors</h3>
      {Object.entries(STATUS).map(([name, scale]) => (
        <ScaleRow key={name} name={name} scale={scale} />
      ))}

      <h3 className="text-xl font-heading font-semibold mb-4 mt-8">Semantic Backgrounds</h3>
      <div className="flex flex-wrap gap-4 mb-8">
        {Object.entries(SEMANTIC_BG).map(([name, value]) => (
          <Swatch key={name} name={name} value={value} />
        ))}
      </div>

      <h3 className="text-xl font-heading font-semibold mb-4 mt-8">Semantic Text</h3>
      <div className="flex flex-wrap gap-4 mb-8">
        {Object.entries(SEMANTIC_TEXT).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <div
              className="w-16 h-16 rounded-lg border border-slate-200 flex items-center justify-center text-lg font-bold"
              style={{ color: value }}
            >
              Aa
            </div>
            <span className="text-xs font-mono text-text-secondary">{name}</span>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-heading font-semibold mb-4 mt-8">Glass Tokens</h3>
      <div className="flex flex-wrap gap-4 mb-8">
        {Object.entries(GLASS).map(([name, value]) => (
          <Swatch key={name} name={name} value={value} />
        ))}
      </div>

      <h3 className="text-xl font-heading font-semibold mb-4 mt-8">Signature Gradient</h3>
      <div
        className="h-20 rounded-xl w-full max-w-md"
        style={{ background: 'linear-gradient(135deg, #db2777, #2563eb)' }}
      />
      <p className="text-sm text-text-muted mt-2">
        Pink-600 → Blue-600 — used once per view maximum
      </p>
    </section>
  );
}
