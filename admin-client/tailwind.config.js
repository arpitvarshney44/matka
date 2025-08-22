/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
        },
        secondary: {
          500: '#000000',
          600: '#1f2937',
        },
        matka: {
          green: {
            50: '#f0fdf4',
            100: '#d1fae5',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          },
          grey: {
            800: '#1f2937',
            900: '#111827',
          }
        }
      }
    },
  },
  plugins: [],
} 