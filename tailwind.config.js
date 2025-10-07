/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        accent: '#FCA311',
        dark: '#1A1A2E',
        light: '#F5F5F5'
      }
    },
  },
  plugins: [],
};