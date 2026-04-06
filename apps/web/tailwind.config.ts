import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ['var(--font-heading)', ...defaultTheme.fontFamily.sans],
        heading: ['var(--font-heading)', ...defaultTheme.fontFamily.sans],
        body: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        label: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        // === Jester Quest M3 Design Tokens ===
        primary: '#ec4899',
        'primary-container': '#fce7f3',
        'on-primary': '#ffffff',

        secondary: '#3b82f6',
        'secondary-container': '#dbeafe',
        'on-secondary': '#ffffff',

        accent: '#f59e0b',

        background: '#f8fafc',
        surface: '#f8fafc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f5f9',
        'surface-container': '#e2e8f0',
        'surface-container-high': '#cbd5e1',
        'surface-container-highest': '#94a3b8',

        'on-surface': '#334155',
        'on-surface-variant': '#64748b',

        outline: '#94a3b8',
        'outline-variant': '#e2e8f0',

        error: '#ef4444',
        'error-container': '#fee2e2',
        'on-error': '#ffffff',

        success: '#22c55e',
        'success-container': '#dcfce7',

        warning: '#f59e0b',
        'warning-container': '#fef3c7',

        info: '#3b82f6',
        'info-container': '#dbeafe',

        // Legacy neutral scale (backwards compat)
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
        // Legacy semantic scales (PrimeReact compat)
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
