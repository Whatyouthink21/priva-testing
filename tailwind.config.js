/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070a',
          900: '#0b0b10',
          850: '#101017',
          800: '#15151d',
          700: '#1d1d27',
          600: '#272733',
        },
        // Driven by CSS variables so a single page can re-tint itself
        // (see the adaptive palette on movie/TV detail pages).
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
        },
        accent: {
          2: 'rgb(var(--accent-2) / <alpha-value>)',
          3: 'rgb(var(--accent-3) / <alpha-value>)',
          4: 'rgb(var(--accent-4) / <alpha-value>)',
        },
        gold: '#f5c518',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px -20px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgb(var(--brand) / 0.45), 0 18px 50px -12px rgb(var(--brand) / 0.5)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        kenburns: {
          '0%': { transform: 'scale(1.04) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.14) translate3d(-1.2%,-1%,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--brand) / 0.55)' },
          '100%': { boxShadow: '0 0 0 14px rgb(var(--brand) / 0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both',
        fadeIn: 'fadeIn 0.6s ease-out both',
        kenburns: 'kenburns 18s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
        floaty: 'floaty 5s ease-in-out infinite',
      },
      opacity: {
        2: '0.02',
        3: '0.03',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        72: '0.72',
        85: '0.85',
        97: '0.97',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
