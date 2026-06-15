/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        presidio: {
          50: '#f0f4f9',
          100: '#e1e8f2',
          200: '#c3d1e6',
          300: '#a5bada',
          400: '#8703ce',
          500: '#1e40af',
          600: '#1e3a8a',
          700: '#1e40af',
          800: '#001d4d',
          900: '#0a1428',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
