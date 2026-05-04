import {
  getAllSitemapContent,
  isArticleEntry,
  SITEMAP_BASE_URL,
  SITEMAP_CACHE_CONTROL,
  toIsoDate,
} from "@/lib/sitemap-content";

export const revalidate = 600;

export async function GET() {
  const articles = (await getAllSitemapContent()).filter(isArticleEntry);

  const urls = articles
    .map(
      (a) =>
        `<url><loc>${SITEMAP_BASE_URL}${a.path}</loc><lastmod>${toIsoDate(a.updatedAt)}</lastmod><changefreq>weekly</changefreq><priority>0.70</priority></url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  });
}
