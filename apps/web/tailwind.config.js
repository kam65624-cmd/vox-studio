/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2EDE2",
        ink: "#111820",
        charcoal: "#1F2126",
        vixor: "#D94B3D",
        mustard: "#D8AA45",
        teal: "#0E5B56",
        brown: "#5B3A28",
      },
      fontFamily: {
        display: ["Bebas Neue", "system-ui", "sans-serif"],
        body: ["IBM Plex Sans", "system-ui", "sans-serif"],
        arabic: ["IBM Plex Sans Arabic", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
