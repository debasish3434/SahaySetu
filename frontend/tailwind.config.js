/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // SahaySetu operations palette: navy structure, blue actions, and semantic statuses.
      colors: {
        brand: {
          950: '#0B192E', 900: '#142B4A', 800: '#1C3B62', 700: '#244B78',
          600: '#2F5F91', 500: '#3B74AA', 400: '#6B96C1', 300: '#A8C0D8',
          200: '#CAD8E7', 100: '#E7EEF5', 50: '#F3F7FA',
        },
        accent: {
          800: '#1E40AF', 700: '#1D4ED8', 600: '#2563EB', 500: '#3B82F6',
          400: '#60A5FA', 300: '#93C5FD', 200: '#BFDBFE', 100: '#DBEAFE', 50: '#EFF6FF',
        },
        bridge: {
          700: '#0B6459',
          600: '#0D7B6D',
          500: '#10897C',
          400: '#3AA99C',
          100: '#DAF1EC',
        },
        danger: {
          700: '#991B1B',
          600: '#B91C1C',
          500: '#DC2626',
          400: '#F87171',
          200: '#FECACA',
          100: '#FDE4E4',
          50: '#FEF2F2',
        },
        success: {
          700: '#166534',
          600: '#15803D',
          500: '#16A34A',
          400: '#4ADE80',
          200: '#BBF7D0',
          100: '#DCFCE7',
          50: '#F0FDF4',
        },
        warning: {
          800: '#92400E',
          700: '#B45309',
          600: '#D97706',
          500: '#D97706',
          400: '#FBBF24',
          200: '#FDE68A',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        surface: {
          DEFAULT: '#F8FAFC', 50: '#F8FAFC', 100: '#F1F5F9',
          200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8',
        },
        ink: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.14)',
        'card-hover': '0 8px 22px -12px rgba(15,23,42,0.22)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
