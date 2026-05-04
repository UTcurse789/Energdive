import {
  escapeXml as escapeXmlValue,
  getAllSitemapContent,
  isNewsEntry,
  SITEMAP_BASE_URL,
  SITEMAP_CACHE_CONTROL,
  toIsoDate,
} from "@/lib/sitemap-content";

export const revalidate = 600;

export async function GET() {
  const articles = (await getAllSitemapContent()).filter(isNewsEntry);

  const urls = articles
    .map(
      (a) => `
  <url>
    <loc>${SITEMAP_BASE_URL}${a.path}</loc>
    <news:news>
      <news:publication><news:name>EnergDive</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${toIsoDate(a.publishedAt)}</news:publication_date>
      <news:title>${escapeXmlValue(a.title)}</news:title>
    </news:news>
    <lastmod>${toIsoDate(a.updatedAt)}</lastmod>
    <priority>0.90</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
}
