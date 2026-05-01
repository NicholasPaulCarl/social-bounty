export function TypographySection() {
  return (
    <section id="typography">
      <h2 className="text-2xl font-heading font-bold mb-6">Typography</h2>

      {/* Font families */}
      <h3 className="text-xl font-heading font-semibold mb-4">Font Families</h3>
      <div className="grid gap-6 mb-10">
        <div className="card p-6">
          <p className="eyebrow mb-2">Headings</p>
          <p className="font-heading text-3xl font-bold">Space Grotesk</p>
          <p className="text-sm text-text-muted mt-1">var(--font-heading)</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Body</p>
          <p className="font-body text-3xl">Inter</p>
          <p className="text-sm text-text-muted mt-1">var(--font-body)</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Monospace</p>
          <p className="font-mono text-3xl">JetBrains Mono</p>
          <p className="text-sm text-text-muted mt-1">var(--font-mono)</p>
        </div>
      </div>

      {/* Heading scale */}
      <h3 className="text-xl font-heading font-semibold mb-4">Heading Scale</h3>
      <div className="card p-6 mb-10 space-y-6">
        <div>
          <span className="label-sm text-text-muted">h1</span>
          <h1>Page Title</h1>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">h2</span>
          <h2>Section Heading</h2>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">h3</span>
          <h3>Sub-section</h3>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">h4</span>
          <h4>Group Title</h4>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">h5</span>
          <h5>Minor Heading</h5>
        </div>
      </div>

      {/* Body text */}
      <h3 className="text-xl font-heading font-semibold mb-4">Body Text</h3>
      <div className="card p-6 mb-10 space-y-4">
        <div>
          <span className="label-sm text-text-muted">.body-lg</span>
          <p className="body-lg">
            Large body text for introductions and lead paragraphs. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">.body</span>
          <p className="body">
            Standard body text for most content. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">.body-sm</span>
          <p className="body-sm">
            Small body text for supporting information. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>

      {/* Special styles */}
      <h3 className="text-xl font-heading font-semibold mb-4">Special Styles</h3>
      <div className="card p-6 mb-10 space-y-4">
        <div>
          <span className="label-sm text-text-muted">.eyebrow</span>
          <p className="eyebrow">Eyebrow label text</p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">.label-sm</span>
          <p className="label-sm">Small label text</p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">label</span>
          <label>Form Label</label>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">.metric</span>
          <p className="metric">R 12,345.67</p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">.gradient-text</span>
          <p className="gradient-text text-4xl font-heading font-bold">Gradient headline</p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">code / .mono</span>
          <p>
            Inline <code>code snippet</code> and <span className="mono">monospaced text</span>
          </p>
        </div>
        <div className="divider" />
        <div>
          <span className="label-sm text-text-muted">.link</span>
          <p>
            Standard <a href="#" className="link">hyperlink style</a> for navigation
          </p>
        </div>
      </div>

      {/* Type scale reference */}
      <h3 className="text-xl font-heading font-semibold mb-4">Type Scale (Tailwind)</h3>
      <div className="card p-6 space-y-3">
        {([
          ['xs', '0.75rem / 1rem'],
          ['sm', '0.875rem / 1.25rem'],
          ['base', '1rem / 1.5rem'],
          ['lg', '1.125rem / 1.75rem'],
          ['xl', '1.25rem / 1.75rem'],
          ['2xl', '1.5rem / 2rem'],
          ['3xl', '1.875rem / 2.25rem'],
          ['4xl', '2.25rem / 2.5rem'],
          ['5xl', '3rem / 3rem'],
          ['6xl', '3.75rem / 3.75rem'],
        ] as const).map(([name, spec]) => (
          <div key={name} className="flex items-baseline gap-4">
            <span className="text-xs font-mono text-text-muted w-16 shrink-0">{name}</span>
            <span className={`text-${name} font-body`}>The quick brown fox</span>
            <span className="text-xs text-text-muted ml-auto shrink-0">{spec}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
