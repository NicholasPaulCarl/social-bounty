'use client';

/**
 * AdditionalRulesGroup
 *
 * Pure-presentational component rendering 4 fixed compliance/behaviour rules
 * for the bounty wizard (Step 2 — Instructions & Metrics).
 *
 * Required rules (FTC disclosure + no-competitor) are displayed checked and
 * disabled — they are always implied and NEVER appear in the `selectedIds`
 * prop or `onChange` payload.  Optional rules (exclusivity window + raw-asset
 * share) are controlled by the parent via `selectedIds` / `onChange`.
 *
 * No PrimeReact dependency — native <input type="checkbox"> keeps the DS
 * `.checkbox` / `.checkbox-box` token rendering crisp without PrimeReact
 * styling bleed.
 *
 * The ADDITIONAL_RULES constant lives in `./additional-rules-data.ts` so the
 * node-only jest harness can import it without pulling in React.
 */

export { ADDITIONAL_RULES } from './additional-rules-data';
import { ADDITIONAL_RULES } from './additional-rules-data';

export interface AdditionalRulesGroupProps {
  /** IDs of currently selected OPTIONAL rules. Required-rule IDs are always implied. */
  selectedIds: string[];
  /** Called with the new array of selected OPTIONAL rule IDs when the user toggles. */
  onChange: (ids: string[]) => void;
}

export function AdditionalRulesGroup({
  selectedIds,
  onChange,
}: AdditionalRulesGroupProps): JSX.Element {
  function handleChange(id: string, checked: boolean) {
    if (checked) {
      onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((x) => x !== id));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Section eyebrow */}
      <div style={{ marginBottom: 4 }}>
        <span
          className="text-text-primary"
          style={{ fontSize: 13, fontWeight: 600, display: 'block' }}
        >
          Additional rules
        </span>
        <span
          className="text-text-muted"
          style={{ fontSize: 12, display: 'block', marginTop: 2 }}
        >
          Some rules are required by law. Others are optional but recommended.
        </span>
      </div>

      {/* Rule rows */}
      {ADDITIONAL_RULES.map((rule) => {
        const isChecked = rule.required || selectedIds.includes(rule.id);

        return (
          <label
            key={rule.id}
            className="checkbox"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              cursor: rule.required ? 'default' : 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={rule.required}
              onChange={(e) => {
                if (rule.required) return;
                handleChange(rule.id, e.target.checked);
              }}
            />
            <span className="checkbox-box" />
            <span style={{ fontSize: 14 }} className="text-text-primary">
              {rule.label}
              {rule.required && (
                <span
                  className="text-text-muted"
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Required by law
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
