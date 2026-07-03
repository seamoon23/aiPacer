export const SITE_URL = "https://example.com";

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
