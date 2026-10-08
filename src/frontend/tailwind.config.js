/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        petrol: "#00829B",
        navy: "#1B2A4A",
        surface: "#F0F1F3",
      },
    },
  },
  plugins: [],
};
