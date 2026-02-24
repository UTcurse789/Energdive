import { Hero } from "@/components/sections/hero";
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

const STRAPI_BASE = "http://206.189.132.187:1337";

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
      `${STRAPI_BASE}/api/contents?pagination[pageSize]=100&populate=*`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Contents fetch error:", err);
    return null;
  }
}

export default async function Home() {
  const allContents = await getAllContents();

  // ── Bento: random 6 from all news ──
  const finalBentoItems = allContents
    ? allContents
      .filter((a: any) => a.type_of_content?.name === "News")
      .map((article: any) => ({
        id: article.id,
        title: article.Title || "",
        category: article.sectors?.[0]?.name || "Energy",
        image: extractImageUrl(article),
        slug: article.slug || "",
        excerpt: extractExcerpt(article),
      }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
    : ARTICLES.slice(0, 6).map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      image: a.image,
      slug: a.slug,
      excerpt: a.excerpt,
    }));

  // ── Sectors: group by allowed sectors — ONLY Articles ──
  const sectorsWithArticles = allContents
    ? ALLOWED_SECTORS.map((sectorName) => {
      const articles = allContents
        .filter((article: any) =>
          article.sectors?.some((s: any) => s.name === sectorName) &&
          article.type_of_content?.name === "Articles" &&
          article.featured_in_sector === true
        )
        .slice(0, 4)
        .map((article: any) => mapArticle(article, sectorName));

      return {
        title: sectorName,
        slug: sectorName.toLowerCase().replace(/ & /g, "-and-").replace(/ /g, "-"),
        articles,
      };
    }).filter((s) => s.articles.length > 0)
    : [];

  return (
    <>
      {/* Cover Story (left) + Trending (right) — the original Hero */}
      <Hero />

      {/* News Bento */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(rgba(9, 182, 151, 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container px-4 mx-auto relative z-10 max-w-[1400px]">
          <SectionHeading
            title="News"
            linkText="Explore All News"
            linkHref="/news"
          />
          <div className="mt-8">
            <BentoGrid items={finalBentoItems} />
          </div>
        </div>
      </section>

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

      <OpinionSection />
      <HomepageVideos />
      <PublicationShowcase variant="compact" />
      <EventsSection />
    </>
  );
}
