/**
 * Thin viewer-facing bridge to the generated module.
 *
 * The canonical wrapper layer lives in
 * `apps/web/src/styles/design-system/components.jsx`. This file stays tiny so
 * the Vite viewer always reuses the generated module derived from that source.
 */
export * from './components.generated';
