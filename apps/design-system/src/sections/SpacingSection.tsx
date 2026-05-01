export function SpacingSection() {
  const spacingScale = [
    { name: '0', px: '0' },
    { name: '1', px: '4px' },
    { name: '2', px: '8px' },
    { name: '3', px: '12px' },
    { name: '4', px: '16px' },
    { name: '5', px: '20px' },
    { name: '6', px: '24px' },
    { name: '8', px: '32px' },
    { name: '10', px: '40px' },
    { name: '12', px: '48px' },
    { name: '16', px: '64px' },
    { name: '20', px: '80px' },
    { name: '24', px: '96px' },
  ];

  const radii = [
    { name: 'sm', value: '4px' },
    { name: 'DEFAULT / md', value: '8px' },
    { name: 'lg', value: '12px' },
    { name: 'xl', value: '16px' },
    { name: '2xl', value: '20px' },
    { name: '3xl', value: '24px' },
    { name: 'full', value: '9999px' },
  ];

  const shadows = [
    { name: 'level-0', desc: 'None', cls: 'shadow-level-0' },
    { name: 'level-1', desc: 'Subtle', cls: 'shadow-level-1' },
    { name: 'level-2', desc: 'Card', cls: 'shadow-level-2' },
    { name: 'level-3', desc: 'Dropdown', cls: 'shadow-level-3' },
    { name: 'level-4', desc: 'Modal', cls: 'shadow-level-4' },
    { name: 'glow-brand', desc: 'Pink glow', cls: 'shadow-glow-brand' },
    { name: 'glow-brand-intense', desc: 'Intense pink', cls: 'shadow-glow-brand-intense' },
    { name: 'glow-blue', desc: 'Blue glow', cls: 'shadow-glow-blue' },
  ];

  return (
    <section id="spacing">
      <h2 className="text-2xl font-heading font-bold mb-6">Spacing, Radii & Shadows</h2>

      {/* Spacing */}
      <h3 className="text-xl font-heading font-semibold mb-4">Spacing Scale (4px grid)</h3>
      <div className="card p-6 mb-10">
        <div className="space-y-2">
          {spacingScale.map(({ name, px }) => (
            <div key={name} className="flex items-center gap-4">
              <span className="text-xs font-mono text-text-muted w-12 text-right shrink-0">
                {name}
              </span>
              <div
                className="h-4 rounded-sm"
                style={{
                  width: px === '0' ? '2px' : px,
                  background: 'var(--pink-600)',
                  minWidth: px === '0' ? '2px' : undefined,
                }}
              />
              <span className="text-xs text-text-muted">{px}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <h3 className="text-xl font-heading font-semibold mb-4">Border Radius</h3>
      <div className="flex flex-wrap gap-6 mb-10">
        {radii.map(({ name, value }) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 bg-pink-100 border-2 border-pink-400"
              style={{ borderRadius: value }}
            />
            <span className="text-xs font-mono font-semibold">{name}</span>
            <span className="text-xs text-text-muted">{value}</span>
          </div>
        ))}
      </div>

      {/* Shadows */}
      <h3 className="text-xl font-heading font-semibold mb-4">Shadow / Elevation</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {shadows.map(({ name, desc, cls }) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div className={`w-24 h-24 rounded-xl bg-white ${cls}`} />
            <span className="text-xs font-mono font-semibold">{name}</span>
            <span className="text-xs text-text-muted">{desc}</span>
          </div>
        ))}
      </div>

      {/* Motion */}
      <h3 className="text-xl font-heading font-semibold mb-4">Motion Tokens</h3>
      <div className="card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="eyebrow mb-3">Duration</p>
            {[
              ['fast', '150ms'],
              ['normal', '250ms'],
              ['slow', '400ms'],
              ['dramatic', '600ms'],
            ].map(([name, val]) => (
              <div key={name} className="flex justify-between py-1 text-sm">
                <span className="font-mono">{name}</span>
                <span className="text-text-muted">{val}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="eyebrow mb-3">Easing</p>
            {[
              ['standard', '0.4, 0, 0.2, 1'],
              ['decelerate', '0, 0, 0.2, 1'],
              ['accelerate', '0.4, 0, 1, 1'],
              ['spring', '0.34, 1.56, 0.64, 1'],
            ].map(([name, val]) => (
              <div key={name} className="flex justify-between py-1 text-sm">
                <span className="font-mono">{name}</span>
                <span className="text-text-muted text-xs">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
