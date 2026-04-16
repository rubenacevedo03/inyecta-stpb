/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8e8',
          100: '#faefc5',
          200: '#f5df8a',
          300: '#efc94f',
          400: '#e8b828',
          500: '#c9a227',
          600: '#a67f1e',
          700: '#835e18',
          800: '#6c4c1a',
          900: '#5c401c',
        },
        inyecta: {
          dark: '#1a1a1a',
          gray: '#555555',
          light: '#f8f9fa',
        },
      },
    },
  },
  plugins: [],
};
