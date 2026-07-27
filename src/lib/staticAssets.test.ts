import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GET as getSitemap } from "../pages/sitemap.xml";
import {
  PRIVACY_POLICY_URL,
  SITE_BASE_PATH,
  SITE_ROUTES,
  SITE_URL,
  withBasePath
} from "./siteMetadata";

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

  it("uses the GitHub Pages project path for public routes", () => {
    expect(SITE_BASE_PATH).toBe("/aiPacer");
    expect(withBasePath("/privacy/")).toBe("/aiPacer/privacy/");
    expect(PRIVACY_POLICY_URL).toBe(
      "https://seamoon23.github.io/aiPacer/privacy/"
    );
  });

  it("ships robots.txt with sitemap discovery", () => {
    const robotsPath = join(rootDir, "public", "robots.txt");

    expect(existsSync(robotsPath)).toBe(true);
    expect(readFileSync(robotsPath, "utf8")).toContain(
      `${SITE_URL}/sitemap.xml`
    );
  });

  it("ships install metadata with the new mascot icons", () => {
    const manifestPath = join(rootDir, "public", "site.webmanifest");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    expect(manifest.name).toBe("AI Pacer");
    expect(manifest.start_url).toBe("./ai-pacer/");
    expect(manifest.scope).toBe("./");
    expect(manifest.shortcuts).toBeUndefined();
    expect(manifest.icons).toEqual([
      expect.objectContaining({
        src: "assets/ai-pacer-icon-192.png",
        sizes: "192x192"
      }),
      expect.objectContaining({
        src: "assets/ai-pacer-icon-512.png",
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
    expect(manifest.version).toBe("0.3.0");
    expect(manifest.default_locale).toBe("ko");
    expect(manifest.name).toBe("__MSG_appName__");
    expect(manifest.permissions).toBeUndefined();
    expect(manifest.host_permissions).toBeUndefined();

    for (const iconPath of Object.values<string>(manifest.icons)) {
      expect(existsSync(join(rootDir, "extension", iconPath))).toBe(true);
    }

    for (const locale of ["ko", "en"]) {
      const messagesPath = join(
        rootDir,
        "extension",
        "_locales",
        locale,
        "messages.json"
      );
      const messages = JSON.parse(readFileSync(messagesPath, "utf8"));
      expect(messages.appName.message).toBe("AI Pacer");
      expect(messages.appDescription.message).toBeTruthy();
    }

    expect(
      existsSync(join(rootDir, "public", "assets", "dalkomi-portrait.webp"))
    ).toBe(true);
  });

  it("generates a static sitemap containing every public route", async () => {
    const response = getSitemap();
    const sitemap = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/xml");
    for (const route of SITE_ROUTES) {
      expect(sitemap).toContain(`${SITE_URL}${route.path}`);
    }
  });
});