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
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B7CF6',
          600: '#6C5CE7',
          700: '#5842D8',
          800: '#4834C4',
          900: '#3C28A8',
        },
        ink: '#15141F',
        surface: {
          light: '#F3F2F7',
          card: '#FFFFFF',
          dark: '#0F0E17',
          darkCard: '#1A1829',
          darkSubtle: '#252238'
        },
        growth: '#1FAE71',
        danger: '#FF6B57',
        caution: '#F5A524',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 36px rgba(108, 92, 231, 0.22)',
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
