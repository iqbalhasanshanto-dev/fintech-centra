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
          light: '#F3F2F7',
          card: '#FFFFFF',
          dark: '#0b0d14',
          darkCard: '#131722',
          darkSubtle: '#1e2638',
          darkBorder: '#1e2638',
        },
        growth: '#1FAE71',
        danger: '#FF6B57',
        caution: '#F5A524',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 36px rgba(99, 102, 241, 0.25)',
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '28px',
      }
    },
  },
  plugins: [],
}
