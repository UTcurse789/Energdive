export async function GET() {
  const baseUrl = 'https://www.energdive.com';
  const now = new Date().toISOString();

  const pages = [
    { url: '/', priority: '1.00', changefreq: 'daily' },
    { url: '/news', priority: '0.90', changefreq: 'hourly' },
    { url: '/analysis', priority: '0.85', changefreq: 'daily' },
    { url: '/feature', priority: '0.85', changefreq: 'daily' },
    { url: '/featured-stories', priority: '0.85', changefreq: 'daily' },
    { url: '/cover-story', priority: '0.85', changefreq: 'daily' },
    { url: '/opinion', priority: '0.80', changefreq: 'daily' },
    { url: '/editorial', priority: '0.80', changefreq: 'daily' },
    { url: '/interviews', priority: '0.80', changefreq: 'daily' },
    { url: '/reports', priority: '0.80', changefreq: 'weekly' },
    { url: '/videos', priority: '0.70', changefreq: 'daily' },
    { url: '/events', priority: '0.70', changefreq: 'weekly' },
    { url: '/tenders', priority: '0.75', changefreq: 'daily' },
    { url: '/case-study', priority: '0.75', changefreq: 'weekly' },
    { url: '/issues', priority: '0.75', changefreq: 'weekly' },
    { url: '/resource-hub', priority: '0.75', changefreq: 'weekly' },
    { url: '/knowledge-hub', priority: '0.70', changefreq: 'weekly' },
    { url: '/insights-exchange', priority: '0.70', changefreq: 'weekly' },
    { url: '/insights-exchange/call-for-papers', priority: '0.60', changefreq: 'monthly' },
    { url: '/insights-exchange/author-guidelines', priority: '0.60', changefreq: 'monthly' },
    { url: '/insights-exchange/editorial-review-process', priority: '0.60', changefreq: 'monthly' },
    { url: '/sectors', priority: '0.70', changefreq: 'weekly' },
    { url: '/sectors/oil-gas', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/power-generation', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/renewables', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/transmission', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/distribution', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/electricity-markets', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/new-energies', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/energy-storage', priority: '0.70', changefreq: 'daily' },
    { url: '/sectors/sustainability-and-safety', priority: '0.70', changefreq: 'daily' },
    { url: '/energyjobs', priority: '0.70', changefreq: 'daily' },
    { url: '/authors', priority: '0.60', changefreq: 'weekly' },
    { url: '/about', priority: '0.60', changefreq: 'monthly' },
    { url: '/contact', priority: '0.60', changefreq: 'monthly' },
    { url: '/advertise-with-us', priority: '0.60', changefreq: 'monthly' },
    { url: '/editorial-collaboration', priority: '0.60', changefreq: 'monthly' },
    { url: '/energclub', priority: '0.60', changefreq: 'monthly' },
    { url: '/newsletter', priority: '0.60', changefreq: 'monthly' },
    { url: '/subscribe', priority: '0.50', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.30', changefreq: 'yearly' },
    { url: '/terms', priority: '0.30', changefreq: 'yearly' },
    { url: '/cookies', priority: '0.30', changefreq: 'yearly' },
    { url: '/data-retention', priority: '0.30', changefreq: 'yearly' },
  ];

  const urls = pages
    .map(
      (p) =>
        `<url><loc>${baseUrl}${p.url}</loc><lastmod>${now}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
