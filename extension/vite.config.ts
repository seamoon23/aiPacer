import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

export default defineConfig({
  root: "extension",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./popup.html", import.meta.url))
    }
  }
});
