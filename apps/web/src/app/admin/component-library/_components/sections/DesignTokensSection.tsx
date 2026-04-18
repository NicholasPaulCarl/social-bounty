'use client';

const COLOR_GROUPS = [
  {
    label: 'Brand Primary',
    colors: [
      { name: 'primary-400', hex: '#f472b6', className: 'bg-[#f472b6]' },
      { name: 'primary-500', hex: '#ec4899', className: 'bg-[#ec4899]' },
      { name: 'primary-600', hex: '#db2777', className: 'bg-[#db2777]' },
      { name: 'primary-700', hex: '#be185d', className: 'bg-[#be185d]' },
    ],
  },
  {
    label: 'Background Layers',
    colors: [
      { name: 'Void', hex: '#ffffff', className: 'bg-void' },
      { name: 'Abyss', hex: '#f8fafc', className: 'bg-abyss' },
      { name: 'Surface', hex: '#ffffff', className: 'bg-surface' },
      { name: 'Elevated', hex: '#f1f5f9', className: 'bg-elevated' },
      { name: 'Hover', hex: '#e2e8f0', className: 'bg-hover' },
    ],
  },
  {
    label: 'Accents',
    colors: [
      { name: 'Primary (Pink)', hex: '#db2777', className: 'bg-pink-600' },
      { name: 'Secondary (Blue)', hex: '#2563eb', className: 'bg-blue-600' },
      { name: 'Amber', hex: '#d97706', className: 'bg-warning-600' },
      { name: 'Emerald', hex: '#059669', className: 'bg-success-600' },
      { name: 'Rose', hex: '#e11d48', className: 'bg-danger-600' },
      { name: 'Blue', hex: '#2563eb', className: 'bg-blue-600' },
    ],
  },
  {
    label: 'Text',
    colors: [
      { name: 'Primary', hex: '#0f172a', className: 'bg-[#0f172a]' },
      { name: 'Secondary', hex: '#475569', className: 'bg-[#475569]' },
      { name: 'Muted', hex: '#94a3b8', className: 'bg-[#94a3b8]' },
    ],
  },
];

export default function DesignTokensSection() {
  return (
    <div className="space-y-10">
      {/* Colors */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-6">Colors</h3>
        {COLOR_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3">
              {group.label}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {group.colors.map((c) => (
                <div key={c.name} className="text-center">
                  <div
                    className={`${c.className} w-full h-16 rounded-lg border border-glass-border`}
                  />
                  <p className="text-xs text-text-primary mt-1.5 font-medium">{c.name}</p>
                  <p className="text-xs text-text-muted font-mono">{c.hex}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Typography */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Typography</h3>
        <div className="glass-card p-6 space-y-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Heading — Space Grotesk
            </p>
            <p className="font-heading text-3xl font-bold text-text-primary">The quick brown fox</p>
            <p className="font-heading text-xl font-semibold text-text-primary">
              Heading 2 — 20px semibold
            </p>
            <p className="font-heading text-lg font-semibold text-text-primary">
              Heading 3 — 18px semibold
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Body — Inter</p>
            <p className="text-base text-text-primary">Body text at 16px — primary color</p>
            <p className="text-sm text-text-secondary">Body small at 14px — secondary color</p>
            <p className="text-xs text-text-muted">Caption at 12px — muted color</p>
          </div>
        </div>
      </div>

      {/* Glass Utilities */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
          Glass Utilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted font-mono mb-2">.glass-card</p>
            <div className="glass-card p-6">
              <p className="text-sm text-text-secondary">
                Frosted glass card with border and backdrop blur.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted font-mono mb-2">.glass-panel</p>
            <div className="glass-panel p-6">
              <p className="text-sm text-text-secondary">
                Subtle glass panel for nested containers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shadows */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Shadows</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['shadow-level-1', 'shadow-level-2', 'shadow-level-3', 'shadow-level-4', 'shadow-glow-brand'].map(
            (cls) => (
              <div key={cls} className={`${cls} bg-surface rounded-lg p-6 border border-glass-border`}>
                <p className="text-xs text-text-muted font-mono">.{cls}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
