/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracota: '#8c3b1b',
        fundo: '#fff5ec',
      }
    },
  },
  plugins: [],
}
