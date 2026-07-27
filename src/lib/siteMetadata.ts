export const SITE_ORIGIN = "https://seamoon23.github.io";
export const SITE_BASE_PATH = "/aiPacer";
export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}`;
export const PRIVACY_POLICY_URL = `${SITE_URL}/privacy/`;

export function withBasePath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_BASE_PATH}${normalizedPath}`;
}

export const SITE_ROUTES = [
  {
    path: "/",
    priority: 0.8,
    changefreq: "weekly"
  },
  {
    path: "/ai-pacer/",
    priority: 1,
    changefreq: "weekly"
  },
  {
    path: "/about/",
    priority: 0.5,
    changefreq: "monthly"
  },
  {
    path: "/privacy/",
    priority: 0.4,
    changefreq: "yearly"
  },
  {
    path: "/terms/",
    priority: 0.4,
    changefreq: "yearly"
  }
] as const;
