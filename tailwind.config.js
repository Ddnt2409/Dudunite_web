/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        orangeLight: '#fffaf5',
        orangeMid: '#ea580c',
        orangeDark: '#c2410c',
      }
    },
  },
  plugins: [],
}
