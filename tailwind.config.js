/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#0f172a', // "Deep slates"
        },
        indigo: {
          600: '#4f46e6', // "Indigo accents"
        }
      },
      fontFamily: {
        serif: ['"Merriweather"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        crimson: ['"Crimson Pro"', 'serif'],
        lora: ['"Lora"', 'serif'],
        playfair: ['"Playfair Display"', 'serif'],
        libre: ['"Libre Baskerville"', 'serif'],
      }
    },
  },
  plugins: [],
}
