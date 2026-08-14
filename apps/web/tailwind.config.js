/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── VOX Design Tokens ──────────────────────────────────────
        paper: "#F2EDE2",
        "ink-navy": "#111820",
        charcoal: "#1F2126",
        "vixor-red": "#D94B3D",
        mustard: "#D8AA45",
        "deep-teal": "#0E5B56",
        "warm-brown": "#5B3A28",
        "char-orange": "#F68B1E",
        // ─── Surface palette ────────────────────────────────────────
        surface: {
          50: "#1A1F26",
          100: "#161B21",
          200: "#111820",
          300: "#0D1217",
          400: "#090D12",
        },
        // ─── Muted accent ───────────────────────────────────────────
        accent: {
          red: "#D94B3D",
          mustard: "#D8AA45",
          teal: "#0E5B56",
          orange: "#F68B1E",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        ui: ["var(--font-inter)", "sans-serif"],
        arabic: ["var(--font-ibm-plex-arabic)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "marker-draw": "markerDraw 0.4s ease-out forwards",
        "paper-slide": "paperSlide 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        markerDraw: {
          "0%": { strokeDashoffset: "100%" },
          "100%": { strokeDashoffset: "0%" },
        },
        paperSlide: {
          "0%": { transform: "translateX(-100%) rotate(-2deg)" },
          "100%": { transform: "translateX(0) rotate(0deg)" },
        },
      },
      backgroundImage: {
        "paper-grain":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
