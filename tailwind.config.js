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
          bg: '#0A0A0A',
          card: '#171717',
          subtle: '#262626',
          border: '#404040',
        },
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#2F6FED',
          600: '#2F6FED',
          700: '#2559BE',
          800: '#1D4594',
          900: '#17336D',
          DEFAULT: '#2F6FED',
          lime: '#C6FF3D',
        },
        surface: {
          light: '#FAFAFA',
          card: '#FFFFFF',
          secondary: '#F5F5F5',
          border: '#E5E5E5',
          dark: '#0A0A0A',
          darkCard: '#171717',
          darkBorder: '#404040',
          darkSubtle: '#262626',
        },
        growth: '#16A34A',
        danger: '#E11D48',
        caution: '#F59E0B',
        income: '#16A34A',
        expense: '#E11D48',
      },
      boxShadow: {
        'float': '0 8px 24px -4px rgba(47, 111, 237, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
