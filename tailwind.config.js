// book-notes-app/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'speedmaster-accent': '#0072CE',
          'speedmaster-dark': '#1A1A1A',
          'speedmaster-metallic': '#C0C0C0',
        },
        boxShadow: {
          'speedmaster': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    plugins: [],
  }