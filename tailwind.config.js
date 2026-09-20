/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          gold: '#d97706',
          'gold-light': '#fef3c7',
          'gold-dark': '#b45309',
        },
        slate: {
          850: '#131e29',
          950: '#0b1315',
        }
      },
      fontFamily: {
        bangla: ['"Hind Siliguri"', 'SolaimanLipi', 'sans-serif'],
        arabic: ['Amiri', 'Traditional Arabic', 'serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
