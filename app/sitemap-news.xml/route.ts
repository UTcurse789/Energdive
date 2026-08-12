import { NextResponse } from 'next/server';
import { fetchStrapi, StrapiCollection } from "@/lib/strapi";

interface NewsArticle {
  slug: string;
  title: string;
  publishedAt: string;
  updatedAt: string;
}

const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  'https://cms.energdive.com';

const BASE_URL = 'https://www.energdive.com';

/** Clean brand suffixes from headlines for Google News title purity */
function cleanHeadline(title: string): string {
  if (!title) return "Untitled";
  return title
    .replace(/\s*[\|-]\s*ENERGDIVE$/i, '')
    .replace(/\s*[\|-]\s*EnergDive$/i, '')
    .trim();
}

function parseArticles(data: any[]): NewsArticle[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const attrs = item.attributes || item || {};
    const rawPub = attrs.publishedAt || attrs.createdAt || attrs.Date;
    const rawUpd = attrs.updatedAt || rawPub;

    const pubDate = rawPub ? new Date(rawPub) : new Date();
    const updDate = rawUpd ? new Date(rawUpd) : pubDate;

    const validPub = !isNaN(pubDate.getTime()) ? pubDate.toISOString() : new Date().toISOString();
    const validUpd = !isNaN(updDate.getTime()) ? updDate.toISOString() : validPub;

    return {
      slug: attrs.slug || item.slug || "",
      title: cleanHeadline(attrs.Title || attrs.title || ""),
      publishedAt: validPub,
      updatedAt: validUpd,
    };
  }).filter((a) => Boolean(a.slug));
}

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
        // Explicitly request timestamp dimensions to resolve mapping failures
        fields: ['slug', 'Title', 'Date', 'publishedAt', 'updatedAt', 'createdAt'],
        sort: ['publishedAt:desc', 'Date:desc'],
        pagination: { pageSize: 100 },
      },
      { cache: 'no-store' }
    );
    return parseArticles(res?.data);
  } catch (err) {
    console.error('[sitemap-news] fetchStrapi failed, running direct fetch:', err);
    
    // Fixed fallback API query parameters to fetch timestamp dimensions
    const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=News&fields[0]=slug&fields[1]=Title&fields[2]=Date&fields[3]=publishedAt&fields[4]=updatedAt&fields[5]=createdAt&sort[0]=publishedAt:desc&pagination[pageSize]=100`;
    const fallbackRes = await fetch(url, { cache: 'no-store' });
    if (!fallbackRes.ok) throw new Error(`Fallback HTTP error: ${fallbackRes.status}`);
    const json = await fallbackRes.json();
    return parseArticles(json?.data);
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allNews = await getRecentNews();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Filter to ensure only articles published within the last 48 hours populate
    const recentNews = allNews.filter((article) => {
      const pubDate = new Date(article.publishedAt);
      return pubDate >= fortyEightHoursAgo && Boolean(article.slug);
    });

    const xmlItems = recentNews
      .map((article) => {
        const escapedTitle = article.title
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const loc = `${BASE_URL}/news/${article.slug}`;

        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date(article.updatedAt).toISOString()}</lastmod>
    <priority>0.90</priority>
    <news:news>
      <news:publication>
        <news:name>ENERGDIVE</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escapedTitle}</news:title>
    </news:news>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlItems}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
