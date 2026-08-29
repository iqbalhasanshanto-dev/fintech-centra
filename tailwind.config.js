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
        carbon: {
          bg: '#0A0E1A',
          card: '#121A2C',
          subtle: '#232C45',
          border: '#232C45',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#4F46E5',
        },
        surface: {
          light: '#FAFAFA',
          card: '#FFFFFF',
          border: '#E5E7EB',
          dark: '#0A0E1A',       // richer navy-black canvas
          darkCard: '#121A2C',   // clearly lighter than canvas
          darkBorder: '#232C45', // visibly lighter than the card
          darkSubtle: '#232C45', // same as darkBorder
        },
        growth: '#10B981',
        danger: '#EF4444',
        caution: '#F59E0B',
      },
      boxShadow: {
        'float': '0 8px 24px -4px rgba(99, 102, 241, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
