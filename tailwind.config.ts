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
        // Display face — used ONLY for brand/display moments (wordmark, page
        // titles, the moon-phase name, the verdict headline). Never on controls,
        // labels or data; Quicksand carries all functional UI.
        herculanum: ['Herculanum', 'ui-serif', 'serif'],
        sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // The night-sky gradient stops (kept in sync with App.tsx).
        sky: { 950: '#07071c', 900: '#0f0f30', 800: '#181747', 700: '#232255' },
        // Text ramp — light indigo on the deep sky. All ≥4.5:1 on panels.
        ink: { DEFAULT: '#ffffff', soft: '#c3c9ef', mute: '#969ed0' },
        // Moonlight — the single warm accent.
        moon: { DEFAULT: '#ffe8a6', soft: '#f4dc9f' },
        cream: '#fefce8',
      },
      letterSpacing: {
        display: '-0.02em',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
