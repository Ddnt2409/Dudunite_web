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
        orangeDark: '#c2410c',
        orangeMid: '#ea580c',
      }
    },
  },
  plugins: [],
}
