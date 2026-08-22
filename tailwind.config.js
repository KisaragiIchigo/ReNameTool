/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#F8FAFC',
          surface: '#FFFFFF',
          raised: '#F1F5F9',
          hover: '#E2E8F0',
        },
        border: {
          subtle: 'rgba(15, 23, 42, 0.06)',
          default: 'rgba(15, 23, 42, 0.12)',
          focus: '#2563EB',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        accent: {
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          'primary-glow': 'rgba(37, 99, 235, 0.12)',
          secondary: '#4F46E5',
          'secondary-hover': '#4338CA',
        },
        status: {
          success: '#16A34A',
          'success-bg': '#DCFCE7',
          warning: '#D97706',
          'warning-bg': '#FEF3C7',
          error: '#DC2626',
          'error-bg': '#FEE2E2',
          'diff-add': '#15803D',
          'diff-add-bg': '#DCFCE7',
          'diff-del': '#B91C1C',
          'diff-del-bg': '#FEE2E2',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"BIZ UDPGothic"', '"Hiragino Sans"', '"Noto Sans JP"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 10px 30px -4px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
