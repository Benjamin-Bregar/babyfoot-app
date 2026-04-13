/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        night: '#13253b',
        mint: '#e9f4ef',
        fire: '#ff6b35',
        gold: '#f6bd60',
      },
      fontFamily: {
        body: ['DM Sans', 'Segoe UI', 'sans-serif'],
        title: ['Sora', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

