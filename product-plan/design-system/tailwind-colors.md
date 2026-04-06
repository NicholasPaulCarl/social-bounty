# Jester Quest Color System (M3 Tonal Tokens)

## Design Philosophy

The Jester Quest design system uses **tonal layering** instead of borders and shadows. Depth is created through subtle background color shifts between surface levels.

**Key principle:** No shadows (`box-shadow: none !important`). Depth is communicated through surface-level color hierarchy.

## Color Token Reference

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `primary` | #ec4899 (Pink) | CTAs, active states, brand accents |
| `primary-container` | #fce7f3 | Active nav items, highlight backgrounds |
| `on-primary` | #ffffff | Text on primary surfaces |
| `secondary` | #3b82f6 (Blue) | Secondary actions, links, ghost buttons |
| `secondary-container` | #dbeafe | Outlined button fills, secondary highlights |
| `on-secondary` | #ffffff | Text on secondary surfaces |
| `accent` | #f59e0b (Amber) | Rewards, points, monetary values |

### Surface Hierarchy (Tonal Layering)

| Token | Hex | Level | Usage |
|---|---|---|---|
| `background` / `surface` | #f8fafc | Base | Page background |
| `surface-container-lowest` | #ffffff | Highest | Modals, active highlights, focus states |
| `surface-container-low` | #f1f5f9 | High | Cards, panels, sidebar |
| `surface-container` | #e2e8f0 | Medium | Inputs, chips, inactive elements |
| `surface-container-high` | #cbd5e1 | Low | Secondary containers |
| `surface-container-highest` | #94a3b8 | Lowest | Muted elements |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `on-surface` | #334155 | Primary text, headings |
| `on-surface-variant` | #64748b | Secondary text, descriptions, placeholders |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `outline` | #94a3b8 | Strong borders (rarely used) |
| `outline-variant` | #e2e8f0 | Subtle dividers, separator lines |

### Feedback / Status Colors

| Token | Hex | Usage |
|---|---|---|
| `success` | #22c55e | Approved, active, healthy, live, paid |
| `success-container` | #dcfce7 | Success alert background |
| `error` | #ef4444 | Rejected, suspended, failed, destructive |
| `error-container` | #fee2e2 | Error alert background |
| `warning` | #f59e0b | Pending, paused, in review, needs info |
| `warning-container` | #fef3c7 | Warning alert background |
| `info` | #3b82f6 | Submitted, informational |
| `info-container` | #dbeafe | Info alert background |

## Usage Examples (Jester Quest Patterns)

```
Primary button:     bg-primary text-on-primary rounded-full hover:opacity-90 active:scale-95
Outlined button:    bg-secondary-container text-secondary rounded-full
Ghost button:       text-secondary hover:bg-secondary-container rounded-full
Card:               bg-surface-container-low rounded-xl (no border, no shadow)
Input:              bg-surface-container border-none rounded-2xl focus:ring-2 focus:ring-primary/20
Active chip:        bg-primary text-on-primary text-xs px-4 py-2 rounded-full font-bold
Inactive chip:      bg-surface-container text-on-surface-variant text-xs px-4 py-2 rounded-full
Success alert:      bg-success-container p-4 rounded-2xl
Error alert:        bg-error-container p-4 rounded-2xl
Nav bar:            bg-white/80 backdrop-blur-xl
Label:              text-xs font-bold uppercase tracking-widest text-primary
```

## Status Color Mapping (Consistent Across Sections)

- **Active / Approved / Healthy / Live / Paid:** `success` / `success-container`
- **Suspended / Rejected / Down / Error / Failed:** `error` / `error-container`
- **Paused / Pending / In Review / Warning / Needs Info:** `warning` / `warning-container`
- **Submitted / Info:** `info` / `info-container`
- **Draft / Inactive / Closed / Not Paid:** `surface-container` / `on-surface-variant`
