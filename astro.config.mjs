import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://example.com",
  devToolbar: { enabled: false },
  integrations: [react()]
});
