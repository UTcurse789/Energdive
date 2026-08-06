import { HOME_PAGE_METADATA } from "@/lib/route-metadata";
import { Hero } from "@/components/sections/hero";
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
import Link from "next/link";
import { ArrowRight, BookOpen, Mail } from "lucide-react";

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
      { next: { revalidate: 600 } }
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
      `${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&populate=*&sort[0]=updatedAt:desc&sort[1]=publishedAt:desc&pagination[pageSize]=30`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Featured contents fetch error:", err);
    return [];
  }
}

async function getHeroBannerContents() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents?filters[show_hero_banner][$eq]=true&populate=*&pagination[pageSize]=10&sort=publishedAt:desc`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Hero banner fetch error:", err);
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

// ─── Ticker Bar Component ─────────────────────────────────────────────────────

function BreakingNewsTicker({ news }: { news: { title: string; href: string }[] }) {
  if (!news || news.length === 0) return null;

  return (
    <div className="w-full bg-slate-950 text-slate-100 border-b border-emerald-500/30 overflow-hidden text-xs font-medium tracking-wide">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center h-10 sm:h-11">
        <div className="bg-red-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 font-black uppercase tracking-widest text-[9px] sm:text-[10px] shrink-0 flex items-center gap-1 sm:gap-1.5 shadow-sm rounded-sm mr-2 sm:mr-4 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="hidden xs:inline sm:inline">LATEST UPDATES</span>
          <span className="inline xs:hidden sm:hidden">LATEST</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center relative mask-gradient">
          <div className="animate-marquee flex gap-6 sm:gap-8 items-center pl-2">
            {news.concat(news).map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="hover:text-emerald-400 transition-colors inline-block text-slate-200 font-medium truncate max-w-[220px] sm:max-w-md text-[11px] sm:text-xs"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Homepage ─────────────────────────────────────────────────────────────

export default async function Home() {
  const [allContents, featuredContents, heroBannerContents, latestIssue, { opinions, interviews }, videos] = await Promise.all([
    getAllContents(),
    getFeaturedContents(),
    getHeroBannerContents(),
    getLatestIssueWithArticles(),
    getOpinionBuckets(),
    getLatestVideos(),
  ]);

  // Ticker News Items (Top 8 latest news)
  const tickerItems = (allContents || [])
    .slice(0, 8)
    .map((item: any) => ({
      title: item.Title || "",
      href: buildContentUrl({ slug: item.slug || "", type_of_content: item.type_of_content }),
    }))
    .filter((t: any) => t.title && t.href);

  // Bento: Featured articles
  const finalBentoItems = featuredContents.length > 0
    ? featuredContents
      .sort((a: any, b: any) => {
        const aDate = Date.parse(a.updatedAt || a.Date || a.publishedAt || a.createdAt || "") || 0;
        const bDate = Date.parse(b.updatedAt || b.Date || b.publishedAt || b.createdAt || "") || 0;
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

  // Hero Sidebar: Top 6 News items
  const heroTopStories = allContents
    ? allContents
      .filter((a: any) => a.type_of_content?.name === "News")
      .sort((a: any, b: any) => {
        return getArticleTimestamp(b) - getArticleTimestamp(a);
      })
      .slice(0, 16)
    : [];

  // Fetch articles for each sector in parallel directly from Strapi
  const sectorFetchResults = await Promise.all(
    HOMEPAGE_SECTORS.map(async (sector) => {
      try {
        const res = await fetch(buildSectorArticlesUrl(sector.slug), { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    })
  );

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
            "datePublished": article.publishedAt || article.Date || article.createdAt || "",
            "dateModified": article.updatedAt || article.publishedAt || article.createdAt || ""
          }
        }))
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500/20">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Breaking News Ticker */}
      <BreakingNewsTicker news={tickerItems} />

      {/* Home Platform Hero Ad Banner */}
      <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-16 pt-3 pb-1">
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



      {/* Lower editorial lane: Opinion, Interviews, Sectors + Right Rail */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="min-w-0 lg:col-span-9">
              {/* Executive Opinion & Interviews Vertical */}
              <OpinionSection opinions={opinions} interviews={interviews} contained={false} />
            </div>

            <aside className="lg:col-span-3 pt-6 lg:pt-8" aria-label="Homepage right rail">
              <EventsSection variant="sidebar" />
            </aside>
          </div>
        </div>
      </section>

      {/* Current Issue — full width, between Opinion and Sectors */}
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
      <section className="bg-white py-8 lg:py-6">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-9">
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

            {/* Right Rail: Ads + EnergyJobs + Call for Papers CTA */}
            <aside className="lg:col-span-3 flex flex-col gap-5 pt-2">
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
            </aside>
          </div>
        </div>
      </section>

      {/* Subscriptions CTA Section: Print Subscription + Newsletter (Light Theme) */}
      <section className="bg-white py-10 lg:py-12 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* CTA 1: Print Subscription */}
            <div className="relative overflow-hidden bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-xs flex flex-col justify-between group hover:border-emerald-500/50 hover:bg-slate-50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
              
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 mb-4">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  Print Edition
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                  Subscribe to ENERGDIVE Magazine
                </h3>
                
                <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                  Get in-depth sector intelligence, expert commentary, and comprehensive monthly market analysis delivered straight to your desk or organization.
                </p>
              </div>

              <div>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-xs hover:shadow-md group/btn"
                >
                  Subscribe Print Edition
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* CTA 2: Newsletter Subscription */}
            <div className="relative overflow-hidden bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-xs flex flex-col justify-between group hover:border-emerald-500/50 hover:bg-slate-50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all" />
              
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-[10px] font-black uppercase tracking-[0.2em] text-teal-800 mb-4">
                  <Mail className="w-3.5 h-3.5 text-teal-700" />
                  Daily & Weekly Briefings
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                  Join ENERGDIVE Newsletter
                </h3>
                
                <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                  Stay updated with breaking energy news, policy insights, and exclusive executive digests directly in your email inbox every morning.
                </p>
              </div>

              <div>
                <Link
                  href="/newsletter"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-xs hover:shadow-md group/btn"
                >
                  Join Newsletter Free
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
