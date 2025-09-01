// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        herculanum: ['Herculanum', 'sans-serif'],
        sans: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
