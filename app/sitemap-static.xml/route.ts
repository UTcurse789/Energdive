export async function GET() {
  const baseUrl = 'https://www.energdive.com';
  const now = new Date().toISOString();

  const pages = [
    { url: '/', priority: '1.00', changefreq: 'daily' },
    { url: '/news', priority: '0.90', changefreq: 'hourly' },
    { url: '/opinion', priority: '0.80', changefreq: 'daily' },
    { url: '/editorial', priority: '0.80', changefreq: 'daily' },
    { url: '/interviews', priority: '0.80', changefreq: 'daily' },
    { url: '/articles', priority: '0.80', changefreq: 'daily' },
    { url: '/reports', priority: '0.80', changefreq: 'weekly' },
    { url: '/videos', priority: '0.70', changefreq: 'daily' },
    { url: '/events', priority: '0.70', changefreq: 'weekly' },
    { url: '/energdive-insights-exchange', priority: '0.70', changefreq: 'weekly' },
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
    { url: '/about', priority: '0.60', changefreq: 'monthly' },
    { url: '/contact', priority: '0.60', changefreq: 'monthly' },
    { url: '/advertise', priority: '0.60', changefreq: 'monthly' },
    { url: '/editorial-collaboration', priority: '0.60', changefreq: 'monthly' },
    { url: '/energclub', priority: '0.60', changefreq: 'monthly' },
    { url: '/subscribe', priority: '0.50', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.30', changefreq: 'yearly' },
    { url: '/terms', priority: '0.30', changefreq: 'yearly' },
    { url: '/cookies', priority: '0.30', changefreq: 'yearly' },
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
