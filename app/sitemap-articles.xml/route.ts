import { fetchStrapi, StrapiCollection } from '@/lib/strapi';
import { buildContentUrl } from '@/lib/content-routes';

async function getAllContent(): Promise<
  { slug: string; path: string; publishedAt: string; updatedAt: string }[]
> {
  const allItems: any[] = [];
  let page = 1;
  const pageSize = 100;

  try {
    // Paginate through all content
    while (true) {
      const res = await fetchStrapi<StrapiCollection<any>>('contents', {
        fields: ['slug', 'publishedAt', 'updatedAt', 'Date'],
        populate: ['type_of_content', 'content_tag'],
        sort: ['publishedAt:desc'],
        pagination: { page, pageSize },
      });

      const items = res.data || [];
      if (items.length === 0) break;

      allItems.push(...items);

      // Check if we've fetched all pages
      const totalPages = res.meta?.pagination?.pageCount ?? 1;
      if (page >= totalPages) break;
      page++;
    }
  } catch (err) {
    console.error('Sitemap articles fetch error:', err);
  }

  return allItems.map((item: any) => {
    const attrs = item.attributes || item;
    return {
      slug: attrs.slug,
      path: buildContentUrl({
        slug: attrs.slug,
        type_of_content: attrs.type_of_content,
        content_tag: attrs.content_tag,
      }),
      publishedAt: attrs.Date || attrs.publishedAt || attrs.createdAt,
      updatedAt: attrs.updatedAt || attrs.Date || attrs.publishedAt || attrs.createdAt,
    };
  });
}

export async function GET() {
  const baseUrl = 'https://energdive.com';
  const articles = await getAllContent();

  const urls = articles
    .map(
      (a) =>
        `<url><loc>${baseUrl}${a.path}</loc><lastmod>${new Date(a.updatedAt || a.publishedAt).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.70</priority></url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
