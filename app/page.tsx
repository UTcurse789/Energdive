import dynamic from "next/dynamic";
import { HOME_PAGE_METADATA } from "@/lib/route-metadata";
import { Hero } from "@/components/sections/hero";
import { AdBanner } from "@/components/ads/AdBanner";
import type { OpinionItem } from "@/components/sections/opinion";
import { ARTICLES } from "@/data/dummy";
import { SectionHeading } from "@/components/ui/section-heading";
import { Article } from "@/types";
import { formatContentDate } from "@/lib/date";
import { getLatestIssue } from "@/lib/api/getLatestIssue";
import { strapiImageUrl } from "@/lib/strapi-image";
import { buildContentUrl } from "@/lib/content-routes";
import { buildSectorArticlesUrl } from "@/lib/sector-content";
import { getOpinionContentKind } from "@/lib/content-tags";
import Link from "next/link";

// ── Below-the-Fold Lazy-Loaded Components (Code-Splitting for Main-Thread Optimization) ──
const BentoGrid = dynamic(
  () => import("@/components/ui/bento-grid").then((m) => m.BentoGrid),
  { loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" /> }
);

const OpinionSection = dynamic(
  () => import("@/components/sections/opinion").then((m) => m.OpinionSection),
  { loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" /> }
);

const SectorBlock = dynamic(
  () => import("@/components/ui/sector-block").then((m) => m.SectorBlock),
  { loading: () => <div className="h-72 w-full animate-pulse bg-slate-100 rounded-xl" /> }
);

const HomepageVideos = dynamic(
  () => import("@/components/sections/homepage-videos").then((m) => m.HomepageVideos),
  { loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" /> }
);

const Publication2 = dynamic(
  () => import("@/components/sections/publication2").then((m) => m.Publication2),
  { loading: () => <div className="h-64 w-full animate-pulse bg-slate-100 rounded-xl" /> }
);

const EventsSection = dynamic(
  () => import("@/components/sections/events").then((m) => m.EventsSection),
  { loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" /> }
);

export const metadata = HOME_PAGE_METADATA;

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

const HOMEPAGE_SECTORS = [
  { title: "Oil & Gas", slug: "oil-gas" },
  { title: "Power Generation", slug: "power-generation" },
  { title: "New Energies", slug: "new-energies" },
  { title: "Sustainability & Safety", slug: "sustainability-and-safety" },
];


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
  return strapiImageUrl(url);
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

function getContentDateValue(article: any): string {
  return article.Date || article.publishedAt || article.createdAt || "";
}

function getArticleTimestamp(article: any): number {
  return Date.parse(getContentDateValue(article)) || 0;
}

function mapOpinionItems(data: any[]): OpinionItem[] {
  return data.map((item: any) => {
    return {
      id: item.id,
      title: item.Title || "",
      slug: item.slug || "",
      excerpt: extractExcerpt(item),
      image: extractImageUrl(item),
      imageCaption: item.FeaturedImage?.caption || "",
      authorName: item.author?.name || "Staff Writer",
      authorAvatar: item.author?.avatar?.url ? strapiImageUrl(item.author.avatar.url) : "/default-avatar.png",
      authorRole: item.author?.role || "Author",
      date: formatContentDate(item.Date || item.publishedAt || item.createdAt),
    };
  });
}

function mapArticle(article: any, sectorName: string): Article {
  return {
    id: String(article.id),
    title: article.Title || "",
    slug: article.slug || "",
    href: buildContentUrl({
      slug: article.slug || "",
      type_of_content: article.type_of_content,
    }),
    contentType: article.type_of_content?.name || null,
    category: sectorName || "Energy",
    image: extractImageUrl(article),
    excerpt: extractExcerpt(article),
    date: formatContentDate(article.Date || article.publishedAt || article.createdAt),
    author: article.author ? {
      name: article.author.name || "Staff Writer",
      avatar: article.author.avatar?.url ? strapiImageUrl(article.author.avatar.url) : "/default-avatar.png",
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
      `${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&populate=*&sort[0]=updatedAt:desc&sort[1]=publishedAt:desc&pagination[pageSize]=10`,
      { next: { revalidate: 60 } } // Keep featured picks fresh on the homepage
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Featured contents fetch error:", err);
    return [];
  }
}

async function getOpinionBuckets() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents` +
      `?filters[type_of_content][name][$eq]=Opinion` +
      `&pagination[pageSize]=60` +
      `&populate[author][populate]=avatar` +
      `&populate=FeaturedImage` +
      `&populate[content_tag]=true` +
      `&sort=Date:desc`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return { opinions: [], interviews: [] };
    const json = await res.json();
    const allItems = json.data || [];

    const opinionItems: any[] = [];
    const interviewItems: any[] = [];

    allItems.forEach((item: any) => {
        const kind = getOpinionContentKind(item);
        if (kind === "interview") {
            interviewItems.push(item);
            return;
        }
        if (kind === "opinion") {
            opinionItems.push(item);
        }
    });

    return {
        opinions: mapOpinionItems(opinionItems.slice(0, 5)),
        interviews: mapOpinionItems(interviewItems.slice(0, 5)),
    };
  } catch (err) {
    console.error("Opinion fetch error:", err);
    return { opinions: [], interviews: [] };
  }
}

async function getSectorArticles(slug: string) {
  try {
    const res = await fetch(buildSectorArticlesUrl(slug), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  // All 5 server data requirements fetched in a SINGLE parallel Promise.all
  const [allContents, featuredContents, latestIssue, opinionBuckets, sectorFetchResults] = await Promise.all([
    getAllContents(),
    getFeaturedContents(),
    getLatestIssue(),
    getOpinionBuckets(),
    Promise.all(HOMEPAGE_SECTORS.map((sector) => getSectorArticles(sector.slug))),
  ]);

  const { opinions, interviews } = opinionBuckets;

  // Derive hero banner stories from allContents in-memory (0ms extra network latency)
  const heroBannerContents = allContents
    ? allContents
        .filter((item: any) => Boolean(item.show_hero_banner))
        .slice(0, 10)
    : [];

  // ── Bento: Featured articles fetched directly from Strapi ──
  const finalBentoItems = featuredContents.length > 0
    ? featuredContents
      .sort((a: any, b: any) => {
        const aDate = Date.parse(a.updatedAt || a.Date || a.publishedAt || a.createdAt || "") || 0;
        const bDate = Date.parse(b.updatedAt || b.Date || b.publishedAt || a.createdAt || "") || 0;
        return bDate - aDate;
      })
      .map((article: any) => ({
        id: article.id || article.documentId,
        title: article.Title || "",
        category: article.sectors?.[0]?.name || "Energy",
        contentType: article.type_of_content?.name || "News",
        contentTag: article.content_tag,
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
        return getArticleTimestamp(b) - getArticleTimestamp(a);
      })
      .slice(0, 6)
    : [];

  const sectorsWithArticles = HOMEPAGE_SECTORS.map((sector, idx) => {
    const sectorArticles = sectorFetchResults[idx];
    const finalArticles = sectorArticles.slice(0, 4);

    const articles = finalArticles.map((article: any) => mapArticle(article, sector.title));

    return {
      title: sector.title,
      slug: sector.slug,
      articles,
    };
  }).filter((s) => s.articles.length > 0);

  return (
    <>
      {/* Homepage Hero Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <AdBanner placement="home_platform_hero" variant="banner" className="py-0" />
      </div>

      {/* Cover Story (left) + Trending (right) — the original Hero */}
      <Hero heroStories={heroBannerContents} topStories={heroTopStories} />

      {/* Featured Bento */}
      <section className="pt-8 pb-8 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(rgba(9, 182, 151, 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeading
            title="Featured"
          />
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 xl:gap-10">
            <div className="min-w-0 lg:col-span-9">
              <BentoGrid items={finalBentoItems} className="py-0" />
            </div>
            <div className="w-full lg:col-span-3 lg:flex lg:justify-end">
              <AdBanner
                placement="home_featured_partner"
                variant="vertical"
                className="mx-auto lg:mx-0"
              />
            </div>
          </div>
        </div>
      </section>

      <OpinionSection opinions={opinions} interviews={interviews} />

      {/* Sector Blocks */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sectorsWithArticles.map((sector) => (
            <div key={sector.slug}>
              <AdBanner
                placement="sector_hero"
                sectorSlug={sector.slug}
                variant="banner"
                showSkeleton={false}
                className="py-6"
              />
              <SectorBlock
                title={sector.title}
                slug={sector.slug}
                articles={sector.articles}
              />
            </div>
          ))}

          {/* View All Sectors Button */}
          <div className="flex justify-center py-5">
            <Link
              href="/sectors"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#09B697] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-[#078a72] transition-all duration-300 shadow-lg shadow-[#09B697]/20 hover:shadow-xl hover:shadow-[#09B697]/30 hover:-translate-y-0.5"
            >
              View All Sectors
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>


      <HomepageVideos />
      <Publication2 variant="compact" latestCoverImage={latestIssue?.coverImage} latestIssueSlug={latestIssue?.slug} />
      <EventsSection />
    </>
  );
}
