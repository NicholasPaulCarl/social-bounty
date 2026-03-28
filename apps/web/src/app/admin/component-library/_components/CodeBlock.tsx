'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'TSX' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-void border border-glass-border rounded-lg overflow-hidden mb-6">
      <div className="flex justify-between items-center px-4 py-2 border-b border-glass-border bg-surface/50">
        <span className="text-xs text-text-muted font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-white/5"
        >
          <i className={`pi ${copied ? 'pi-check text-accent-emerald' : 'pi-copy'} text-xs`} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="font-mono text-sm text-text-secondary whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
