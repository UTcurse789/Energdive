import { Hero } from "@/components/sections/hero";
import { AdBanner } from "@/components/ads/AdBanner";
// import { SpotlightSection } from "@/components/sections/spotlight-section";
import { BentoGrid } from "@/components/ui/bento-grid";
import { SectorBlock } from "@/components/ui/sector-block";
import { OpinionSection } from "@/components/sections/opinion";
import { EventsSection } from "@/components/sections/events";
import { HomepageVideos } from "@/components/sections/homepage-videos";
import { PublicationShowcase } from "@/components/sections/PublicationShowcase";
import { ARTICLES } from "@/data/dummy";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarketTicker } from "@/components/features/ticker";
import { Article } from "@/types";
import { formatContentDate } from "@/lib/date";
import { Publication2 } from "@/components/sections/publication2";
import { getLatestIssue } from "@/lib/api/getLatestIssue";

const STRAPI_BASE = "https://cms.energdive.com";

const ALLOWED_SECTORS = ["Oil & Gas", "Power Generation", "New Energies", "Sustainability & Safety"];


// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractImageUrl(article: any): string {
  const img = article.FeaturedImage;
  if (!img) return "/magazine-default.jpg";
  const url =
    img.formats?.large?.url ||
    img.formats?.medium?.url ||
    img.formats?.small?.url ||
    img.url;
  if (!url) return "/magazine-default.jpg";
  return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
}

function extractExcerpt(article: any): string {
  const excerpt = article.Excerpt;
  if (!excerpt || !Array.isArray(excerpt)) return "";
  return excerpt
    .map((block: any) =>
      (block.children || []).map((child: any) => child.text || "").join("")
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}

function mapArticle(article: any, sectorName: string): Article {
  return {
    id: String(article.id),
    title: article.Title || "",
    slug: article.slug || "",
    category: sectorName || "Energy",
    image: extractImageUrl(article),
    excerpt: extractExcerpt(article),
    date: formatContentDate(article.Date || article.publishedAt || article.createdAt),
    author: article.author ? {
      name: article.author.name || "Staff Writer",
      avatar: article.author.avatar?.url ? `${STRAPI_BASE}${article.author.avatar.url}` : "/default-avatar.png",
      role: article.author.role || "Author"
    } : { name: "Staff Writer", avatar: "/default-avatar.png", role: "Author" },
    readTime: "5 min read",
  };
}

async function getAllContents() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents?pagination[pageSize]=100&populate=*&sort=Date:desc`,
      { next: { revalidate: 600 } } // 10 min ISR
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Contents fetch error:", err);
    return null;
  }
}

async function getFeaturedContents() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&populate=*&sort=Date:desc&pagination[pageSize]=10`,
      { next: { revalidate: 600 } } // 10 min ISR
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Featured contents fetch error:", err);
    return [];
  }
}

export default async function Home() {
  const [allContents, featuredContents, latestIssue] = await Promise.all([
    getAllContents(),
    getFeaturedContents(),
    getLatestIssue(),
  ]);

  // ── Bento: Featured articles fetched directly from Strapi ──
  const finalBentoItems = featuredContents.length > 0
    ? featuredContents
      .sort((a: any, b: any) => {
        const aDate = Date.parse(a.Date || a.publishedAt || a.createdAt || "") || 0;
        const bDate = Date.parse(b.Date || b.publishedAt || b.createdAt || "") || 0;
        return bDate - aDate;
      })
      .map((article: any) => ({
        id: article.id || article.documentId,
        title: article.Title || "",
        category: article.sectors?.[0]?.name || "Energy",
        contentType: article.type_of_content?.name || "News",
        image: extractImageUrl(article),
        slug: article.slug || "",
        excerpt: extractExcerpt(article),
      }))
      .slice(0, 6)
    : ARTICLES.slice(0, 6).map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      image: a.image,
      slug: a.slug,
      excerpt: a.excerpt,
    }));

  // ── Hero Sidebar: Random 6 from All News (Swapped from Bento) ──
  const heroTopStories = allContents
    ? allContents
      .filter((a: any) => a.type_of_content?.name === "News")
      .sort((a: any, b: any) => {
        const aDate = Date.parse(a.Date || a.publishedAt || a.createdAt || "") || 0;
        const bDate = Date.parse(b.Date || b.publishedAt || b.createdAt || "") || 0;
        return bDate - aDate;
      })
      .slice(0, 6)
    : [];

  // ── Sectors: Fetch articles PER SECTOR directly from Strapi ──
  // Track IDs already used in hero & bento to avoid repeating them in sectors
  const usedArticleIds = new Set<number>();
  if (allContents) {
    heroTopStories.forEach((a: any) => usedArticleIds.add(a.id));
    allContents
      .filter((a: any) => a.featured === true)
      .slice(0, 6)
      .forEach((a: any) => usedArticleIds.add(a.id));
  }

  // Fetch articles for each sector in parallel directly from Strapi
  const sectorFetchResults = await Promise.all(
    ALLOWED_SECTORS.map(async (sectorName) => {
      try {
        const res = await fetch(
          `${STRAPI_BASE}/api/contents?filters[type_of_content][name][$eq]=Articles&filters[sectors][name][$eq]=${encodeURIComponent(sectorName)}&populate=*&sort=Date:desc&pagination[pageSize]=20`,
          { next: { revalidate: 3600 } } // 1 hour ISR for sector articles
        );
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    })
  );

  const sectorsWithArticles = ALLOWED_SECTORS.map((sectorName, idx) => {
    const sectorArticles = sectorFetchResults[idx];

    // Filter out already-used articles
    const available = sectorArticles.filter(
      (article: any) => !usedArticleIds.has(article.id)
    );

    // Featured-in-sector articles first
    const featured = available.filter(
      (article: any) => article.featured_in_sector === true
    );

    // Non-featured sorted by date (newest first) to fill remaining slots
    const nonFeatured = available
      .filter((article: any) => article.featured_in_sector !== true)
      .sort((a: any, b: any) => {
        const aDate = Date.parse(a.Date || a.publishedAt || a.createdAt || "") || 0;
        const bDate = Date.parse(b.Date || b.publishedAt || b.createdAt || "") || 0;
        return bDate - aDate;
      });

    // Combine: featured first, then fill up to 4
    const remaining = 4 - featured.length;
    const combined = [...featured, ...nonFeatured.slice(0, Math.max(0, remaining))];
    const finalArticles = combined.slice(0, 4);

    // Mark these as used so next sector won't pick them
    finalArticles.forEach((article: any) => usedArticleIds.add(article.id));

    const articles = finalArticles.map((article: any) => mapArticle(article, sectorName));

    let slug = sectorName.toLowerCase().replace(/ & /g, "-and-").replace(/ /g, "-");
    if (slug === "oil-and-gas") slug = "oil-gas";

    return {
      title: sectorName,
      slug,
      articles,
    };
  }).filter((s) => s.articles.length > 0);

  return (
    <>
      {/* Homepage Hero Ad Banner */}
      <AdBanner placement="home_platform_hero" variant="hero" />

      {/* Cover Story (left) + Trending (right) — the original Hero */}
      <Hero topStories={heroTopStories} />

      {/* Featured Bento */}
      <section className="py-12 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(rgba(9, 182, 151, 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-16 relative z-10">
          <SectionHeading
            title="Featured"
            linkText="Explore All"
            linkHref="/news"
          />
          <div className="-mt-6 flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 min-w-0">
              <BentoGrid items={finalBentoItems} />
            </div>
            <AdBanner
              placement="home_featured_partner"
              variant="vertical"
            />
          </div>
        </div>
      </section>

      <OpinionSection />

      {/* Sector Blocks */}
      <div className="border-b border-border">
        <div className="container max-w-[1400px] mx-auto">
          {sectorsWithArticles.map((sector) => (
            <SectorBlock
              key={sector.slug}
              title={sector.title}
              slug={sector.slug}
              articles={sector.articles}
            />
          ))}

          {/* View All Sectors Button */}
          <div className="flex justify-center py-12">
            <a
              href="/sectors"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#09B697] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#078a72] transition-all duration-300 shadow-lg shadow-[#09B697]/20 hover:shadow-xl hover:shadow-[#09B697]/30 hover:-translate-y-0.5"
            >
              View All Sectors
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>
        </div>
      </div>


      <HomepageVideos />
      <Publication2 variant="compact" latestCoverImage={latestIssue?.coverImage} latestIssueSlug={latestIssue?.slug} />
      <EventsSection />
    </>
  );
}
