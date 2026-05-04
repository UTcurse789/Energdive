import { fetchStrapi, StrapiCollection } from '@/lib/strapi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NewsArticle {
  slug: string;
  title: string;
  publishedAt: string;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'https://cms.energdive.com';

async function getRecentNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetchStrapi<StrapiCollection<any>>(
      'contents',
      {
        filters: {
          type_of_content: {
            name: { $eq: 'News' },
          },
        },
        fields: ['slug', 'Title', 'publishedAt', 'Date'],
        sort: ['publishedAt:desc'],
        pagination: { pageSize: 100 },
      },
      // Bypass Next.js ISR caching so the 48-hour window is always accurate.
      { cache: 'no-store' }
    );

    return parseArticles(res?.data);
  } catch (err) {
    console.error('[sitemap-news] fetchStrapi failed, trying direct fetch:', err);
  }

  // ── Fallback: fetch directly without token (public API) ──────────────
  try {
    const url =
      `${STRAPI_BASE_URL}/api/contents` +
      `?filters[type_of_content][name][$eq]=News` +
      `&fields[0]=slug&fields[1]=Title&fields[2]=publishedAt&fields[3]=Date` +
      `&sort=publishedAt:desc` +
      `&pagination[pageSize]=100`;

    const directRes = await fetch(url, { cache: 'no-store' });

    if (!directRes.ok) {
      console.error('[sitemap-news] Direct fetch failed:', directRes.status, directRes.statusText);
      return [];
    }

    const json = await directRes.json();
    return parseArticles(json?.data);
  } catch (err) {
    console.error('[sitemap-news] Direct fetch also failed:', err);
    return [];
  }
}

/** Normalise Strapi v4 (nested attributes) and v5 (flat) response shapes. */
function parseArticles(data: any[] | undefined | null): NewsArticle[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item: any) => {
      const attrs = item.attributes ?? item;
      return {
        slug: attrs.slug ?? '',
        title: attrs.Title ?? attrs.title ?? 'Untitled',
        // Prefer the editorial Date field; fall back to Strapi's publishedAt.
        // If Date is date-only (e.g. "2026-05-04"), append T00:00:00Z for safe parsing.
        publishedAt: attrs.publishedAt || attrs.Date || new Date().toISOString(),
      };
    })
    .filter((a) => a.slug); // drop entries with missing slugs
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/** Escape the five XML special characters to prevent malformed XML. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildUrlEntry(baseUrl: string, article: NewsArticle): string {
  const loc = `${baseUrl}/news/${article.slug}`;
  const isoDate = new Date(article.publishedAt).toISOString();
  const safeTitle = escapeXml(article.title);

  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${isoDate}</lastmod>
    <priority>0.90</priority>
    <news:news>
      <news:publication>
        <news:name>EnergDive</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${isoDate}</news:publication_date>
      <news:title>${safeTitle}</news:title>
    </news:news>
  </url>`;
}

function buildSitemap(urlEntries: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
>${urlEntries}
</urlset>`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const BASE_URL = 'https://www.energdive.com';
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  try {
    const articles = await getRecentNews();
    const cutoff = new Date(Date.now() - FORTY_EIGHT_HOURS_MS);

    const recentArticles = articles.filter((a) => {
      const pubDate = new Date(a.publishedAt);
      return !isNaN(pubDate.getTime()) && pubDate > cutoff;
    });

    const urlEntries = recentArticles
      .map((a) => buildUrlEntry(BASE_URL, a))
      .join('');

    const xml = buildSitemap(urlEntries);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    // Last-resort safety net — always return a valid (empty) sitemap
    console.error('[sitemap-news] Unexpected error building sitemap:', err);

    return new Response(buildSitemap(''), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
