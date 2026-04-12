import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  // Light mode — no darkMode config needed
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Breakpoints (outside extend to define explicitly)
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    extend: {
      // ═══════════════════════════════════════════
      // COLORS — NeoGlass Design System
      // ═══════════════════════════════════════════
      colors: {
        // --- Background layers (light mode) ---
        'bg-void': '#ffffff',
        'bg-abyss': '#f8fafc',
        'bg-surface': '#ffffff',
        'bg-elevated': '#f1f5f9',
        'bg-hover': '#e2e8f0',

        // --- Accent colors (pink primary, blue secondary) ---
        'accent-cyan': '#db2777',
        'accent-violet': '#2563eb',
        'accent-amber': '#d97706',
        'accent-emerald': '#059669',
        'accent-rose': '#e11d48',
        'accent-blue': '#2563eb',

        // --- Text (dark-on-light) ---
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-muted': '#94a3b8',
        'text-disabled': '#cbd5e1',

        // --- Glass (light card style) ---
        glass: {
          bg: 'rgba(255, 255, 255, 0.80)',
          border: 'rgba(0, 0, 0, 0.08)',
          hover: 'rgba(0, 0, 0, 0.04)',
          active: 'rgba(0, 0, 0, 0.06)',
          overlay: 'rgba(0, 0, 0, 0.30)',
        },

        // --- Legacy semantic colors (preserving for existing components) ---
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },

      // ═══════════════════════════════════════════
      // TYPOGRAPHY
      // ═══════════════════════════════════════════
      fontFamily: {
        heading: ['var(--font-heading)', ...defaultTheme.fontFamily.sans],
        body: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3rem' }],
        '6xl': ['3.75rem', { lineHeight: '3.75rem' }],
      },

      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '0em',
        wide: '0.05em',
        wider: '0.08em',
      },

      // ═══════════════════════════════════════════
      // BORDER RADIUS
      // ═══════════════════════════════════════════
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // ═══════════════════════════════════════════
      // BACKDROP BLUR
      // ═══════════════════════════════════════════
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },

      // ═══════════════════════════════════════════
      // MAX WIDTH (Containers)
      // ═══════════════════════════════════════════
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1536px',
      },

      // ═══════════════════════════════════════════
      // BOX SHADOW — Elevation + Glow
      // ═══════════════════════════════════════════
      boxShadow: {
        // Elevation levels (light mode)
        'level-0': 'none',
        'level-1': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'level-2': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'level-3': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'level-4': '0 16px 48px rgba(0, 0, 0, 0.16)',

        // Subtle colored shadows (light mode equivalents)
        'glow-cyan': '0 4px 14px rgba(219, 39, 119, 0.10)',
        'glow-cyan-intense': '0 4px 14px rgba(219, 39, 119, 0.15), 0 1px 3px rgba(219, 39, 119, 0.08)',
        'glow-violet': '0 4px 14px rgba(37, 99, 235, 0.10)',
        'glow-violet-intense': '0 4px 14px rgba(37, 99, 235, 0.15), 0 1px 3px rgba(37, 99, 235, 0.08)',
        'glow-amber': '0 4px 14px rgba(217, 119, 6, 0.10)',
        'glow-emerald': '0 4px 14px rgba(5, 150, 105, 0.10)',
        'glow-rose': '0 4px 14px rgba(225, 29, 72, 0.10)',
        'glow-blue': '0 4px 14px rgba(37, 99, 235, 0.10)',

        // Focus ring
        'ring-glow-cyan': '0 0 0 3px rgba(219, 39, 119, 0.15)',
      },

      // ═══════════════════════════════════════════
      // ANIMATION
      // ═══════════════════════════════════════════
      animation: {
        'fade-up': 'fade-up 300ms cubic-bezier(0, 0, 0.2, 1) forwards',
        'fade-in': 'fade-in 200ms ease forwards',
        'slide-in-right': 'slide-in-right 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-left': 'slide-in-left 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
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
        shimmer: {
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

      // ═══════════════════════════════════════════
      // TRANSITION
      // ═══════════════════════════════════════════
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
        dramatic: '600ms',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },

  plugins: [
    // Custom plugin for utility classes (light mode)
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.glass-card': {
          background: '#ffffff',
          'border-radius': '16px',
          'box-shadow': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        },
        '.glass-panel': {
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.06)',
        },
        '.glass-input': {
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          'border-radius': '8px',
          color: '#0f172a',
        },
        '.glass-dropdown': {
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          'border-radius': '12px',
          'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.10)',
        },
        '.skeleton': {
          background:
            'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          'background-size': '200% 100%',
          'border-radius': '8px',
        },
      });
    }),
  ],
};

export default config;
