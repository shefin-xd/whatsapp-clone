// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Crucial: This tells Tailwind to scan all JS, TS, JSX, TSX files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
