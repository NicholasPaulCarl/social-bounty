# Typography & Icons Configuration

## Google Fonts

### Text Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Icon Font (Material Symbols Outlined)

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

## Font Usage

| Role | Font | Weights | Tailwind Class | Usage |
|---|---|---|---|---|
| **Headlines** | Space Grotesk | 300-700 | `font-headline` | Page titles, section headings, stat numbers, nav labels, brand text |
| **Body / Labels** | Inter | 300-600 | `font-body` / `font-label` | Paragraphs, form fields, descriptions, labels, button text |
| **Monospace** | Source Code Pro | 400-700 | `font-mono` | IDs, currency amounts, timestamps (legacy, minimal use) |

## Headline Patterns

- **Display Large:** `text-6xl md:text-8xl font-bold tracking-tighter font-headline`
- **Page Title:** `text-3xl font-bold tracking-tight font-headline`
- **Section Title:** `text-xl font-bold font-headline`
- **Card Title:** `text-lg font-bold font-headline`

## Body Patterns

- **Primary text:** `text-on-surface` (inherits Inter from body)
- **Secondary text:** `text-on-surface-variant`
- **Label text:** `text-xs font-bold uppercase tracking-widest` (for section labels)

## Icon Usage

### Material Symbols (Primary)

```html
<span class="material-symbols-outlined">icon_name</span>
```

- Default: outlined style, weight 400, no fill
- Filled variant: `style={{ fontVariationSettings: "'FILL' 1" }}`
- Size control via `style={{ fontSize: '20px' }}` or wrapper sizing
- Used in: StatusBadge, EmptyState, ErrorState, SectionPanel, AppSidebar, AppHeader

### PrimeIcons (Legacy / PrimeReact Integration)

```html
<i class="pi pi-icon-name" />
```

- Used where PrimeReact components require `icon` prop
- Used in: Button icons, Menu items, BreadCrumb home icon

## CSS Setup

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

body {
  font-family: 'Inter', var(--font-body), sans-serif;
}

h1, h2, h3, h4 {
  font-family: 'Space Grotesk', var(--font-heading), sans-serif;
}
```
