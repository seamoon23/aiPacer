import { SITE_ROUTES, SITE_URL } from "../lib/siteMetadata";

export function GET() {
  const urls = SITE_ROUTES.map((route) => {
    return [
      "  <url>",
      `    <loc>${SITE_URL}${route.path}</loc>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority.toFixed(1)}</priority>`,
      "  </url>"
    ].join("\n");
  }).join("\n");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>"
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
