import { fetchStrapi, StrapiCollection } from '@/lib/strapi';

interface ContentEntry {
  slug: string;
  type_of_content: any;
  publishedAt: string;
  updatedAt: string;
  Date: string;
}

function getPrefix(typeName: string): string {
  const map: Record<string, string> = {
    news: '/news',
    articles: '/articles',
    opinion: '/opinion',
    interview: '/interview',
    'cover story': '/cover-story',
    'case study': '/case-study',
    editorial: '/editorial',
    feature: '/feature',
    'featured stories': '/featured-stories',
    reports: '/reports',
  };
  return map[typeName.toLowerCase().trim()] || '/articles';
}

function extractTypeName(typeOfContent: any): string {
  if (!typeOfContent) return 'news';
  // Strapi v5 array shape
  if (Array.isArray(typeOfContent)) {
    return typeOfContent[0]?.Name ?? typeOfContent[0]?.name ?? 'news';
  }
  // v4 nested data shape
  if (typeOfContent.data?.attributes?.name) {
    return typeOfContent.data.attributes.name;
  }
  // Flat object shape
  return typeOfContent.Name ?? typeOfContent.name ?? 'news';
}

async function getAllContent(): Promise<
  { slug: string; type: string; publishedAt: string; updatedAt: string }[]
> {
  const allItems: any[] = [];
  let page = 1;
  const pageSize = 100;

  try {
    // Paginate through all content
    while (true) {
      const res = await fetchStrapi<StrapiCollection<any>>('contents', {
        fields: ['slug', 'publishedAt', 'updatedAt', 'Date'],
        populate: ['type_of_content'],
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
    const typeName = extractTypeName(attrs.type_of_content);
    return {
      slug: attrs.slug,
      type: typeName,
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
        `<url><loc>${baseUrl}${getPrefix(a.type)}/${a.slug}</loc><lastmod>${new Date(a.updatedAt || a.publishedAt).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.70</priority></url>`
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
