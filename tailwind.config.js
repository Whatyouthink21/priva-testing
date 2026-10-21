/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
      },
      colors: {
        canvas: '#0f1014',
        surface: {
          DEFAULT: '#16181f',
          elevated: '#1b1e29',
          hover: '#222636',
        },
        accent: {
          DEFAULT: '#2563eb',
          bright: '#3b82f6',
          deep: '#062794',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        heroIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        heroBgIn: {
          '0%': { opacity: '0.2' },
          '100%': { opacity: '1' },
        },
        popCard: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pageFade: {
          '0%': { opacity: '0.72' },
          '100%': { opacity: '1' },
        },
        progressFill: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        posterFlowUp: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, -50%, 0)' },
        },
        posterFlowDown: {
          '0%': { transform: 'translate3d(0, -50%, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'hero-in': 'heroIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) both',
        'hero-bg': 'heroBgIn 0.45s ease-out both',
        'pop-card': 'popCard 0.2s cubic-bezier(0.2, 0.9, 0.3, 1) both',
        'page-fade': 'pageFade 0.2s ease-out',
        'hero-timer': 'progressFill 7s linear forwards',
        'poster-up': 'posterFlowUp 46s linear infinite',
        'poster-down': 'posterFlowDown 52s linear infinite',
      },
    },
  },
  plugins: [],
};
