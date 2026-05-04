import {
  getAllSitemapContent,
  isOtherContentEntry,
  SITEMAP_BASE_URL,
  SITEMAP_CACHE_CONTROL,
  SITEMAP_REVALIDATE,
  toIsoDate,
} from "@/lib/sitemap-content";

export const revalidate = SITEMAP_REVALIDATE;

export async function GET() {
  const contentEntries = (await getAllSitemapContent()).filter(isOtherContentEntry);

  const urls = contentEntries
    .map(
      (entry) =>
        `<url><loc>${SITEMAP_BASE_URL}${entry.path}</loc><lastmod>${toIsoDate(entry.updatedAt)}</lastmod><changefreq>weekly</changefreq><priority>0.70</priority></url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}
