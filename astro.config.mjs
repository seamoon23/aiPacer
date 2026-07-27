import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://seamoon23.github.io",
  base: "/aiPacer",
  devToolbar: { enabled: false },
  integrations: [react()]
});
