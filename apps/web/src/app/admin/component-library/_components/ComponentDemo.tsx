'use client';

import { PropsTable, type PropDefinition } from './PropsTable';
import { CodeBlock } from './CodeBlock';

interface ComponentDemoProps {
  name: string;
  description: string;
  importPath: string;
  code: string;
  props?: PropDefinition[];
  children: React.ReactNode;
}

export function ComponentDemo({ name, description, importPath, code, props, children }: ComponentDemoProps) {
  const anchorId = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div id={anchorId} className="mb-12 scroll-mt-24">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">{name}</h3>
      <p className="text-sm text-text-secondary mb-1">{description}</p>
      <p className="text-xs text-text-muted font-mono mb-4">{importPath}</p>

      <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Preview</p>
      <div className="glass-card p-6 mb-4">{children}</div>

      {props && props.length > 0 && (
        <>
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Props</p>
          <PropsTable props={props} />
        </>
      )}

      <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Usage</p>
      <CodeBlock code={code} />
    </div>
  );
}
