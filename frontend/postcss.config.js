// frontend/postcss.config.js
export default {
  plugins: {
    tailwindcss: {}, // <--- This should now be 'tailwindcss' again for v3
    autoprefixer: {},
  },
}
