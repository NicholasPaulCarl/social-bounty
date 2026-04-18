# Iconography — PrimeIcons → Lucide migration cheat sheet

The canonical design system uses **Lucide only** (per `README.md` § Iconography). All icons render at **20px (default) or 24px (hero/section)**, with **`stroke-width: 2`** and **`stroke: currentColor`** so they pick up the surrounding text color.

This file enumerates every `pi-*` PrimeIcon currently in the codebase (93 distinct names as of 2026-04-18) and its canonical Lucide replacement. Use these mappings exactly so the three parallel agents converge on the same names.

## Wiring

```tsx
// Import from lucide-react. Tree-shakes per-icon.
import { Check, Wallet, Users, AlertTriangle } from 'lucide-react';

// Default: 20px, stroke-width 2, currentColor.
<Check size={20} strokeWidth={2} />

// Hero / section header: 24px.
<Wallet size={24} strokeWidth={2} className="text-pink-600" />

// Loading / spin state: Loader2 + animate-spin.
<Loader2 size={20} strokeWidth={2} className="animate-spin" />

// Inside a PrimeReact <Button icon=...>:
//   The icon prop accepts ReactNode in PrimeReact 10.
<Button icon={<Check size={18} strokeWidth={2} />} label="Approve" />
//   …or just use the new .btn class from components.css and inline the icon.
```

## Mapping table

### Navigation & arrows

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-angle-left` | `ChevronLeft` | PrimeReact's "angle" is Lucide's "chevron" |
| `pi-angle-right` | `ChevronRight` | |
| `pi-arrow-down` | `ArrowDown` | |
| `pi-arrow-left` | `ArrowLeft` | |
| `pi-arrow-right` | `ArrowRight` | |
| `pi-arrow-up` | `ArrowUp` | |
| `pi-arrow-up-right` | `ArrowUpRight` | "Open in new", external nav |
| `pi-chevron-down` | `ChevronDown` | |
| `pi-chevron-left` | `ChevronLeft` | |
| `pi-chevron-right` | `ChevronRight` | |
| `pi-chevron-up` | `ChevronUp` | |
| `pi-bars` | `Menu` | Hamburger menu |

### Actions

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-check` | `Check` | Bare checkmark |
| `pi-check-circle` | `CheckCircle2` | The filled-style circle-with-check |
| `pi-check-square` | `CheckSquare` | Checkbox confirmed state |
| `pi-times` | `X` | Bare X / close |
| `pi-times-circle` | `XCircle` | Filled circle-with-X (errors) |
| `pi-plus` | `Plus` | |
| `pi-minus` | `Minus` | |
| `pi-minus-circle` | `MinusCircle` | |
| `pi-circle` | `Circle` | Empty circle |
| `pi-circle-fill` | `Circle` + `fill="currentColor"` | Lucide doesn't have separate fill variant — set fill on the SVG |
| `pi-pencil` | `Pencil` | Edit |
| `pi-trash` | `Trash2` | Delete (Trash2 is Lucide's standard, not Trash) |
| `pi-save` | `Save` | |
| `pi-refresh` | `RefreshCw` | |
| `pi-sync` | `RefreshCw` | Same shape; PrimeIcons distinguishes, Lucide doesn't |
| `pi-undo` | `Undo2` | Or `RotateCcw` if it's a "back" semantic |
| `pi-search` | `Search` | |
| `pi-filter-slash` | `FilterX` | "Clear filters" |
| `pi-download` | `Download` | |
| `pi-upload` | `Upload` | |
| `pi-send` | `Send` | |
| `pi-link` | `Link2` | Link2 looks more like a chain link than the bare `Link` |
| `pi-external-link` | `ExternalLink` | |
| `pi-paperclip` | `Paperclip` | |
| `pi-eye` | `Eye` | |
| `pi-eye-slash` | `EyeOff` | |
| `pi-pause` | `Pause` | |
| `pi-play` | `Play` | |
| `pi-bolt` | `Zap` | |
| `pi-list` | `List` | |
| `pi-th-large` | `LayoutGrid` | Grid view toggle |

### Status & feedback

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-info-circle` | `Info` | |
| `pi-exclamation-triangle` | `AlertTriangle` | Warning |
| `pi-exclamation-circle` | `AlertCircle` | |
| `pi-ban` | `Ban` | |
| `pi-shield` | `Shield` | Generic; use `ShieldCheck` for "verified-by-shield" if appropriate |
| `pi-clock` | `Clock` | |
| `pi-history` | `History` | |
| `pi-hourglass` | `Hourglass` | |
| `pi-flag` | `Flag` | |
| `pi-verified` | `BadgeCheck` | The verified-tick-in-badge motif |
| `pi-prime` | `Crown` | PrimeReact's "prime" mark — use `Crown` to keep the "premium" semantic |

### People & auth

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-user` | `User` | |
| `pi-users` | `Users` | |
| `pi-user-plus` | `UserPlus` | |
| `pi-id-card` | `IdCard` | |
| `pi-sign-in` | `LogIn` | |
| `pi-sign-out` | `LogOut` | |
| `pi-lock` | `Lock` | |
| `pi-at` | `AtSign` | |

### Communication

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-bell` | `Bell` | |
| `pi-comments` | `MessageSquare` | Use `MessagesSquare` for plural-thread feel |
| `pi-envelope` | `Mail` | |
| `pi-inbox` | `Inbox` | |

### Money & commerce

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-dollar` | `DollarSign` | |
| `pi-credit-card` | `CreditCard` | |
| `pi-wallet` | `Wallet` | |
| `pi-money-bill` | `Banknote` | |
| `pi-gift` | `Gift` | |
| `pi-star` | `Star` | |
| `pi-star-fill` | `Star` + `fill="currentColor"` | |
| `pi-chart-bar` | `BarChart3` | The newest variant; the bare `BarChart` is older |

### Files & data

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-file` | `File` | |
| `pi-file-edit` | `FilePen` | |
| `pi-file-import` | `FileInput` | |
| `pi-folder-open` | `FolderOpen` | |
| `pi-database` | `Database` | |
| `pi-server` | `Server` | |
| `pi-sitemap` | `Network` | Lucide's `Network` is the closest hierarchy/tree icon |
| `pi-box` | `Box` | |

### Layout & system

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-home` | `Home` | |
| `pi-cog` | `Settings` | "Cog" is "Settings" in Lucide convention |
| `pi-wrench` | `Wrench` | |
| `pi-palette` | `Palette` | |
| `pi-globe` | `Globe` | |
| `pi-megaphone` | `Megaphone` | |
| `pi-building` | `Building2` | The newer Lucide variant; `Building` is the older |
| `pi-calendar` | `Calendar` | |

### Loading

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-spinner` | `Loader2` + `className="animate-spin"` | `Loader2` is the dashed-circle that spins cleanly |
| `pi-spin` | `Loader2` + `className="animate-spin"` | Same |

### Social brand marks

PrimeIcons ships brand glyphs. Lucide's policy is "no brand logos beyond a small set". Lucide 1.8.0
does NOT include Facebook, Instagram, or Twitter (removed per trademark policy). Use neutral
semantic stand-ins until the brand-icon commission lands.

| PrimeIcon | Lucide | Notes |
|---|---|---|
| `pi-facebook` | `ThumbsUp` | Neutral stand-in. Replace with commissioned glyph when available. |
| `pi-instagram` | `Camera` | Neutral stand-in. Replace with commissioned glyph when available. |
| `pi-twitter` / `pi-x` | `Globe` | X/Twitter — use `Globe` for generic link-out, or omit the icon. |
| `pi-tiktok` | `Music2` | Placeholder only. Same deferred commission applies. |

## Patterns

### Inside PrimeReact `<Button icon=...>`

```tsx
import { Check } from 'lucide-react';
import { Button } from 'primereact/button';

<Button icon={<Check size={18} strokeWidth={2} />} label="Approve" />
```

### Inside the new `.btn` class (from `components.css`)

```tsx
import { Send } from 'lucide-react';

<button className="btn btn-primary">
  <Send size={16} strokeWidth={2} /> Send
</button>
```

The DS's `.btn svg { width: 1rem; height: 1rem; flex: none; }` rule sizes them automatically inside `.btn`; you can omit the `size=` prop in that context.

### Status badges

```tsx
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

<span className="badge badge-success">
  <CheckCircle2 size={14} strokeWidth={2} /> Verified
</span>
```

### Loading states

```tsx
import { Loader2 } from 'lucide-react';

<Loader2 size={20} strokeWidth={2} className="animate-spin text-pink-600" />
```

## Don't

- Don't size below 16px or above 32px without a specific reason. The DS spec is 20-24px.
- Don't recolor icons outside `currentColor`. Pick the parent's text color and the icon inherits.
- Don't stack two icons of different stroke weights in the same surface — every icon on the page should be `strokeWidth={2}`.
- Don't reach for a non-Lucide icon library because Lucide doesn't have something. Prefer `Crown` over a non-Lucide "premium" badge. The exception is brand glyphs Lucide explicitly excludes (TikTok) — use inline SVG for those.
