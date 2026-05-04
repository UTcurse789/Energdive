import { fetchStrapi, StrapiCollection } from '@/lib/strapi';

interface NewsItemAttributes {
  slug: string;
  Title: string;
  title?: string;
  publishedAt: string;
  Date: string;
  createdAt?: string;
}

interface NewsItemEntry {
  attributes?: Partial<NewsItemAttributes>;
  slug?: string;
  Title?: string;
  title?: string;
  publishedAt?: string;
  Date?: string;
  createdAt?: string;
}

async function getRecentNews(): Promise<{ slug: string; title: string; publishedAt: string }[]> {
  try {
    const res = await fetchStrapi<StrapiCollection<NewsItemEntry>>('contents', {
      filters: {
        type_of_content: {
          name: { $eq: 'News' },
        },
      },
      fields: ['slug', 'Title', 'publishedAt', 'Date'],
      sort: ['publishedAt:desc'],
      pagination: { pageSize: 100 },
    });

    return (res.data || [])
      .map((item) => {
        const attrs = item.attributes || item;
        const slug = attrs.slug;
        const title = attrs.Title || attrs.title || 'Untitled';
        const publishedAt = attrs.Date || attrs.publishedAt || attrs.createdAt;

        if (!slug || !publishedAt) {
          return null;
        }

        return { slug, title, publishedAt };
      })
      .filter(
        (item): item is { slug: string; title: string; publishedAt: string } =>
          item !== null
      );
  } catch (err) {
    console.error('Sitemap news fetch error:', err);
    return [];
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = 'https://www.energdive.com';
  const articles = await getRecentNews();
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const recent = articles.filter(
    (a) => new Date(a.publishedAt) > twoDaysAgo
  );

  const urls = recent
    .map(
      (a) => `
  <url>
    <loc>${baseUrl}/news/${a.slug}</loc>
    <news:news>
      <news:publication><news:name>EnergDive</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${new Date(a.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
    <lastmod>${new Date(a.publishedAt).toISOString()}</lastmod>
    <priority>0.90</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
