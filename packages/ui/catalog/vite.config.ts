import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("../../../.artifacts/ui-catalog", import.meta.url)),
    emptyOutDir: true,
  },
  plugins: [react()],
  server: {
    strictPort: true,
  },
});
