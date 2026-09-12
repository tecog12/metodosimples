import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta principal — extraída da logo Método Simples (azul-marinho).
        // Usada no menu, botões, títulos e demais elementos de identidade.
        brand: {
          50: "#f6f7f9",
          100: "#e9edf2",
          200: "#cdd7e5",
          300: "#9cb5d3",
          400: "#618fc7",
          500: "#346aad",
          600: "#163862",
          700: "#122d4e",
          800: "#0d223b",
          900: "#091829",
          950: "#06101b",
        },
        // Verde reservado só para indicar valores financeiros positivos
        // (receitas, saldo positivo, orçamento dentro do limite) — mantém a
        // associação "verde = positivo" independente da cor da marca.
        positivo: {
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
