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
    expect(readFileSync(robotsPath, "utf8")).toContain(
      "Sitemap: https://example.com/sitemap.xml"
    );
  });

  it("ships install metadata with the new mascot icons", () => {
    const manifestPath = join(rootDir, "public", "site.webmanifest");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest.name).toBe("AI Pacer");
    expect(manifest.start_url).toBe("/ai-pacer/");
    expect(manifest.shortcuts).toBeUndefined();
    expect(manifest.icons).toEqual([
      expect.objectContaining({
        src: "/assets/ai-pacer-icon-192.png",
        sizes: "192x192"
      }),
      expect.objectContaining({
        src: "/assets/ai-pacer-icon-512.png",
        sizes: "512x512"
      })
    ]);

    for (const icon of manifest.icons) {
      expect(existsSync(join(rootDir, "public", icon.src))).toBe(true);
    }
  });

  it("ships a permission-free Manifest V3 extension", () => {
    const manifestPath = join(rootDir, "extension", "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action.default_popup).toBe("popup.html");
    expect(manifest.permissions).toBeUndefined();
    expect(manifest.host_permissions).toBeUndefined();

    for (const iconPath of Object.values<string>(manifest.icons)) {
      expect(existsSync(join(rootDir, "extension", iconPath))).toBe(true);
    }
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