/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          primary: {
            gold: "#D4AF37",
            "straw-yellow": "#F2E8A1",
            "soft-gold": "#E4D96F",
            espresso: "#1A120B",
            beige: "#F5F2EA",
            white: "#FFFFFF",
          },
          secondary: {
            growth: "#3E4A3D",
          },
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
