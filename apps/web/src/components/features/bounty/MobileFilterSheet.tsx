'use client';

import { useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { X } from 'lucide-react';
import type { SelectPillOption } from './SelectPill';

/**
 * MobileFilterSheet — bottom sheet wrapping the reward-type and sort
 * selectors on `/bounties` mobile.
 *
 * Per the Claude Design handoff (`live-prototype.jsx` mobile frames). Uses
 * PrimeReact `<Sidebar position="bottom">` with custom rounded-top + drag
 * handle styling scoped to `.browse-mobile-sheet` (no global PR override).
 *
 * One sheet, two consumers: the parent passes `mode: 'reward' | 'sort'`
 * to control which list to render. Selecting an option closes the sheet
 * and applies the change immediately.
 */
export type MobileFilterMode = 'reward' | 'sort' | null;

interface MobileFilterSheetProps<V extends string = string> {
  mode: MobileFilterMode;
  onClose: () => void;
  options: ReadonlyArray<SelectPillOption<V>>;
  value: V;
  onSelect: (value: V) => void;
}

export function MobileFilterSheet<V extends string = string>({
  mode,
  onClose,
  options,
  value,
  onSelect,
}: MobileFilterSheetProps<V>) {
  // Lock body scroll while sheet is open (PR's default doesn't always cover this on mobile).
  useEffect(() => {
    if (mode === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

  const title = mode === 'reward' ? 'Reward type' : mode === 'sort' ? 'Sort' : '';

  return (
    <Sidebar
      visible={mode !== null}
      onHide={onClose}
      position="bottom"
      showCloseIcon={false}
      blockScroll
      dismissable
      className="browse-mobile-sheet"
      style={{
        height: 'auto',
        maxHeight: '70vh',
        background: 'var(--bg-surface)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      pt={{
        header: { style: { display: 'none' } },
        content: { style: { padding: 0 } },
      }}
    >
      {/* Drag handle */}
      <div
        aria-hidden="true"
        style={{
          width: 40,
          height: 4,
          background: 'var(--slate-200)',
          borderRadius: 9999,
          margin: '10px auto',
        }}
      />
      <div
        className="flex items-center justify-between"
        style={{ padding: '4px 16px 12px' }}
      >
        <h2
          className="font-heading text-text-primary"
          style={{ fontSize: 16, fontWeight: 700, margin: 0 }}
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer text-text-muted"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 4,
            display: 'inline-flex',
          }}
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <ul
        role="listbox"
        aria-label={title}
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '0 8px 16px',
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
                  onSelect(o.id);
                  onClose();
                }}
                className="flex items-center justify-between w-full cursor-pointer text-left"
                style={{
                  padding: '14px 12px',
                  border: 'none',
                  background: selected ? 'var(--pink-50)' : 'transparent',
                  color: selected ? 'var(--pink-700)' : 'var(--text-primary)',
                  fontWeight: selected ? 600 : 500,
                  fontSize: 15,
                  borderRadius: 8,
                  marginBottom: 2,
                }}
              >
                <span>{o.label}</span>
                {selected && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: 'var(--pink-600)',
                    }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Sidebar>
  );
}
