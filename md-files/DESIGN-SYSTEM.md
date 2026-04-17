# NeoGlass Design System

**Version:** 1.0.0
**Platform:** Social Bounty
**Last Updated:** 2026-03-27

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Glassmorphism Components](#5-glassmorphism-components)
6. [Elevation & Shadows](#6-elevation--shadows)
7. [Motion & Animation](#7-motion--animation)
8. [Component Patterns](#8-component-patterns)
9. [Gradient Mesh Backgrounds](#9-gradient-mesh-backgrounds)
10. [Responsive Breakpoints](#10-responsive-breakpoints)
11. [Accessibility in Dark Mode](#11-accessibility-in-dark-mode)
12. [Light Mode Variant](#12-light-mode-variant)
13. [PrimeReact Theme Overrides](#13-primereact-theme-overrides)
14. [Tailwind Configuration](#14-tailwind-configuration)

---

## 1. Design Philosophy

**NeoGlass** is the design language of Social Bounty. It draws from the visual vocabulary of 2030-era interfaces: deep voids of color punctuated by luminous accents, layered glass surfaces that convey hierarchy through translucency, and motion that feels alive without being distracting.

NeoGlass is not decoration. Every glow, every blur, every gradient shift carries meaning. The system is built to make data-dense bounty management feel calm, legible, and precise.

### Core Principles

| Principle | Description |
|---|---|
| **Dark Canvas** | The interface rests on a deep, near-black foundation. Darkness is not absence --- it is the stage. Content emerges from it. Backgrounds use blues so deep they read as black, lending depth without flatness. |
| **Luminous Accents** | Color is used sparingly and with intention. Accents glow. They guide the eye, signal state, and communicate urgency. A cyan link on a void background does not just sit there --- it radiates. |
| **Glass Depth** | Surfaces are not opaque cards stacked on flat backgrounds. They are translucent panes with blur, catching light at their edges. Hierarchy is communicated through layers of glass: the deeper the layer, the more transparent and blurred. |
| **Purposeful Motion** | Nothing moves without reason. Hover states lift. Loading states breathe. Transitions ease the eye between states rather than snapping. Motion is fast enough to feel responsive, slow enough to be perceived. |
| **Breathing Space** | Dense data needs room. Generous padding, considered line heights, and whitespace (or rather, darkspace) give each element the air it needs to be read and understood. |

### Design DNA

```
Dark         + Glass         + Glow          = NeoGlass
(the void)   (the surface)   (the signal)
```

---

## 2. Color System

### 2.1 Dark Palette (Primary Backgrounds)

These are the foundational layers of every screen. They move from absolute depth (`bg-void`) to slightly elevated surfaces (`bg-hover`).

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `bg-void` | `#030712` | `rgb(3, 7, 18)` | Deepest background. Used behind everything: the canvas of the universe. |
| `bg-abyss` | `#0a0f1e` | `rgb(10, 15, 30)` | Page-level background. The default `<body>` color. |
| `bg-surface` | `#111827` | `rgb(17, 24, 39)` | Card and panel backgrounds. The primary "resting" surface. |
| `bg-elevated` | `#1f2937` | `rgb(31, 41, 55)` | Elevated elements: popovers, dropdown menus, secondary panels. |
| `bg-hover` | `#374151` | `rgb(55, 65, 81)` | Hover states on dark backgrounds. Interactive feedback. |

**Gradient between layers:**

```css
/* Subtle page gradient (top to bottom) */
background: linear-gradient(180deg, #030712 0%, #0a0f1e 100%);
```

### 2.2 Accent Colors (Luminous / Neon)

Accents are the lifeblood of NeoGlass. They are vibrant, saturated, and designed to pop against the dark canvas. Each accent has a designated semantic role.

| Token | Hex | Role | Where Used |
|---|---|---|---|
| `accent-cyan` | `#06b6d4` | **Primary action** | Links, primary buttons, active navigation, focus rings |
| `accent-violet` | `#8b5cf6` | **Secondary action** | Badges, tags, secondary interactive elements |
| `accent-amber` | `#f59e0b` | **Warning** | Warning alerts, bounty expiration, attention needed |
| `accent-emerald` | `#10b981` | **Success** | Approved states, completion, positive trends |
| `accent-rose` | `#f43f5e` | **Danger** | Rejected states, destructive actions, negative trends |
| `accent-blue` | `#3b82f6` | **Informational** | In-progress states, informational badges, neutral highlights |

### 2.3 Glow Variants

Every accent has a corresponding glow. Glows are achieved via `box-shadow` and are used on hover, focus, and active states to create the signature NeoGlass luminance.

| Token | CSS Value | Usage |
|---|---|---|
| `glow-cyan` | `0 0 20px rgba(6, 182, 212, 0.3)` | Primary button hover, active nav items |
| `glow-violet` | `0 0 20px rgba(139, 92, 246, 0.3)` | Badge hover, secondary actions |
| `glow-amber` | `0 0 20px rgba(245, 158, 11, 0.3)` | Warning emphasis |
| `glow-emerald` | `0 0 20px rgba(16, 185, 129, 0.3)` | Success confirmation |
| `glow-rose` | `0 0 20px rgba(244, 63, 94, 0.3)` | Danger emphasis |
| `glow-blue` | `0 0 20px rgba(59, 130, 246, 0.3)` | Info/progress emphasis |

**Intense glow (for hero elements, special emphasis):**

```css
/* Double-layer glow for maximum luminance */
box-shadow:
  0 0 20px rgba(6, 182, 212, 0.3),
  0 0 60px rgba(6, 182, 212, 0.1);
```

### 2.4 Text Colors

| Token | Hex | Contrast on `bg-abyss` | Usage |
|---|---|---|---|
| `text-primary` | `#f1f5f9` | 15.4:1 | Headings, primary content, important values |
| `text-secondary` | `#94a3b8` | 7.0:1 | Body text, descriptions, secondary information |
| `text-muted` | `#64748b` | 4.6:1 | Labels, placeholders, metadata, timestamps |
| `text-disabled` | `#475569` | 3.1:1 | Disabled states (large text only, or with icons) |

### 2.5 Glass Colors

These semi-transparent values create the signature frosted-glass look of NeoGlass.

| Token | Value | Usage |
|---|---|---|
| `glass-bg` | `rgba(255, 255, 255, 0.05)` | Default glass panel fill |
| `glass-border` | `rgba(255, 255, 255, 0.10)` | Glass panel borders --- subtle edge catch |
| `glass-hover` | `rgba(255, 255, 255, 0.08)` | Glass surface on hover |
| `glass-active` | `rgba(255, 255, 255, 0.12)` | Glass surface when pressed/active |
| `glass-overlay` | `rgba(0, 0, 0, 0.60)` | Modal/dialog backdrop |

### 2.6 Semantic Color Map

For use in status systems, alerts, and data visualization:

| Semantic | Background | Text | Border | Glow |
|---|---|---|---|---|
| Success | `rgba(16, 185, 129, 0.1)` | `#34d399` | `rgba(16, 185, 129, 0.3)` | `glow-emerald` |
| Warning | `rgba(245, 158, 11, 0.1)` | `#fbbf24` | `rgba(245, 158, 11, 0.3)` | `glow-amber` |
| Danger | `rgba(244, 63, 94, 0.1)` | `#fb7185` | `rgba(244, 63, 94, 0.3)` | `glow-rose` |
| Info | `rgba(59, 130, 246, 0.1)` | `#60a5fa` | `rgba(59, 130, 246, 0.3)` | `glow-blue` |

---

## 3. Typography

### 3.1 Font Stack

| Role | Family | Weights | Fallback |
|---|---|---|---|
| **Headings** | `Space Grotesk` | 500 (Medium), 600 (SemiBold), 700 (Bold) | `system-ui, -apple-system, sans-serif` |
| **Body** | `Inter` | 400 (Regular), 500 (Medium), 600 (SemiBold) | `system-ui, -apple-system, sans-serif` |
| **Monospace** | `JetBrains Mono` | 400 (Regular), 500 (Medium) | `ui-monospace, 'Cascadia Code', monospace` |

**Google Fonts import:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
```

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Font | Usage |
|---|---|---|---|---|---|
| `text-xs` | 12px / 0.75rem | 16px / 1rem | 400 | Inter | Micro labels, badges, timestamps |
| `text-sm` | 14px / 0.875rem | 20px / 1.25rem | 400 | Inter | Secondary text, table cells, captions |
| `text-base` | 16px / 1rem | 24px / 1.5rem | 400 | Inter | Body text, descriptions, inputs |
| `text-lg` | 18px / 1.125rem | 28px / 1.75rem | 500 | Inter | Large body, card titles |
| `text-xl` | 20px / 1.25rem | 28px / 1.75rem | 600 | Space Grotesk | Section headers, card headings |
| `text-2xl` | 24px / 1.5rem | 32px / 2rem | 600 | Space Grotesk | Page sub-headings |
| `text-3xl` | 30px / 1.875rem | 36px / 2.25rem | 700 | Space Grotesk | Page headings |
| `text-4xl` | 36px / 2.25rem | 40px / 2.5rem | 700 | Space Grotesk | Hero headings |
| `text-5xl` | 48px / 3rem | 48px / 3rem | 700 | Space Grotesk | Display headings |
| `text-6xl` | 60px / 3.75rem | 60px / 3.75rem | 700 | Space Grotesk | Giant display, metric numbers |

### 3.3 Letter Spacing

| Context | Value | Token |
|---|---|---|
| Headings (xl and above) | `-0.02em` | `tracking-tight` |
| Body text | `0em` | `tracking-normal` |
| Uppercase labels | `0.05em` | `tracking-wide` |
| Monospace / code | `0em` | `tracking-normal` |

### 3.4 Typography Examples

```html
<!-- Page heading -->
<h1 class="font-heading text-3xl font-bold tracking-tight text-primary">
  Active Bounties
</h1>

<!-- Card title -->
<h3 class="font-heading text-xl font-semibold tracking-tight text-primary">
  Build Landing Page
</h3>

<!-- Body text -->
<p class="font-body text-base text-secondary leading-relaxed">
  Submit your completed work for review before the deadline.
</p>

<!-- Label -->
<span class="font-body text-xs font-medium uppercase tracking-wide text-muted">
  Bounty Value
</span>

<!-- Metric display -->
<span class="font-heading text-5xl font-bold tracking-tight text-primary">
  $12,450
</span>

<!-- Code snippet -->
<code class="font-mono text-sm text-cyan-400">
  bounty.status === "LIVE"
</code>
```

---

## 4. Spacing & Layout

### 4.1 Base Grid

All spacing derives from a **4px base unit**. This ensures pixel-perfect alignment and consistent rhythm throughout the interface.

| Token | Value | Pixels | Common Use |
|---|---|---|---|
| `space-0.5` | 0.125rem | 2px | Micro gap (icon-to-text tight) |
| `space-1` | 0.25rem | 4px | Minimum spacing, tight gaps |
| `space-1.5` | 0.375rem | 6px | Badge padding vertical |
| `space-2` | 0.5rem | 8px | Small gaps, inline spacing |
| `space-3` | 0.75rem | 12px | Input padding, compact card padding |
| `space-4` | 1rem | 16px | Standard gap, button padding horizontal |
| `space-5` | 1.25rem | 20px | Medium gap |
| `space-6` | 1.5rem | 24px | Standard card padding, section gap |
| `space-8` | 2rem | 32px | Large card padding, section spacing |
| `space-10` | 2.5rem | 40px | Large gap |
| `space-12` | 3rem | 48px | Section padding (vertical) |
| `space-16` | 4rem | 64px | Hero section padding |
| `space-20` | 5rem | 80px | Page-level vertical rhythm |
| `space-24` | 6rem | 96px | Major section separation |

### 4.2 Container Widths

| Token | Max Width | Usage |
|---|---|---|
| `container-sm` | 640px | Narrow content (auth forms, single-column) |
| `container-md` | 768px | Medium content (settings, simple forms) |
| `container-lg` | 1024px | Standard content area |
| `container-xl` | 1280px | Wide content (dashboards, tables) |
| `container-2xl` | 1536px | Full-width layouts (admin, analytics) |

### 4.3 Layout Patterns

**Page Shell:**

```
+--------------------------------------------------+
|  Sidebar (w-64, fixed)  |  Main Content Area     |
|  glass-panel            |  ml-64                 |
|                         |  px-8 py-8             |
|                         |  max-w-container-xl    |
|                         |  mx-auto               |
+--------------------------------------------------+
```

**Standard Page Padding:**

```css
/* Page wrapper */
.page-content {
  padding: 2rem;  /* py-8 px-8 */
}

/* Section spacing */
.section + .section {
  margin-top: 3rem;  /* mt-12 */
}
```

**Card Grid:**

```css
/* Standard bounty card grid */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: 1.5rem;  /* gap-6 */
```

### 4.4 Component Spacing Standards

| Component | Padding | Gap (internal) |
|---|---|---|
| Standard Card | `p-6` (24px) | `gap-4` (16px) |
| Hero Card | `p-8` (32px) | `gap-6` (24px) |
| Button (md) | `px-4 py-2.5` (16px / 10px) | `gap-2` (8px) |
| Button (lg) | `px-6 py-3` (24px / 12px) | `gap-2.5` (10px) |
| Button (sm) | `px-3 py-1.5` (12px / 6px) | `gap-1.5` (6px) |
| Input | `px-3 py-2.5` (12px / 10px) | --- |
| Badge | `px-2.5 py-1` (10px / 4px) | `gap-1` (4px) |
| Table Cell | `px-4 py-3` (16px / 12px) | --- |
| Modal | `p-8` (32px) | `gap-6` (24px) |
| Toast | `p-4` (16px) | `gap-3` (12px) |

---

## 5. Glassmorphism Components

Glassmorphism is the defining visual feature of NeoGlass. These are the foundational glass primitives from which all components are built.

### 5.1 Glass Card

The workhorse component. Used for bounty cards, stat panels, content blocks.

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  padding: 24px;
}

/* Subtle top-edge light catch */
.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent
  );
}
```

**Tailwind equivalent:**

```html
<div class="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
  <!-- content -->
</div>
```

### 5.2 Glass Panel

Used for sidebars, modals, and persistent UI surfaces that need more opacity.

```css
.glass-panel {
  background: rgba(15, 23, 42, 0.80);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0; /* For sidebars; 16px for floating panels */
}
```

**Tailwind equivalent:**

```html
<aside class="bg-slate-900/80 backdrop-blur-xl border-r border-white/[0.08]">
  <!-- sidebar content -->
</aside>
```

### 5.3 Glass Input

All form inputs share this glass foundation.

```css
.glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 10px 12px;
  color: #f1f5f9;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  line-height: 24px;
  transition: border-color 250ms ease, box-shadow 250ms ease;
}

.glass-input::placeholder {
  color: #64748b;
}

.glass-input:hover {
  border-color: rgba(255, 255, 255, 0.20);
}

.glass-input:focus {
  outline: none;
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15),
              0 0 20px rgba(6, 182, 212, 0.1);
}

.glass-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Tailwind equivalent:**

```html
<input class="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
              text-primary placeholder:text-muted
              hover:border-white/20
              focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-cyan-500/20
              transition-all duration-250
              disabled:opacity-50 disabled:cursor-not-allowed" />
```

### 5.4 Glass Textarea

```css
.glass-textarea {
  /* Inherits all glass-input styles */
  min-height: 120px;
  resize: vertical;
}
```

### 5.5 Glass Select (Dropdown Trigger)

```css
.glass-select {
  /* Inherits all glass-input styles */
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Custom chevron icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
```

### 5.6 Glass Dropdown Menu

```css
.glass-dropdown {
  background: rgba(15, 23, 42, 0.90);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.glass-dropdown-item {
  padding: 8px 12px;
  border-radius: 8px;
  color: #94a3b8;
  transition: background 150ms ease, color 150ms ease;
}

.glass-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

.glass-dropdown-item.selected {
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
}
```

---

## 6. Elevation & Shadows

NeoGlass uses a five-level shadow system. On dark backgrounds, traditional drop shadows are nearly invisible, so NeoGlass supplements them with glow effects for interactive elements.

### 6.1 Shadow Scale

| Level | Token | CSS Value | Usage |
|---|---|---|---|
| 0 | `shadow-none` | `none` | Flush elements, inline items |
| 1 | `shadow-sm` | `0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)` | Subtle lift: buttons, chips |
| 2 | `shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.4)` | Cards, panels |
| 3 | `shadow-lg` | `0 8px 24px rgba(0, 0, 0, 0.5)` | Modals, dropdowns, popovers |
| 4 | `shadow-xl` | `0 16px 48px rgba(0, 0, 0, 0.6)` | Full-screen overlays, dialogs |

### 6.2 Glow Shadows

Applied to interactive elements on hover/focus. These replace the traditional "lift" effect in light themes.

```css
/* Standard glow (primary) */
.glow-cyan {
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
}

/* Intense glow (hero elements, active states) */
.glow-cyan-intense {
  box-shadow:
    0 0 20px rgba(6, 182, 212, 0.3),
    0 0 60px rgba(6, 182, 212, 0.1);
}

/* Ring glow (focus states) */
.ring-glow-cyan {
  box-shadow:
    0 0 0 3px rgba(6, 182, 212, 0.15),
    0 0 20px rgba(6, 182, 212, 0.1);
}
```

### 6.3 Accent Border Glow

For cards and panels that need colored edge emphasis:

```css
/* Gradient border glow (hero cards) */
.accent-border-glow {
  position: relative;
}
.accent-border-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px; /* parent radius + 1px */
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  z-index: -1;
  opacity: 0.5;
  filter: blur(1px);
}
```

---

## 7. Motion & Animation

### 7.1 Duration Scale

| Token | Duration | Usage |
|---|---|---|
| `duration-fast` | `150ms` | Micro-interactions: color change, opacity, icon swap |
| `duration-normal` | `250ms` | Standard transitions: hover states, border color, focus rings |
| `duration-slow` | `400ms` | Larger transitions: panel slide, card enter/exit |
| `duration-dramatic` | `600ms` | Page transitions, hero animations, chart reveals |

### 7.2 Easing Functions

| Token | Value | Usage |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default for most transitions |
| `ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the viewport |
| `ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the viewport |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Interactive elements: buttons, toggles, drag |

### 7.3 Animation Recipes

**Page Transition (fade-up):**

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: fade-up 300ms cubic-bezier(0, 0, 0.2, 1) forwards;
}
```

**Card Hover (lift + glow):**

```css
.interactive-card {
  transition:
    transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
}
```

**Button Press (scale down):**

```css
.btn {
  transition: transform 100ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:active {
  transform: scale(0.98);
}
```

**Loading Pulse (breathing glow):**

```css
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.loading-pulse {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Status Badge Pulse (active indicator):**

```css
@keyframes status-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
  }
}

.status-live {
  animation: status-pulse 2s ease-in-out infinite;
}
```

**Skeleton Shimmer (loading placeholder):**

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

**Chart Staggered Reveal:**

```css
.chart-bar {
  transform: scaleY(0);
  transform-origin: bottom;
  animation: chart-grow 600ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

@keyframes chart-grow {
  to {
    transform: scaleY(1);
  }
}

/* Apply stagger via inline style or nth-child */
.chart-bar:nth-child(1) { animation-delay: 0ms; }
.chart-bar:nth-child(2) { animation-delay: 75ms; }
.chart-bar:nth-child(3) { animation-delay: 150ms; }
/* ... etc */
```

**Toast Slide-in (spring):**

```css
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.toast-enter {
  animation: slide-in-right 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### 7.4 Reduced Motion

All animations must respect the user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Component Patterns

### 8.1 Status Badges

Status badges are one of the most critical UI elements in Social Bounty. They must be instantly recognizable at a glance.

**Bounty Status:**

| Status | Background | Text | Border | Effect |
|---|---|---|---|---|
| `DRAFT` | `bg-slate-800` | `text-slate-300` | `border-slate-600` | None |
| `LIVE` | `bg-emerald-900/50` | `text-emerald-400` | `border-emerald-500/50` | Glow + pulse |
| `PAUSED` | `bg-amber-900/50` | `text-amber-400` | `border-amber-500/50` | None |
| `CLOSED` | `bg-slate-800` | `text-slate-400` | `border-slate-600` | None |

**Submission Status:**

| Status | Background | Text | Border | Effect |
|---|---|---|---|---|
| `SUBMITTED` | `bg-violet-900/50` | `text-violet-400` | `border-violet-500/50` | None |
| `IN_REVIEW` | `bg-blue-900/50` | `text-blue-400` | `border-blue-500/50` | Subtle pulse |
| `APPROVED` | `bg-emerald-900/50` | `text-emerald-400` | `border-emerald-500/50` | Glow |
| `REJECTED` | `bg-rose-900/50` | `text-rose-400` | `border-rose-500/50` | None |
| `PAID` | `bg-cyan-900/50` | `text-cyan-400` | `border-cyan-500/50` | Glow |

**Badge HTML pattern:**

```html
<!-- LIVE badge with glow + pulse -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1
             bg-emerald-900/50 text-emerald-400 text-xs font-medium
             border border-emerald-500/50 rounded-full
             shadow-[0_0_12px_rgba(16,185,129,0.2)]
             animate-[status-pulse_2s_ease-in-out_infinite]">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
  LIVE
</span>

<!-- DRAFT badge (no effects) -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1
             bg-slate-800 text-slate-300 text-xs font-medium
             border border-slate-600 rounded-full">
  DRAFT
</span>

<!-- IN_REVIEW badge with pulse -->
<span class="inline-flex items-center gap-1.5 px-2.5 py-1
             bg-blue-900/50 text-blue-400 text-xs font-medium
             border border-blue-500/50 rounded-full
             animate-pulse">
  <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
  IN REVIEW
</span>
```

### 8.2 Buttons

**Primary Button (gradient + glow):**

```html
<button class="inline-flex items-center justify-center gap-2
               px-4 py-2.5 rounded-lg
               bg-gradient-to-r from-cyan-500 to-blue-600
               text-white text-sm font-medium
               shadow-lg shadow-cyan-500/20
               hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]
               hover:from-cyan-400 hover:to-blue-500
               active:scale-[0.98]
               transition-all duration-200
               focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-2 focus:ring-offset-bg-abyss
               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none">
  <span>Create Bounty</span>
</button>
```

**Secondary Button (glass + border):**

```html
<button class="inline-flex items-center justify-center gap-2
               px-4 py-2.5 rounded-lg
               bg-white/5 border border-white/10
               text-secondary text-sm font-medium
               hover:bg-white/8 hover:border-white/20
               hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]
               active:scale-[0.98]
               transition-all duration-200
               focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
  <span>Cancel</span>
</button>
```

**Danger Button:**

```html
<button class="inline-flex items-center justify-center gap-2
               px-4 py-2.5 rounded-lg
               bg-gradient-to-r from-rose-500 to-red-600
               text-white text-sm font-medium
               shadow-lg shadow-rose-500/20
               hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]
               active:scale-[0.98]
               transition-all duration-200">
  <span>Delete Bounty</span>
</button>
```

**Ghost Button:**

```html
<button class="inline-flex items-center justify-center gap-2
               px-4 py-2.5 rounded-lg
               text-secondary text-sm font-medium
               hover:bg-white/5 hover:text-primary
               active:scale-[0.98]
               transition-all duration-150">
  <span>View Details</span>
</button>
```

**Icon Button (circular glass):**

```html
<button class="inline-flex items-center justify-center
               w-10 h-10 rounded-full
               bg-white/5 border border-white/10
               text-muted hover:text-primary
               hover:bg-white/8 hover:border-white/20
               active:scale-[0.95]
               transition-all duration-150">
  <!-- icon SVG -->
</button>
```

### 8.3 Cards

**Standard Glass Card:**

```html
<div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
  <h3 class="font-heading text-xl font-semibold text-primary mb-2">Card Title</h3>
  <p class="text-secondary text-sm">Card description content here.</p>
</div>
```

**Interactive Card (bounty listing):**

```html
<div class="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6
            cursor-pointer
            transition-all duration-200
            hover:translate-y-[-2px]
            hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]
            hover:border-white/20">
  <div class="flex items-start justify-between mb-4">
    <h3 class="font-heading text-xl font-semibold text-primary
               group-hover:text-cyan-400 transition-colors duration-200">
      Build OAuth Integration
    </h3>
    <!-- LIVE badge -->
  </div>
  <p class="text-secondary text-sm mb-4">
    Implement OAuth 2.0 flow with Google and GitHub providers...
  </p>
  <div class="flex items-center justify-between">
    <span class="font-heading text-2xl font-bold text-emerald-400">$500</span>
    <span class="text-muted text-xs">3 days remaining</span>
  </div>
</div>
```

**Hero Card (with gradient accent border):**

```html
<div class="relative bg-white/5 backdrop-blur-md rounded-2xl p-8
            before:absolute before:inset-[-1px] before:rounded-[17px]
            before:bg-gradient-to-br before:from-cyan-500/50 before:to-violet-500/50
            before:z-[-1] before:blur-[1px]">
  <div class="relative z-10">
    <!-- Hero content with larger typography -->
  </div>
</div>
```

**Metric Card:**

```html
<div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
  <span class="text-xs font-medium uppercase tracking-wide text-muted">
    Total Bounties
  </span>
  <div class="flex items-end gap-3 mt-2">
    <span class="font-heading text-4xl font-bold text-primary">247</span>
    <span class="text-emerald-400 text-sm font-medium flex items-center gap-1 mb-1">
      <!-- arrow up icon -->
      +12.5%
    </span>
  </div>
  <div class="mt-4 h-12">
    <!-- Sparkline chart here -->
  </div>
</div>
```

### 8.4 Navigation

**Sidebar:**

```html
<aside class="fixed left-0 top-0 bottom-0 w-64
              bg-slate-900/80 backdrop-blur-xl
              border-r border-white/[0.08]
              flex flex-col z-40">
  <!-- Logo -->
  <div class="p-6 border-b border-white/[0.08]">
    <span class="font-heading text-xl font-bold text-primary">
      Social<span class="text-cyan-400">Bounty</span>
    </span>
  </div>

  <!-- Navigation items -->
  <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
    <!-- Active item -->
    <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg
              bg-cyan-500/10 text-cyan-400
              border-l-2 border-cyan-400
              shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
      <!-- icon -->
      <span class="text-sm font-medium">Dashboard</span>
    </a>

    <!-- Inactive item -->
    <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-muted
              hover:bg-white/5 hover:text-secondary
              transition-all duration-150">
      <!-- icon -->
      <span class="text-sm font-medium">Bounties</span>
    </a>
  </nav>

  <!-- User section (bottom) -->
  <div class="p-4 border-t border-white/[0.08]">
    <!-- user avatar + name -->
  </div>
</aside>
```

**Breadcrumbs:**

```html
<nav class="flex items-center gap-2 text-sm">
  <a href="#" class="text-muted hover:text-secondary transition-colors">Home</a>
  <span class="text-muted">/</span>
  <a href="#" class="text-secondary hover:text-primary transition-colors">Bounties</a>
  <span class="text-muted">/</span>
  <span class="text-primary font-medium">OAuth Integration</span>
</nav>
```

**Tabs (underline style):**

```html
<div class="flex gap-6 border-b border-white/10">
  <!-- Active tab -->
  <button class="relative pb-3 text-sm font-medium text-cyan-400
                 after:absolute after:bottom-0 after:left-0 after:right-0
                 after:h-0.5 after:bg-cyan-400 after:rounded-full
                 after:shadow-[0_0_8px_rgba(6,182,212,0.5)]">
    Overview
  </button>

  <!-- Inactive tab -->
  <button class="pb-3 text-sm font-medium text-muted
                 hover:text-secondary
                 transition-colors duration-150">
    Submissions
  </button>
</div>
```

### 8.5 Data Tables

```html
<div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
  <table class="w-full">
    <!-- Header -->
    <thead>
      <tr class="border-b border-white/10">
        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide
                   text-muted bg-surface/50">
          Bounty
        </th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide
                   text-muted bg-surface/50">
          Status
        </th>
        <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide
                   text-muted bg-surface/50">
          Value
        </th>
      </tr>
    </thead>

    <!-- Body -->
    <tbody class="divide-y divide-white/5">
      <!-- Standard row -->
      <tr class="hover:bg-white/[0.03] transition-colors duration-150">
        <td class="px-4 py-3 text-sm text-primary">Build Landing Page</td>
        <td class="px-4 py-3"><!-- Status badge --></td>
        <td class="px-4 py-3 text-sm text-primary text-right font-medium">$350</td>
      </tr>

      <!-- Active/selected row -->
      <tr class="bg-cyan-500/5 hover:bg-cyan-500/8 transition-colors duration-150">
        <td class="px-4 py-3 text-sm text-primary">OAuth Integration</td>
        <td class="px-4 py-3"><!-- Status badge --></td>
        <td class="px-4 py-3 text-sm text-primary text-right font-medium">$500</td>
      </tr>
    </tbody>
  </table>

  <!-- Pagination -->
  <div class="flex items-center justify-between px-4 py-3 border-t border-white/10">
    <span class="text-sm text-muted">Showing 1-10 of 47</span>
    <div class="flex items-center gap-1">
      <button class="px-3 py-1.5 text-sm text-muted rounded-lg
                     hover:bg-white/5 transition-colors">
        Previous
      </button>
      <button class="px-3 py-1.5 text-sm text-cyan-400 bg-cyan-500/10 rounded-lg
                     font-medium">
        1
      </button>
      <button class="px-3 py-1.5 text-sm text-muted rounded-lg
                     hover:bg-white/5 transition-colors">
        2
      </button>
      <button class="px-3 py-1.5 text-sm text-muted rounded-lg
                     hover:bg-white/5 transition-colors">
        Next
      </button>
    </div>
  </div>
</div>
```

### 8.6 Forms

**Form Field Pattern:**

```html
<div class="space-y-2">
  <label class="block text-xs font-medium uppercase tracking-wide text-muted">
    Bounty Title
  </label>
  <input
    type="text"
    placeholder="Enter a descriptive title..."
    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
           text-primary placeholder:text-muted text-base
           hover:border-white/20
           focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
           transition-all duration-250"
  />
  <p class="text-xs text-muted">A clear title helps attract the right contributors.</p>
</div>
```

**Select / Dropdown:**

```html
<div class="space-y-2">
  <label class="block text-xs font-medium uppercase tracking-wide text-muted">
    Category
  </label>
  <div class="relative">
    <select class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
                   text-primary text-base appearance-none
                   hover:border-white/20
                   focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
                   transition-all duration-250">
      <option value="">Select a category</option>
      <option value="dev">Development</option>
      <option value="design">Design</option>
    </select>
    <!-- Chevron icon positioned absolute right -->
  </div>
</div>
```

**Checkbox / Radio (custom styled):**

```html
<!-- Custom checkbox -->
<label class="flex items-center gap-3 cursor-pointer group">
  <div class="relative w-5 h-5 rounded border border-white/20
              bg-white/5 flex items-center justify-center
              group-hover:border-white/30
              peer-checked:bg-cyan-500 peer-checked:border-cyan-500
              transition-all duration-150">
    <!-- Check icon (hidden until checked) -->
  </div>
  <span class="text-sm text-secondary group-hover:text-primary transition-colors">
    Require code review
  </span>
</label>
```

**File Upload:**

```html
<div class="border-2 border-dashed border-white/10 rounded-2xl p-8
            text-center cursor-pointer
            hover:border-white/20 hover:bg-white/[0.02]
            hover:shadow-[0_0_30px_rgba(6,182,212,0.05)]
            transition-all duration-250
            group">
  <!-- Upload icon -->
  <p class="text-secondary text-sm mt-2">
    <span class="text-cyan-400 font-medium group-hover:underline">Click to upload</span>
    or drag and drop
  </p>
  <p class="text-muted text-xs mt-1">PNG, JPG, PDF up to 10MB</p>
</div>
```

### 8.7 Modals / Dialogs

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
            animate-[fade-in_200ms_ease]">

  <!-- Panel -->
  <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-lg
              bg-slate-900/90 backdrop-blur-xl
              border border-white/10 rounded-2xl
              shadow-[0_8px_24px_rgba(0,0,0,0.5)]
              p-8
              animate-[fade-up_300ms_cubic-bezier(0,0,0.2,1)]">

    <!-- Close button -->
    <button class="absolute top-4 right-4
                   w-8 h-8 rounded-full
                   bg-white/5 border border-white/10
                   text-muted hover:text-primary hover:bg-white/10
                   flex items-center justify-center
                   transition-all duration-150">
      <!-- X icon -->
    </button>

    <!-- Content -->
    <h2 class="font-heading text-2xl font-semibold text-primary mb-2">
      Confirm Submission
    </h2>
    <p class="text-secondary text-sm mb-6">
      Are you sure you want to submit this work for review?
    </p>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3">
      <button class="ghost-btn">Cancel</button>
      <button class="primary-btn">Submit</button>
    </div>
  </div>
</div>
```

### 8.8 Toast / Notifications

```html
<!-- Toast container (fixed top-right) -->
<div class="fixed top-4 right-4 z-[100] space-y-3 w-96">

  <!-- Success toast -->
  <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl
              shadow-[0_8px_24px_rgba(0,0,0,0.4)]
              p-4 flex gap-3
              border-l-4 border-l-emerald-500
              animate-[slide-in-right_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
    <!-- Icon -->
    <div class="flex-shrink-0 w-5 h-5 text-emerald-400 mt-0.5">
      <!-- check circle icon -->
    </div>
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-primary">Bounty Created</p>
      <p class="text-xs text-muted mt-0.5">Your bounty is now live and visible.</p>
    </div>
    <!-- Close -->
    <button class="flex-shrink-0 text-muted hover:text-primary transition-colors">
      <!-- X icon -->
    </button>
    <!-- Auto-dismiss progress bar -->
    <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/30 rounded-b-xl overflow-hidden">
      <div class="h-full bg-emerald-500 animate-[shrink-width_5s_linear_forwards]"></div>
    </div>
  </div>

  <!-- Error toast -->
  <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl
              shadow-[0_8px_24px_rgba(0,0,0,0.4)]
              p-4 flex gap-3
              border-l-4 border-l-rose-500
              animate-[slide-in-right_400ms_cubic-bezier(0.34,1.56,0.64,1)]">
    <!-- Same structure, rose-colored icon -->
  </div>
</div>
```

Toast type → left border color mapping:

| Type | Border Color | Icon Color |
|---|---|---|
| Success | `border-l-emerald-500` | `text-emerald-400` |
| Error | `border-l-rose-500` | `text-rose-400` |
| Warning | `border-l-amber-500` | `text-amber-400` |
| Info | `border-l-blue-500` | `text-blue-400` |

---

## 9. Gradient Mesh Backgrounds

Gradient meshes add atmospheric depth to key screens. They should be subtle --- felt more than seen.

### 9.1 Auth Pages (Animated Gradient Mesh)

```css
.auth-mesh-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: #030712;
}

.auth-mesh-bg::before,
.auth-mesh-bg::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
  animation: mesh-drift 20s ease-in-out infinite;
}

.auth-mesh-bg::before {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -100px;
  background: radial-gradient(circle, #06b6d4, transparent 70%);
}

.auth-mesh-bg::after {
  width: 500px;
  height: 500px;
  bottom: -150px;
  left: -100px;
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
  animation-delay: -10s;
  animation-direction: reverse;
}

/* Third blob via extra element */
.auth-mesh-blob {
  position: absolute;
  width: 400px;
  height: 400px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  filter: blur(120px);
  opacity: 0.1;
  animation: mesh-drift 25s ease-in-out infinite;
  animation-delay: -5s;
}

@keyframes mesh-drift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 30px) scale(0.95);
  }
}
```

**Tailwind implementation:**

```html
<div class="fixed inset-0 -z-10 bg-bg-void overflow-hidden">
  <div class="absolute -top-[200px] -right-[100px] w-[600px] h-[600px]
              rounded-full bg-cyan-500/15 blur-[120px]
              animate-[mesh-drift_20s_ease-in-out_infinite]" />
  <div class="absolute -bottom-[150px] -left-[100px] w-[500px] h-[500px]
              rounded-full bg-violet-500/15 blur-[120px]
              animate-[mesh-drift_20s_ease-in-out_infinite_reverse]"
       style="animation-delay: -10s" />
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[400px] h-[400px]
              rounded-full bg-blue-500/10 blur-[120px]
              animate-[mesh-drift_25s_ease-in-out_infinite]"
       style="animation-delay: -5s" />
</div>
```

### 9.2 Dashboard (Static Subtle Gradient)

The dashboard uses a barely visible gradient that adds depth without distraction.

```css
.dashboard-bg {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(139, 92, 246, 0.02) 0%, transparent 50%),
    #0a0f1e;
}
```

**Tailwind implementation:**

```html
<div class="min-h-screen bg-bg-abyss
            bg-[radial-gradient(ellipse_at_20%_0%,rgba(6,182,212,0.03)_0%,transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(139,92,246,0.02)_0%,transparent_50%)]">
  <!-- dashboard content -->
</div>
```

---

## 10. Responsive Breakpoints

| Token | Min Width | Target |
|---|---|---|
| `sm` | 640px | Mobile landscape, large phones |
| `md` | 768px | Tablets (portrait) |
| `lg` | 1024px | Small desktops, tablets (landscape) |
| `xl` | 1280px | Standard desktops |
| `2xl` | 1536px | Large desktops, ultrawide monitors |

### Responsive Behavior Guidelines

| Element | Mobile (`< sm`) | Tablet (`sm` - `lg`) | Desktop (`lg+`) |
|---|---|---|---|
| Sidebar | Hidden, hamburger menu | Collapsed (icons only, w-16) | Expanded (w-64) |
| Card Grid | 1 column | 2 columns | 3-4 columns |
| Data Table | Card view (stacked) | Scrollable table | Full table |
| Page Padding | `px-4 py-4` | `px-6 py-6` | `px-8 py-8` |
| Typography Scale | Reduce headings by 1 step | Default | Default |
| Modal | Full-screen (bottom sheet) | Centered, max-w-md | Centered, max-w-lg |
| Navigation | Bottom tab bar | Sidebar collapsed | Sidebar expanded |

### Container Behavior

```html
<div class="mx-auto px-4 sm:px-6 lg:px-8
            max-w-[640px] sm:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1280px] 2xl:max-w-[1536px]">
  <!-- content -->
</div>
```

### Mobile Tightening Checklist

Every new component or screen must pass this checklist before merge. Most of the existing component library was built desktop-first; new work must scale *up* from mobile, not down from desktop.

**Typography — scale one step up at `sm:`**

| Role | Mobile | `sm:` and up |
|---|---|---|
| Page / section heading | `text-xl` | `sm:text-2xl` |
| Card title | `text-sm` or `text-base` | `sm:text-base` or `sm:text-lg` |
| Body copy | `text-sm` | (stay) `text-sm` |
| Helper / metadata | `text-xs` | (stay) `text-xs` |
| Display (hero, price) | `text-2xl` or `text-3xl` | `sm:text-3xl` or `sm:text-4xl` |

**Never shrink below `text-sm` (14px) for primary content.** `text-xs` (12px) is reserved for labels, metadata, and uppercase-tracking-wider captions.

**Spacing — tighten at mobile**

| Context | Mobile | `sm:` and up |
|---|---|---|
| Card padding (standard) | `p-4` | `sm:p-6` |
| Card padding (dense, e.g. list cards) | `p-3` | `sm:p-5` |
| Empty / error state container | `py-10` | `sm:py-16` |
| Vertical rhythm — tight | `space-y-3` | `sm:space-y-4` |
| Vertical rhythm — standard | `space-y-4` | `sm:space-y-6` |
| Vertical rhythm — section | `space-y-6` | `sm:space-y-8` |
| Page-level form `pb-` (no fixed footer) | `pb-20` | `sm:pb-24` |
| Page-level form `pb-` (above `fixed bottom-0` footer) | `pb-[calc(8rem+env(safe-area-inset-bottom,0px))]` | `sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))]` |
| Page padding | `px-4 py-4` | `sm:px-6 sm:py-6` / `lg:px-8 lg:py-8` |

**Tap targets — do not shrink**

- Interactive buttons / nav items / icon buttons: **`min-h-[44px] min-w-[44px]`** (WCAG AA, §11.5).
- Form input heights: **fixed at `2.5rem` (40px)** via the global rule on `input.p-inputtext, .p-dropdown, .p-multiselect` — see §13.6. Do **not** override per-component with `h-*` Tailwind classes; let the token own it. `InputTextarea` is the only exception (grows with content, `min-height: 5rem`).
- You may tighten padding *around* inputs (labels, helper text, gaps), but not internal input padding.

**Modals — responsive width**

- PrimeReact `Dialog` fixed `style={{ width: 'NNNpx' }}` overflows small phones. Always pair with `breakpoints={{ '640px': '95vw' }}`.
- Modal body padding: `p-4 sm:p-6` is the safe default. Action buttons inside modals stay at standard sizing.

**Fixed-footer pages — clearance + iOS safe-area**

A `fixed bottom-0` footer (e.g. `FormSummaryFooter`, action bars) takes no space in flow, so the scrollable content above it must pad for the footer's height **plus** the iOS home-indicator area on notched devices, or the last form field / CTA gets hidden.

```tsx
// Footer — absorbs iOS safe-area into its own bottom padding so the
// Create button stays tappable above the home indicator.
<div className="fixed bottom-0 left-0 right-0 z-40 px-3 pt-3
                pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
  ...
</div>

// Consumer content above the footer — pads by footer height + safe-area.
// 8rem mobile covers a ~108px two-row footer; 6rem desktop covers a ~64px
// single-row footer. Tune the rem values per footer.
<form className="pb-[calc(8rem+env(safe-area-inset-bottom,0px))]
                sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
  ...
</form>
```

Rules:
- **Never** rely on a plain Tailwind `pb-20` / `pb-24` above a fixed footer — on iOS notched devices the home indicator adds ~34px that the number doesn't account for.
- The footer's own `pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]` makes buttons reachable; without it, tapping the bottom 34px falls through to the OS.
- When footer content changes (adding/removing button rows), re-measure and update both the footer's intrinsic height and the consumer's `pb-[calc()]` value together.

**Toggle + revealed input rows — stack on mobile**

A recurring pattern in forms: an `InputSwitch` toggles a conditional `InputText` / `InputNumber` / `Dropdown` beside it. On a 375px viewport with standard page + card padding (~311px content width), a fixed-width label cluster (e.g. `min-w-[14rem]` = 224px) plus a 128px revealed input overflows by ~57px → horizontal scroll.

```tsx
// ❌ Wrong — fixed 224px label column + revealed input = overflow on mobile
<div className="flex items-center gap-4">
  <div className="flex items-center gap-3 min-w-[14rem]">
    <InputSwitch ... />
    <span className="text-sm">Minimum followers</span>
  </div>
  {enabled && <InputNumber className="w-32" ... />}
</div>

// ✅ Right — stack vertically on mobile, horizontal cluster on sm+
<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
  <div className="flex items-center gap-3 sm:min-w-[14rem]">
    <InputSwitch ... />
    <span className="text-sm">Minimum followers</span>
  </div>
  {enabled && <InputNumber className="w-32" ... />}
</div>
```

Rules:
- Outer row: `flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4`
- Label cluster: drop the `min-w-[14rem]` floor on mobile — use `sm:min-w-[14rem]` only
- Full-width revealed text inputs: `w-full sm:flex-1` (so they fill the stacked mobile width, then flex on desktop)
- Fixed-width numeric revealed inputs (`w-32`, `w-28`): leave as-is — they'll sit left-aligned below the toggle on mobile, which reads fine

**Reference components (copy this pattern)**

- `BountyCard.tsx` — dense card, `p-3 sm:p-5`, `text-sm sm:text-base` title
- `PageHeaderTitle.tsx` — `text-xl sm:text-2xl` title, `flex-col sm:flex-row`
- `SectionPanel.tsx` — form section wrapper, `text-sm sm:text-base` title, `space-y-4 sm:space-y-5` body
- `MainLayout.tsx` — `p-4 md:p-6 lg:p-8` progressive page padding
- `FormSummaryFooter.tsx` — distinct mobile vs desktop layouts (when scaling isn't enough)

**Smoke test before merge**

At 375×667 (iPhone SE) and 390×844 (iPhone 14):
- [ ] Primary action visible above the fold on empty/error/form states
- [ ] No horizontal scroll
- [ ] Modal fits viewport with visible Cancel + Confirm
- [ ] Every button / nav target ≥ 44×44px
- [ ] Heading doesn't dominate (≤ ~30% of visible height)

---

## 11. Accessibility in Dark Mode

### 11.1 Contrast Requirements

All text must meet **WCAG 2.1 Level AA** standards:

| Text Type | Minimum Ratio | NeoGlass Actual |
|---|---|---|
| Body text (< 18px) | 4.5:1 | `text-secondary` (#94a3b8) on `bg-abyss` (#0a0f1e) = **7.0:1** |
| Large text (>= 18px bold or >= 24px) | 3:1 | `text-muted` (#64748b) on `bg-abyss` (#0a0f1e) = **4.6:1** |
| UI components (borders, icons) | 3:1 | `glass-border` (white/10) is supplemental, not sole indicator |

**Important:** `text-disabled` (#475569) at 3.1:1 is below AA for small text. Use it only for large text, or pair with additional visual indicators (strikethrough, icons, opacity changes).

### 11.2 Focus Indicators

Every interactive element must have a visible focus indicator. NeoGlass uses a cyan glow ring:

```css
/* Standard focus ring */
:focus-visible {
  outline: 2px solid #06b6d4;
  outline-offset: 2px;
}

/* Enhanced glow focus (for glass surfaces where outline alone is insufficient) */
:focus-visible {
  outline: 2px solid #06b6d4;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15);
}
```

**Tailwind:**

```html
<button class="focus-visible:outline-2 focus-visible:outline-cyan-500
               focus-visible:outline-offset-2
               focus-visible:ring-4 focus-visible:ring-cyan-500/15">
```

### 11.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .skeleton {
    animation: none;
    background: rgba(255, 255, 255, 0.05);
  }

  .auth-mesh-bg::before,
  .auth-mesh-bg::after,
  .auth-mesh-blob {
    animation: none;
  }
}
```

**Tailwind:**

```html
<div class="animate-pulse motion-reduce:animate-none">
```

### 11.4 Graceful Degradation (No Backdrop Filter)

Older browsers or devices may not support `backdrop-filter`. Ensure glass surfaces remain readable:

```css
/* Base glass (without backdrop-filter) */
.glass-card {
  background: rgba(17, 24, 39, 0.95); /* Nearly opaque fallback */
}

/* Enhanced glass (with backdrop-filter support) */
@supports (backdrop-filter: blur(12px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
  }
}
```

### 11.5 Additional Accessibility

- **Color is not the only indicator.** Status badges include text labels alongside colors. Error states include icons and text, not just red borders.
- **Touch targets.** All interactive elements have a minimum tap target of 44x44px on mobile.
- **Screen readers.** Use `aria-label`, `aria-describedby`, and semantic HTML. Decorative glows and mesh backgrounds use `aria-hidden="true"`.
- **Keyboard navigation.** All interactive elements are reachable via Tab. Modals trap focus. Escape closes overlays.

---

## 12. Light Mode Variant

While NeoGlass is dark-first, a light mode variant is available for users who prefer it. The system uses CSS custom properties to enable seamless switching.

### 12.1 Color Inversion Map

| Token | Dark Mode | Light Mode |
|---|---|---|
| `bg-void` | `#030712` | `#ffffff` |
| `bg-abyss` | `#0a0f1e` | `#f8fafc` (slate-50) |
| `bg-surface` | `#111827` | `#f1f5f9` (slate-100) |
| `bg-elevated` | `#1f2937` | `#e2e8f0` (slate-200) |
| `bg-hover` | `#374151` | `#cbd5e1` (slate-300) |
| `text-primary` | `#f1f5f9` | `#0f172a` (slate-900) |
| `text-secondary` | `#94a3b8` | `#475569` (slate-600) |
| `text-muted` | `#64748b` | `#94a3b8` (slate-400) |
| `text-disabled` | `#475569` | `#cbd5e1` (slate-300) |
| `glass-bg` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.70)` |
| `glass-border` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.08)` |
| `glass-hover` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.04)` |

### 12.2 Accent Adjustments

Light mode keeps the same hues but reduces saturation by ~10% and increases lightness slightly for background accents:

| Token | Dark Mode | Light Mode |
|---|---|---|
| `accent-cyan` | `#06b6d4` | `#0891b2` (slightly darker for contrast) |
| `accent-violet` | `#8b5cf6` | `#7c3aed` |
| `accent-emerald` | `#10b981` | `#059669` |
| `accent-rose` | `#f43f5e` | `#e11d48` |
| `accent-blue` | `#3b82f6` | `#2563eb` |
| `accent-amber` | `#f59e0b` | `#d97706` |

### 12.3 Glass in Light Mode

Light mode glass is "frosted white" rather than "frosted dark":

```css
[data-theme="light"] .glass-card {
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
```

### 12.4 Shadow Adjustments

Light mode uses softer, more diffuse shadows:

| Level | Light Mode Value |
|---|---|
| 1 | `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)` |
| 2 | `0 4px 12px rgba(0, 0, 0, 0.08)` |
| 3 | `0 8px 24px rgba(0, 0, 0, 0.10)` |
| 4 | `0 16px 48px rgba(0, 0, 0, 0.12)` |

### 12.5 Theme Toggle Implementation

```css
:root {
  /* Dark mode (default) */
  --bg-void: #030712;
  --bg-abyss: #0a0f1e;
  --bg-surface: #111827;
  --bg-elevated: #1f2937;
  --bg-hover: #374151;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.10);
  --glass-hover: rgba(255, 255, 255, 0.08);
  --shadow-color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] {
  --bg-void: #ffffff;
  --bg-abyss: #f8fafc;
  --bg-surface: #f1f5f9;
  --bg-elevated: #e2e8f0;
  --bg-hover: #cbd5e1;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --glass-bg: rgba(255, 255, 255, 0.70);
  --glass-border: rgba(0, 0, 0, 0.08);
  --glass-hover: rgba(0, 0, 0, 0.04);
  --shadow-color: rgba(0, 0, 0, 0.08);
}
```

---

## 13. PrimeReact Theme Overrides

Social Bounty uses PrimeReact with the Lara theme as a foundation. Below are the overrides needed to align PrimeReact components with NeoGlass.

### 13.1 CSS Custom Properties

PrimeReact's Lara theme uses CSS variables. Override these in your global stylesheet:

```css
:root {
  /* === Surface Colors === */
  --surface-ground: #0a0f1e;        /* bg-abyss */
  --surface-section: #111827;        /* bg-surface */
  --surface-card: rgba(255, 255, 255, 0.05);  /* glass-bg */
  --surface-overlay: rgba(15, 23, 42, 0.90);  /* glass-panel */
  --surface-border: rgba(255, 255, 255, 0.10); /* glass-border */
  --surface-hover: rgba(255, 255, 255, 0.08);  /* glass-hover */

  /* === Primary Color === */
  --primary-color: #06b6d4;          /* accent-cyan */
  --primary-color-text: #ffffff;
  --primary-50: rgba(6, 182, 212, 0.05);
  --primary-100: rgba(6, 182, 212, 0.10);
  --primary-200: rgba(6, 182, 212, 0.20);
  --primary-300: rgba(6, 182, 212, 0.30);
  --primary-400: #22d3ee;
  --primary-500: #06b6d4;
  --primary-600: #0891b2;
  --primary-700: #0e7490;
  --primary-800: #155e75;
  --primary-900: #164e63;

  /* === Text Colors === */
  --text-color: #f1f5f9;             /* text-primary */
  --text-color-secondary: #94a3b8;   /* text-secondary */

  /* === Font === */
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;

  /* === Border Radius === */
  --border-radius: 8px;

  /* === Focus Ring === */
  --focus-ring: 0 0 0 2px #0a0f1e, 0 0 0 4px #06b6d4;
}
```

### 13.2 DataTable Overrides

```css
/* DataTable header */
.p-datatable .p-datatable-thead > tr > th {
  background: rgba(17, 24, 39, 0.5) !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
  color: #64748b !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 12px 16px !important;
}

/* DataTable body rows */
.p-datatable .p-datatable-tbody > tr {
  background: transparent !important;
  color: #f1f5f9 !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
  transition: background-color 150ms ease !important;
}

.p-datatable .p-datatable-tbody > tr:hover {
  background: rgba(255, 255, 255, 0.03) !important;
}

/* Selected row */
.p-datatable .p-datatable-tbody > tr.p-highlight {
  background: rgba(6, 182, 212, 0.05) !important;
  color: #f1f5f9 !important;
}

/* Paginator */
.p-datatable .p-paginator {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.10) !important;
}

.p-paginator .p-paginator-page.p-highlight {
  background: rgba(6, 182, 212, 0.10) !important;
  color: #06b6d4 !important;
  border-color: transparent !important;
}
```

### 13.3 Dialog Overrides

```css
/* Dialog backdrop */
.p-dialog-mask {
  background: rgba(0, 0, 0, 0.60) !important;
  backdrop-filter: blur(4px) !important;
}

/* Dialog panel */
.p-dialog {
  background: rgba(15, 23, 42, 0.90) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
  color: #f1f5f9 !important;
}

.p-dialog .p-dialog-header {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 24px 32px !important;
  color: #f1f5f9 !important;
}

.p-dialog .p-dialog-content {
  background: transparent !important;
  padding: 24px 32px !important;
  color: #94a3b8 !important;
}

.p-dialog .p-dialog-footer {
  background: transparent !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 16px 32px !important;
}

/* Close button */
.p-dialog .p-dialog-header-icon {
  color: #64748b !important;
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
}

.p-dialog .p-dialog-header-icon:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #f1f5f9 !important;
}
```

### 13.4 Button Overrides

```css
/* Primary button */
.p-button {
  background: linear-gradient(135deg, #06b6d4, #2563eb) !important;
  border: none !important;
  border-radius: 8px !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2) !important;
}

.p-button:hover {
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.3) !important;
}

.p-button:active {
  transform: scale(0.98) !important;
}

/* Secondary button */
.p-button.p-button-secondary {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  color: #94a3b8 !important;
  box-shadow: none !important;
}

.p-button.p-button-secondary:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.20) !important;
  color: #f1f5f9 !important;
}

/* Danger button */
.p-button.p-button-danger {
  background: linear-gradient(135deg, #f43f5e, #dc2626) !important;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.2) !important;
}

.p-button.p-button-danger:hover {
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.3) !important;
}

/* Ghost / text button */
.p-button.p-button-text {
  background: transparent !important;
  border: none !important;
  color: #94a3b8 !important;
  box-shadow: none !important;
}

.p-button.p-button-text:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #f1f5f9 !important;
}
```

### 13.5 InputText Overrides

```css
.p-inputtext {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 8px !important;
  color: #f1f5f9 !important;
  font-family: 'Inter', sans-serif !important;
  transition: border-color 250ms ease, box-shadow 250ms ease !important;
}

.p-inputtext::placeholder {
  color: #64748b !important;
}

.p-inputtext:hover:not(:focus) {
  border-color: rgba(255, 255, 255, 0.20) !important;
}

.p-inputtext:focus {
  border-color: #06b6d4 !important;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15), 0 0 20px rgba(6, 182, 212, 0.1) !important;
}
```

### 13.6 Form-Control Height (design token)

All single-line form controls render at exactly **2.5rem (40px)**. This is a design-system contract: when any of `InputText`, `InputNumber`, `Dropdown`, `MultiSelect`, or `Calendar` sit next to each other (Duration + Unit, reward Type + Name + Value, filter bar), their heights must be pixel-identical.

```css
/* Single-line form controls render at exactly 40px */
input.p-inputtext,
.p-dropdown,
.p-multiselect {
  height: 2.5rem !important;
}
```

**Why `height`, not `min-height`**: PrimeReact's lara theme sets its own padding + min-height per component (`.p-dropdown` vs `.p-inputtext` differ by 2px internally), producing 1–2px drift visible wherever two different control types are rendered in the same row. `height: 2.5rem !important` forces exact alignment.

**Selector notes:**
- `input.p-inputtext` matches the `<input>` element itself, covering standalone InputText, Password, Calendar's internal input, and InputNumber's inner input (which also carries `.p-inputnumber-input`).
- `<textarea class="p-inputtext p-inputtextarea">` is **not** matched (tagname is `textarea`), so textareas keep their `min-height: 5rem` and grow with content.
- `.p-dropdown` and `.p-multiselect` are wrapper divs; children stretch vertically via `inline-flex` default.

**Do not** set component-local heights (e.g. `className="h-10"`) on these controls — let the global rule own the height, and use Tailwind only for **width**, **padding around the control**, or **label+input stacks**. This keeps the design token in one place and prevents pixel drift.

**Related tap-target note (§11.5 / §10):** the 44px tap-target minimum applies to **buttons, nav items, and interactive icons** — not to form inputs. A 40px text input is WCAG-compliant (users interact with text, not tap area) and standard across major design systems (Material, Ant, HIG).

### 13.6 Additional Component Overrides

```css
/* Tag / Badge */
.p-tag {
  border-radius: 9999px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 4px 10px !important;
}

/* Tooltip */
.p-tooltip .p-tooltip-text {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 8px !important;
  color: #f1f5f9 !important;
  font-size: 13px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

/* TabView */
.p-tabview .p-tabview-nav {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10) !important;
}

.p-tabview .p-tabview-nav li .p-tabview-nav-link {
  background: transparent !important;
  color: #64748b !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  transition: all 200ms ease !important;
}

.p-tabview .p-tabview-nav li .p-tabview-nav-link:hover {
  color: #94a3b8 !important;
}

.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
  color: #06b6d4 !important;
  border-bottom-color: #06b6d4 !important;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2) !important;
}

.p-tabview .p-tabview-panels {
  background: transparent !important;
}

/* Dropdown */
.p-dropdown {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 8px !important;
  color: #f1f5f9 !important;
}

/*
 * Dropdown renders an internal <input class="p-dropdown-label p-inputtext">
 * for keyboard a11y. The global .p-inputtext border cascades to it and
 * creates a visible inner border INSIDE the outer .p-dropdown border.
 * Always nullify to avoid a double-border visual.
 */
.p-dropdown .p-inputtext,
.p-dropdown input.p-dropdown-label {
  background: transparent !important;
  border: 0 none !important;
  box-shadow: none !important;
  min-height: 0 !important;
}

.p-dropdown-panel {
  background: rgba(15, 23, 42, 0.90) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item {
  color: #94a3b8 !important;
  border-radius: 8px !important;
  margin: 2px 4px !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #f1f5f9 !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
  background: rgba(6, 182, 212, 0.10) !important;
  color: #06b6d4 !important;
}

/* Checkbox */
.p-checkbox .p-checkbox-box {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.20) !important;
  border-radius: 4px !important;
  transition: all 150ms ease !important;
}

.p-checkbox .p-checkbox-box.p-highlight {
  background: #06b6d4 !important;
  border-color: #06b6d4 !important;
}

/* ProgressBar */
.p-progressbar {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 9999px !important;
  height: 6px !important;
}

.p-progressbar .p-progressbar-value {
  background: linear-gradient(90deg, #06b6d4, #3b82f6) !important;
  border-radius: 9999px !important;
}
```

---

## 14. Tailwind Configuration

The complete Tailwind CSS configuration to implement the NeoGlass design system:

```js
// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // === COLORS ===
      colors: {
        // Background layers
        'bg-void': '#030712',
        'bg-abyss': '#0a0f1e',
        'bg-surface': '#111827',
        'bg-elevated': '#1f2937',
        'bg-hover': '#374151',

        // Accent colors
        'accent-cyan': '#06b6d4',
        'accent-violet': '#8b5cf6',
        'accent-amber': '#f59e0b',
        'accent-emerald': '#10b981',
        'accent-rose': '#f43f5e',
        'accent-blue': '#3b82f6',

        // Text
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'text-disabled': '#475569',

        // Glass
        glass: {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.10)',
          hover: 'rgba(255, 255, 255, 0.08)',
          active: 'rgba(255, 255, 255, 0.12)',
          overlay: 'rgba(0, 0, 0, 0.60)',
        },
      },

      // === FONTS ===
      fontFamily: {
        heading: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
        body: ['"Inter"', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },

      // === FONT SIZE (with line-height) ===
      fontSize: {
        'xs':   ['0.75rem',   { lineHeight: '1rem' }],
        'sm':   ['0.875rem',  { lineHeight: '1.25rem' }],
        'base': ['1rem',      { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem',  { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',    { lineHeight: '2rem' }],
        '3xl':  ['1.875rem',  { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',   { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',      { lineHeight: '3rem' }],
        '6xl':  ['3.75rem',   { lineHeight: '3.75rem' }],
      },

      // === LETTER SPACING ===
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '0em',
        wide: '0.05em',
        wider: '0.08em',
      },

      // === BORDER RADIUS ===
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // === BACKDROP BLUR ===
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'DEFAULT': '12px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },

      // === MAX WIDTH (Containers) ===
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px',
      },

      // === BOX SHADOW ===
      boxShadow: {
        // Elevation levels
        'level-0': 'none',
        'level-1': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'level-2': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'level-3': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'level-4': '0 16px 48px rgba(0, 0, 0, 0.6)',

        // Glow effects
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.2)',
        'glow-cyan-intense': '0 0 20px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.2)',
        'glow-violet-intense': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.2)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.2)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.2)',

        // Focus ring glow
        'ring-glow-cyan': '0 0 0 3px rgba(6, 182, 212, 0.15), 0 0 20px rgba(6, 182, 212, 0.1)',
      },

      // === ANIMATION ===
      animation: {
        'fade-up': 'fade-up 300ms cubic-bezier(0, 0, 0.2, 1) forwards',
        'fade-in': 'fade-in 200ms ease forwards',
        'slide-in-right': 'slide-in-right 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-left': 'slide-in-left 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'mesh-drift': 'mesh-drift 20s ease-in-out infinite',
        'shrink-width': 'shrink-width 5s linear forwards',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-100%) scale(0.95)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'status-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 0 4px rgba(16, 185, 129, 0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'mesh-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
        },
        'shrink-width': {
          from: { width: '100%' },
          to: { width: '0%' },
        },
      },

      // === TRANSITION DURATION ===
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
        'dramatic': '600ms',
      },

      // === TRANSITION TIMING FUNCTION ===
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },

    // === SCREENS (Breakpoints) ===
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },

  plugins: [
    // Custom plugin for glass utilities
    function ({ addUtilities }) {
      addUtilities({
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          'border-radius': '16px',
        },
        '.glass-panel': {
          background: 'rgba(15, 23, 42, 0.80)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-input': {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          'border-radius': '8px',
          color: '#f1f5f9',
        },
        '.glass-dropdown': {
          background: 'rgba(15, 23, 42, 0.90)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          'border-radius': '12px',
        },
        '.skeleton': {
          background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
          'background-size': '200% 100%',
          'border-radius': '8px',
        },
      });
    },
  ],
};
```

### 14.1 CSS Custom Properties Layer

In addition to Tailwind config, define CSS custom properties in your global stylesheet for use in PrimeReact overrides and runtime theme switching:

```css
/* globals.css or app.css */

@layer base {
  :root {
    /* Backgrounds */
    --neo-bg-void: 3 7 18;
    --neo-bg-abyss: 10 15 30;
    --neo-bg-surface: 17 24 39;
    --neo-bg-elevated: 31 41 55;
    --neo-bg-hover: 55 65 81;

    /* Accents */
    --neo-accent-cyan: 6 182 212;
    --neo-accent-violet: 139 92 246;
    --neo-accent-amber: 245 158 11;
    --neo-accent-emerald: 16 185 129;
    --neo-accent-rose: 244 63 94;
    --neo-accent-blue: 59 130 246;

    /* Text */
    --neo-text-primary: 241 245 249;
    --neo-text-secondary: 148 163 184;
    --neo-text-muted: 100 116 139;
    --neo-text-disabled: 71 85 105;

    /* Motion */
    --neo-duration-fast: 150ms;
    --neo-duration-normal: 250ms;
    --neo-duration-slow: 400ms;
    --neo-duration-dramatic: 600ms;
    --neo-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
    --neo-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Dark mode is the default */
  body {
    background-color: rgb(var(--neo-bg-abyss));
    color: rgb(var(--neo-text-primary));
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Scrollbar styling (Webkit) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.10);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.20);
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.10) transparent;
}

/* Selection */
::selection {
  background: rgba(6, 182, 212, 0.3);
  color: #f1f5f9;
}
```

---

## Quick Reference Card

```
NEOGLASS DESIGN SYSTEM - QUICK REFERENCE

BACKGROUNDS:     void #030712 | abyss #0a0f1e | surface #111827 | elevated #1f2937
ACCENTS:         cyan #06b6d4 | violet #8b5cf6 | amber #f59e0b | emerald #10b981 | rose #f43f5e | blue #3b82f6
TEXT:            primary #f1f5f9 | secondary #94a3b8 | muted #64748b
GLASS:           bg white/5 | border white/10 | hover white/8
FONTS:           heading: Space Grotesk | body: Inter | mono: JetBrains Mono
RADIUS:          sm 4px | md 8px | lg 12px | xl 16px
BLUR:            card 12px | panel 20px | backdrop 4px
DURATION:        fast 150ms | normal 250ms | slow 400ms | dramatic 600ms
EASING:          standard cubic-bezier(0.4, 0, 0.2, 1) | spring cubic-bezier(0.34, 1.56, 0.64, 1)
SHADOWS:         L1 subtle | L2 cards | L3 modals | L4 overlays | glow: 0 0 20px accent/20
```

---

*NeoGlass. Built for the void. Illuminated by intent.*
