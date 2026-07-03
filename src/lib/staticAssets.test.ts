import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GET as getSitemap } from "../pages/sitemap.xml";
import { SITE_ROUTES } from "./siteMetadata";

const rootDir = process.cwd();

describe("static deployment assets", () => {
  it("defines the public routes used by the sitemap", () => {
    expect(SITE_ROUTES.map((route) => route.path)).toEqual([
      "/",
      "/ai-pacer/",
      "/about/",
      "/privacy/",
      "/terms/"
    ]);
  });

  it("ships robots.txt with sitemap discovery", () => {
    const robotsPath = join(rootDir, "public", "robots.txt");

    expect(existsSync(robotsPath)).toBe(true);
    expect(readFileSync(robotsPath, "utf8")).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("ships a web manifest for install metadata without app shortcuts", () => {
    const manifestPath = join(rootDir, "public", "site.webmanifest");

    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest.name).toBe("AI Pacer");
    expect(manifest.start_url).toBe("/ai-pacer/");
    expect(manifest.shortcuts).toBeUndefined();
  });

  it("ships a local favicon and manifest icon metadata", () => {
    const faviconPath = join(rootDir, "public", "favicon.svg");
    const manifestPath = join(rootDir, "public", "site.webmanifest");

    expect(existsSync(faviconPath)).toBe(true);

    const favicon = readFileSync(faviconPath, "utf8");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(favicon).toContain("<svg");
    expect(manifest.icons).toContainEqual({
      src: "/favicon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable"
    });
  });

  it("generates a static sitemap containing every public route", async () => {
    const response = getSitemap();
    const sitemap = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    for (const route of SITE_ROUTES) {
      expect(sitemap).toContain(`https://example.com${route.path}`);
    }
  });
});
