import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255,255,255,0.08)',
        input: 'rgba(255,255,255,0.06)',
        ring: '#3B82F6',
        background: '#0B1220',
        foreground: '#E2E8F0',
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        secondary: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          foreground: '#E2E8F0',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          foreground: '#94A3B8',
        },
        accent: {
          DEFAULT: '#60A5FA',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#0F172A',
          foreground: '#E2E8F0',
        },
        card: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          foreground: '#E2E8F0',
        },
        surface: {
          DEFAULT: '#1E293B',
          50: '#334155',
          100: '#1E293B',
          200: '#0F172A',
          300: '#020617',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-x': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'aurora': {
          '0%,100%': { 'background-position': '50% 50%, 50% 50%' },
          '50%': { 'background-position': '350% 50%, 350% 50%' },
        },
        'spotlight': {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%,-40%) scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        aurora: 'aurora 60s linear infinite',
        spotlight: 'spotlight 2s ease 0.75s 1 forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config
