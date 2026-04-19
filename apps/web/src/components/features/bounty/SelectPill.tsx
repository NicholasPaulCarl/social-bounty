'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * SelectPill — compact inline label-value picker for the desktop FilterBar.
 *
 * Per the Claude Design handoff (`page-chrome.jsx:264-286`). Renders as
 * `Label: Value ▾`. Opens a small popover menu on click; keyboard:
 * Enter/Space toggles, Escape closes, click-outside closes.
 *
 * Bespoke (vs. PrimeReact Dropdown) because the design's pill carries the
 * label inline with the value — PR's Dropdown trigger is a single value
 * cell. We get a smaller surface + accurate visual + the exact a11y we
 * need.
 */

export interface SelectPillOption<V extends string = string> {
  id: V;
  label: string;
}

interface SelectPillProps<V extends string = string> {
  label: string;
  value: V;
  options: ReadonlyArray<SelectPillOption<V>>;
  onChange: (value: V) => void;
}

export function SelectPill<V extends string = string>({
  label,
  value,
  options,
  onChange,
}: SelectPillProps<V>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.label}`}
        className="inline-flex items-center cursor-pointer bg-surface text-text-primary"
        style={{
          gap: 8,
          padding: '0 12px',
          border: '1px solid var(--slate-200)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          height: 38,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span className="text-text-muted" style={{ fontSize: 12 }}>
          {label}:
        </span>
        <span>{current.label}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-30 bg-surface"
          style={{
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            border: '1px solid var(--slate-200)',
            borderRadius: 8,
            padding: 4,
            boxShadow: 'var(--shadow-level-1)',
            margin: 0,
            listStyle: 'none',
          }}
        >
          {options.map((o) => {
            const selected = o.id === value;
            return (
              <li key={o.id} style={{ margin: 0 }}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className="w-full text-left cursor-pointer"
                  style={{
                    padding: '8px 12px',
                    background: selected ? 'var(--pink-50)' : 'transparent',
                    color: selected ? 'var(--pink-700)' : 'var(--text-primary)',
                    fontWeight: selected ? 600 : 500,
                    fontSize: 13,
                    borderRadius: 6,
                    border: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
