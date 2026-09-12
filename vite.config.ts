import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Base relativo é essencial para o Electron carregar os arquivos
// corretamente com file:// depois de empacotado.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
});
