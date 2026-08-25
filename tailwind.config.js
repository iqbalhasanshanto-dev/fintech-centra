/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#6366F1',
          700: '#4F46E5',
          800: '#4338CA',
          900: '#3730A3',
          DEFAULT: '#6366F1',
        },
        ink: '#15141F',
        surface: {
          light: '#F8FAFC',
          card: '#FFFFFF',
          dark: '#0B0F17',
          darkCard: '#161B26',
          darkSubtle: '#1E2536',
          darkBorder: '#262C3A',
        },
        growth: '#10B981',
        danger: '#EF4444',
        caution: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Bengali"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans Bengali"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 36px rgba(0, 0, 0, 0.25)',
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
