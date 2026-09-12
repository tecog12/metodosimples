import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7f5",
          100: "#e0ece6",
          200: "#c1d9cd",
          300: "#96bfab",
          400: "#699e86",
          500: "#47806a",
          600: "#356654",
          700: "#2b5245",
          800: "#254238",
          900: "#20372f",
          950: "#0f1f1a",
        },
        sand: {
          50: "#faf8f4",
          100: "#f3ede1",
          200: "#e6d9c2",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
