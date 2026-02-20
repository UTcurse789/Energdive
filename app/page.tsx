import { Hero } from "@/components/sections/hero";
import { BentoGrid } from "@/components/ui/bento-grid";
import { SectorBlock } from "@/components/ui/sector-block";
import { OpinionSection } from "@/components/sections/opinion";
import { DataInsightsSection } from "@/components/sections/data-insights";
import { EventsSection } from "@/components/sections/events";
import { SubscribeCTA } from "@/components/sections/subscribe-cta";
import { ARTICLES } from "@/data/dummy";
import { SectionHeading } from "@/components/ui/section-heading";
import { MarketTicker } from "@/components/features/ticker";
import { Article, Opinion } from "@/types";

const STRAPI_BASE = "http://206.189.132.187:1337";

const ALLOWED_SECTORS = ["Oil & Gas", "Power Generation", "New Energies", "Distribution"];

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
    date: article.publishedAt
      ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
      : "",
    author: article.author ? {
      name: article.author.name || "Staff Writer",
      avatar: article.author.avatar?.url ? `${STRAPI_BASE}${article.author.avatar.url}` : "/default-avatar.png",
      role: article.author.role || "Contributor"
    } : { name: "Staff Writer", avatar: "/default-avatar.png", role: "Contributor" },
    readTime: "5 min read",
  };
}

async function getAllContents() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents?pagination[pageSize]=100&populate=*`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Contents fetch error:", err);
    return null;
  }
}

async function getFeaturedOpinion(): Promise<Opinion | null> {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents` +
      `?filters[type_of_content][name][$eq]=Opinion` +
      `&pagination[pageSize]=1` +
      `&populate=*` +
      `&sort=publishedAt:desc`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const article = json.data?.[0];
    if (!article) return null;

    const imageUrl = extractImageUrl(article);

    return {
      id: String(article.id),
      title: article.Title || "",
      slug: article.slug || "",
      excerpt: extractExcerpt(article),
      category: "Opinion",
      image: imageUrl,
      featuredImage: imageUrl,
      content: article.Content || [],
      date: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })
        : "",
      readTime: "5 min read",
      author: {
        name: article.author?.name || "Staff Writer",
        role: article.author?.role || "Contributor",
        avatar: article.author?.avatar?.url
          ? `${STRAPI_BASE}${article.author.avatar.url}`
          : "/default-avatar.png",
        image: article.author?.avatar?.url
          ? `${STRAPI_BASE}${article.author.avatar.url}`
          : "/default-avatar.png",
      },
    };
  } catch (err) {
    console.error("Opinion fetch error:", err);
    return null;
  }
}

export default async function Home() {
  const [allContents, featuredOpinion] = await Promise.all([
    getAllContents(),
    getFeaturedOpinion(),
  ]);

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

  // ── Sectors: group by allowed sectors ──
  const sectorsWithArticles = allContents
    ? ALLOWED_SECTORS.map((sectorName) => {
      const articles = allContents
        .filter((article: any) =>
          article.sectors?.some((s: any) => s.name === sectorName) &&
          article.type_of_content?.name === "News"
        )
        .slice(0, 4)
        .map((article: any) => mapArticle(article, sectorName));

      return {
        title: sectorName,
        slug: sectorName.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-"),
        articles,
      };
    }).filter((s) => s.articles.length > 0)
    : [];

  return (
    <>
      <Hero />
      <MarketTicker />

      {/* Trending Bento */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(rgba(9, 182, 151, 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container px-4 mx-auto relative z-10">
          <SectionHeading
            title="Trending Now"
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
        <div className="container">
          {sectorsWithArticles.map((sector) => (
            <SectorBlock
              key={sector.slug}
              title={sector.title}
              slug={sector.slug}
              articles={sector.articles}
            />
          ))}
        </div>
      </div>

      <OpinionSection items={featuredOpinion ? [featuredOpinion] : []} />
      <DataInsightsSection />
      <EventsSection />
    </>
  );
}