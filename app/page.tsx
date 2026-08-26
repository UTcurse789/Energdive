import { HOME_PAGE_METADATA } from "@/lib/route-metadata";
import { Hero } from "@/components/sections/hero";
import type { VideoItem } from "@/components/sections/hero";
import { FeaturedSection } from "@/components/sections/featured-section";
import { LatestNewsSection } from "@/components/sections/latest-news-section";
import { SubscriptionsCTASection } from "@/components/sections/subscriptions-cta-section";
import { AdBanner } from "@/components/ads/AdBanner";
import { SectorBlock } from "@/components/ui/sector-block";
import { OpinionSection } from "@/components/sections/opinion";
import type { OpinionItem } from "@/components/sections/opinion";
import { EventsSection } from "@/components/sections/events";
import { getLatestVideos } from "@/components/sections/homepage-videos";
import { ARTICLES } from "@/data/dummy";
import { Article } from "@/types";
import { formatContentDate } from "@/lib/date";
import { Publication2 } from "@/components/sections/publication2";
import { getLatestIssueWithArticles } from "@/lib/api/getLatestIssue";
import { CurrentIssueSection } from "@/components/sections/current-issue-section";
import { EnergyJobsSidebar } from "@/components/sections/energy-jobs-sidebar";
import { strapiImageUrl } from "@/lib/strapi-image";
import { buildContentUrl } from "@/lib/content-routes";
import { buildSectorArticlesUrl } from "@/lib/sector-content";
import { getOpinionContentKind } from "@/lib/content-tags";
import { ORGANIZATION_SCHEMA } from "@/lib/organization-schema";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, Mail, Play } from "lucide-react";

export const metadata = HOME_PAGE_METADATA;

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const CMS_REQUEST_TIMEOUT_MS = 10_000;

function fetchCms(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(CMS_REQUEST_TIMEOUT_MS),
  });
}

function logCmsError(message: string, error: unknown) {
  if (error instanceof Error && error.name === "TimeoutError") return;
  console.error(message, error);
}

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

function FeaturedVideosSidebar({ videos }: { videos: VideoItem[] }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-1">
        <Link href="/videos" className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-emerald-600 transition-colors">
          Featured Videos
          <ChevronRight size={14} className="text-slate-900 group-hover:text-emerald-600 transition-colors stroke-[2.5]" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {videos.slice(0, 2).map((video) => (
          <Link
            key={video.id}
            href={`/videos/${video.slug}`}
            className="group block"
          >
            <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shadow-2xs">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                sizes="300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-red-600/95 text-white flex items-center justify-center pl-0.5 shadow-md group-hover:scale-105 transition-transform">
                  <Play size={14} className="fill-white" />
                </div>
              </div>
              {video.category && (
                <span className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate bg-white/90 backdrop-blur-sm text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200/80">
                  {video.category}
                </span>
              )}
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {video.title}
            </h4>
            {video.date && (
              <time className="mt-1 block text-[10px] font-medium text-slate-500">
                {video.date}
              </time>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

async function getAllContents() {
  try {
    const res = await fetchCms(
      `${STRAPI_BASE}/api/contents?pagination[pageSize]=40&populate=*&sort=Date:desc`,
      { next: { revalidate: 60, tags: ["strapi-contents"] } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    logCmsError("Contents fetch error:", err);
    return null;
  }
}

async function getFeaturedContents() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&populate=*&sort[0]=Date:desc&sort[1]=publishedAt:desc&pagination[pageSize]=20`,
      { next: { revalidate: 60, tags: ["strapi-contents"] } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    logCmsError("Featured contents fetch error:", err);
    return [];
  }
}

async function getHeroBannerContents() {
  try {
    const res = await fetchCms(
      `${STRAPI_BASE}/api/contents?filters[type_of_content][name][$eq]=Cover%20Story&populate=*&pagination[pageSize]=10&sort=Date:desc`,
      { next: { revalidate: 60, tags: ["strapi-contents"] } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    logCmsError("Hero banner fetch error:", err);
    return [];
  }
}

async function getFeaturedPartnerAds() {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const res = await fetch(
      `${STRAPI_BASE}/api/advertisements?filters[placement][$eq]=home_featured_partner&filters[is_active][$eq]=true&populate=*&sort=priority:desc`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const ads = (json.data || []).filter((ad: any) => {
      if (ad.start_date && ad.start_date > today) return false;
      if (ad.end_date && ad.end_date < today) return false;
      return true;
    });
    return ads;
  } catch (err) {
    console.error("Featured partner ads fetch error:", err);
    return [];
  }
}

async function getOpinionBuckets() {
  try {
    const res = await fetchCms(
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
    logCmsError("Opinion fetch error:", err);
    return { opinions: [], interviews: [] };
  }
}

// ─── Main Homepage ─────────────────────────────────────────────────────────────

export default async function Home() {
  const [allContents, featuredContents, heroBannerContents, latestIssue, { opinions, interviews }, videos, featuredPartnerAds] = await Promise.all([
    getAllContents(),
    getFeaturedContents(),
    getHeroBannerContents(),
    getLatestIssueWithArticles(),
    getOpinionBuckets(),
    getLatestVideos(),
    getFeaturedPartnerAds(),
  ]);

  // Bento: Featured articles
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
        authorName: article.author?.name || article.authorName || "Energy Dive Intelligence",
        date: article.Date || article.publishedAt || article.createdAt,
      }))
      .slice(0, 11)
    : ARTICLES.slice(0, 11).map((a: any) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      image: a.image,
      slug: a.slug,
      excerpt: a.excerpt,
      authorName: a.author?.name || a.authorName || "Energy Dive Intelligence",
      date: a.date,
    }));

  // Hero Sidebar: Top 5 News items + Next stories for Latest News section
  const heroTopStories = allContents
    ? allContents
      .filter((a: any) => a.type_of_content?.name === "News")
      .sort((a: any, b: any) => {
        return getArticleTimestamp(b) - getArticleTimestamp(a);
      })
      .slice(0, 25)
    : [];

  // Fetch articles for each sector in parallel directly from Strapi
  const sectorFetchResults: any[][] = await Promise.all(
    HOMEPAGE_SECTORS.map(async (sector) => {
      try {
        const res = await fetch(buildSectorArticlesUrl(sector.slug), { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data || []) as any[];
      } catch {
        return [];
      }
    })
  );

  const sectorsWithArticles = HOMEPAGE_SECTORS.map((sector, idx) => {
    const sectorArticles = sectorFetchResults?.[idx] || [];
    const finalArticles = sectorArticles.slice(0, 4);
    const articles = finalArticles.map((article: any) => mapArticle(article, sector.title));

    return {
      title: sector.title,
      slug: sector.slug,
      articles,
    };
  }).filter((s) => s.articles.length > 0);

  // Structured Data / Schema.org JSON-LD
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION_SCHEMA,
      {
        "@type": "WebSite",
        "@id": "https://www.energdive.com/#website",
        "url": "https://www.energdive.com",
        "name": "ENERGDIVE",
        "description": "India's High-Authority Digital Media & Energy Market Intelligence Platform",
        "publisher": {
          "@id": "https://www.energdive.com/#organization"
        }
      },
      {
        "@type": "ItemList",
        "name": "Latest Energy News & Market Intelligence",
        "itemListElement": (allContents || []).slice(0, 10).map((article: any, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "NewsArticle",
            "headline": article.Title || "",
            "url": `https://www.energdive.com${buildContentUrl({ slug: article.slug || "", type_of_content: article.type_of_content })}`,
            "datePublished": article.Date || article.publishedAt || article.createdAt || "",
            "dateModified": article.updatedAt || article.publishedAt || article.createdAt || ""
          }
        }))
      }
    ]
  };

  const heroLcpImageUrl = heroBannerContents?.[0] ? extractImageUrl(heroBannerContents[0]) : null;

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500/20">
      {/* High priority preload for LCP cover story image */}
      {heroLcpImageUrl && (
        <link rel="preload" as="image" href={heroLcpImageUrl} fetchPriority="high" />
      )}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Home Platform Hero Ad Banner */}
      <div className="max-w-6xl mx-auto px-8 sm:px-10 lg:px-16 pt-3 pb-1">
        <AdBanner
          placement="home_platform_hero"
          variant="banner"
          maxItems={1}
          showSkeleton={false}
        />
      </div>

      {/* Main Portal Section (Left: Latest News, Center: Cover Story Title + Image + Featured Content, Right: Partner Ad + Featured Videos) */}
      <Hero
        heroStories={heroBannerContents}
        topStories={heroTopStories}
        featuredStories={finalBentoItems}
        videos={videos}
      />

      {/* Featured Section */}
      <FeaturedSection articles={finalBentoItems} partnerAds={featuredPartnerAds} />

      {/* Latest News Section (full-width detailed view of hero section's top 5 news) */}
      <LatestNewsSection news={heroTopStories.slice(0, 7)} />



      {/* Editorial & Sector Intelligence Lane */}
      <section className="bg-white py-4 lg:py-6">
        <div className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
            
            {/* Left Content Column: Opinion, Current Issue, and Sectors */}
            <div className="min-w-0 space-y-4">
              {/* Executive Opinion & Interviews Vertical */}
              <OpinionSection opinions={opinions} interviews={interviews} contained={false} />

              {/* Current Issue — full width inside left column if present */}
              {latestIssue && (
                <CurrentIssueSection
                  month={latestIssue.month}
                  year={latestIssue.year}
                  coverImage={latestIssue.coverImage}
                  issueSlug={latestIssue.slug}
                  articles={latestIssue.articles}
                />
              )}

              {/* Sector Intelligence Hubs */}
              <div>
                {sectorsWithArticles.map((sector) => (
                  <div key={sector.slug} className="mb-3 last:mb-0">
                    <AdBanner
                      placement="sector_hero"
                      sectorSlug={sector.slug}
                      variant="banner"
                      showSkeleton={false}
                      className="py-2"
                    />
                    <SectorBlock
                      title={sector.title}
                      slug={sector.slug}
                      articles={sector.articles}
                    />
                  </div>
                ))}

                {/* View All Sectors Action Callout */}
                <div className="flex justify-center mt-6">
                  <Link
                    href="/sectors"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Explore All Sectors
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Unified Right Rail */}
            <aside className="w-full lg:w-[300px] flex flex-col gap-5 pt-2" aria-label="Main right rail">
              {/* Ad 1 */}
              <AdBanner
                placement="article_sidebar"
                variant="card"
                maxItems={1}
                showSkeleton={false}
              />

              {/* Ad 2 */}
              <AdBanner
                placement="new_sidebar"
                variant="card"
                adIndex={1}
                maxItems={1}
                showSkeleton={false}
              />

              {/* EnergyJobs */}
              <EnergyJobsSidebar />

              {/* Call for Papers CTA */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-900 to-emerald-950 p-5 rounded-md border border-slate-800/80 shadow-md group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">
                  Insights Exchange
                </span>
                <h3 className="text-base font-black text-white leading-snug tracking-tight">
                  Call for Papers
                </h3>
                <p className="mt-2 text-xs text-slate-300/90 leading-relaxed">
                  Share your research, analysis, or industry insights with India&apos;s energy community.
                </p>
                <Link
                  href="/insights-exchange/call-for-papers"
                  className="mt-4 group/btn inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider rounded transition-all shadow-sm"
                >
                  Submit Your Paper
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>

              {/* Featured Videos */}
              <FeaturedVideosSidebar videos={videos} />

              {/* Upcoming Events */}
              <EventsSection variant="sidebar" />
            </aside>
          </div>
        </div>
      </section>

      {/* Subscriptions CTA Section: Login + Print Subscription + Newsletter (Light Theme) */}
      <SubscriptionsCTASection />
    </main>
  );
}
