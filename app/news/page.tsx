import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Clock, Zap } from "lucide-react";
import { DateChip } from "@/components/ui/date-chip";
import { formatContentDate, toIsoDate } from "@/lib/date";
import { strapiImageUrl } from "@/lib/strapi-image";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdRenderer } from "@/components/ads/AdRenderer";
import { getLatestIssue } from "@/lib/api/getLatestIssue";
import { slugify } from "@/lib/utils";
import NewsFeedClient from "./NewsFeedClient";
import { ORGANIZATION_SCHEMA } from "@/lib/organization-schema";

const STRAPI_BASE_URL = "https://cms.energdive.com";

function timeAgo(dateInput: string | Date) {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
    }).format(d).replace(",", "") + " IST";
}

function estimateReadingTime(text: string) {
    const wordsPerMinute = 225;
    const words = text ? text.split(/\s+/).length : 200; // fallback length
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(2, minutes);
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const pageStr = Array.isArray(params.page) ? params.page[0] : params.page;
    const page = parseInt(pageStr || "1", 10);
    return {
        title: `ENERGDIVE News Hub${page > 1 ? ` - Page ${page}` : ''} | ENERGDIVE`,
        description: "Editorial-grade energy news portal covering Oil & Gas, Power, Renewables, Policy, and Clean Tech.",
        alternates: {
            canonical: page === 1 ? "/news" : `/news?page=${page}`,
        }
    }
}

export default async function NewsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const pageStr = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
    const page = parseInt(pageStr || "1", 10);
    
    const isFirstPage = page === 1;
    // On first page we need: 1 Hero + 5 Top Stories + 12 Feed = 18 articles.
    const limit = isFirstPage ? 18 : 12;
    const start = isFirstPage ? 0 : 18 + (page - 2) * 12;

    let articles: any[] = [];
    let totalCount = 0;
    const latestIssue = await getLatestIssue();

    try {
        const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=News&populate=*&pagination[start]=${start}&pagination[limit]=${limit}&sort=Date:desc`;
        const res = await fetch(url, { next: { revalidate: 60 } });
        const json = await res.json();
        
        totalCount = json?.meta?.pagination?.total || 0;

        if (json.data) {
            articles = json.data.map((item: any) => {
                const attrs = item.attributes || item;

                let excerptText = "Strategic insights into the global energy transition.";
                if (attrs.Excerpt && Array.isArray(attrs.Excerpt)) {
                    const paragraph = attrs.Excerpt.find((block: any) => block.type === 'paragraph');
                    if (paragraph?.children?.[0]?.text) {
                        excerptText = paragraph.children[0].text;
                    }
                } else if (typeof attrs.description === 'string') {
                    excerptText = attrs.description;
                }

                const imgUrl = attrs.FEATUREDIMAGE?.data?.attributes?.url || attrs.FeaturedImage?.url;
                let finalImage = imgUrl ? strapiImageUrl(imgUrl) : null;
                if (finalImage && finalImage.includes("placeholder")) finalImage = null;

                return {
                    id: item.id,
                    title: attrs.TITLE || attrs.Title || "Untitled",
                    slug: attrs.slug,
                    image: finalImage,
                    excerpt: excerptText,
                    category: attrs.type_of_content?.data?.attributes?.name || "NEWS",
                    sector: (
                        attrs.sectors?.[0]?.name ||
                        attrs.sectors?.data?.[0]?.attributes?.name ||
                        attrs.sector?.name ||
                        attrs.sector?.data?.attributes?.name ||
                        "Energy"
                    ),
                    date: formatContentDate(attrs.Date || attrs.publishedAt || attrs.createdAt),
                    rawDate: attrs.Date || attrs.publishedAt || attrs.createdAt,
                    author: attrs.Author?.name || "ENERGDIVE News Desk",
                    readingTime: estimateReadingTime(excerptText + " " + (attrs.CONTENT || "")),
                };
            });
            
            articles.sort((a: any, b: any) => {
                return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
            });
        }
    } catch (error) {
        console.error("Error fetching news:", error);
    }

    if (articles.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="min-h-[50vh] flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-slate-500">No news found.</p>
                    {page > 1 && (
                        <Link href="/news" className="mt-4 text-emerald-600 hover:underline font-bold">
                            Return to Page 1
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    const heroArticle = isFirstPage ? articles[0] : null;
    const topStories = isFirstPage ? articles.slice(1, 6) : [];
    const gridArticles = isFirstPage ? articles.slice(6) : articles;

    const hasMore = start + limit < totalCount;
    const totalPages = 1 + (totalCount > 18 ? Math.ceil((totalCount - 18) / 12) : 0);

    // Structured Data Schemas
    const breadcrumbSchema = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.energdive.com/" },
            { "@type": "ListItem", "position": 2, "name": "News", "item": "https://www.energdive.com/news" }
        ]
    };

    const itemListSchema = {
        "@type": "ItemList",
        "itemListElement": articles.map((a, i) => {
            const isOrgAuthor = !a.author || /\b(desk|editorial|team|energdive|newsroom)\b/i.test(a.author);
            
            return {
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "NewsArticle",
                    "url": `https://www.energdive.com/news/${a.slug}`,
                    "headline": a.title,
                    "datePublished": toIsoDate(a.rawDate),
                    "author": { 
                        "@type": isOrgAuthor ? "Organization" : "Person", 
                        "name": a.author,
                        "url": `https://www.energdive.com/author/${slugify(a.author)}`
                    },
                    "image": a.image ? {
                        "@type": "ImageObject",
                        "url": a.image.startsWith('http') ? a.image : `https://www.energdive.com${a.image}`,
                        "width": 1200,
                        "height": 630
                    } : undefined
                }
            };
        })
    };

    const newsGraphSchema = {
        "@context": "https://schema.org",
        "@graph": [
            ORGANIZATION_SCHEMA,
            itemListSchema,
            breadcrumbSchema
        ]
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-600 selection:text-white font-sans overflow-x-clip">
            {/* Inject JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsGraphSchema).replace(/</g, '\\u003c') }} />
            
            {/* Inject Pagination Links */}
            {page > 1 && <link rel="prev" href={page === 2 ? "/news" : `/news?page=${page - 1}`} />}
            {hasMore && <link rel="next" href={`/news?page=${page + 1}`} />}

            <Header />

            {/* 1. TOP BREAKING NEWS BAR */}
            <div className="bg-slate-900 text-slate-200 border-b border-emerald-500 overflow-hidden text-xs font-medium tracking-wide">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center h-full">
                    <div className="bg-red-600 text-white px-3 sm:px-4 py-2 font-black uppercase tracking-widest shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.5)] z-10 flex items-center h-full">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        Breaking
                    </div>
                    <div className="overflow-hidden whitespace-nowrap flex-1 h-full flex items-center relative mask-image-edges">
                        <div className="animate-marquee flex gap-8 items-center pl-4 py-2">
                            {articles.slice(0, 10).map((a, i) => (
                                <Link key={i} href={`/news/${a.slug}`} className="hover:text-emerald-400 transition-colors inline-block text-slate-300">
                                    {a.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AD: new_top — Full-width leaderboard between ticker and main content */}
            <div className="w-full bg-white border-b border-slate-100 pt-2 pb-0">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex justify-center">
                    <AdRenderer placement="new_top" variant="banner" />
                </div>
            </div>

            <main className={`max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 ${isFirstPage ? 'pt-2 pb-8' : 'pt-2 pb-8'}`}>
                <h1 className="sr-only">Energy Dive News Hub - Latest Energy Sector News, Policy & Markets</h1>

                {/* 2. HERO / FEATURED NEWS SECTION (3:1 Asymmetric Grid) */}
                {isFirstPage && heroArticle && (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-6 lg:mb-8 border-b border-slate-200 py-1 md:py-8">
                        
                        {/* Left: Main Featured (8 cols) */}
                        <article className="lg:col-span-8 flex flex-col group relative">
                            <div className="relative aspect-[16/8.7] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm mb-3">
                                {heroArticle.image ? (
                                    <Image src={heroArticle.image} alt={heroArticle.title} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                                ) : (
                                    <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                        <Zap size={64} className="text-white/10" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 z-10">
                                    <Link href={`/sectors/${slugify(heroArticle.sector)}`} className="bg-emerald-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-md hover:bg-emerald-700 transition-colors">
                                        {heroArticle.sector}
                                    </Link>
                                </div>
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            
                            <div className="px-1 flex-1 flex flex-col">
                                <Link href={`/news/${heroArticle.slug}`} className="before:absolute before:inset-0 z-10">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight hover:text-emerald-700 transition-colors" style={{ fontFamily: 'var(--font-playfair, serif)' }}>
                                        {heroArticle.title}
                                    </h2>
                                </Link>
                                <p className="text-lg text-slate-600 mt-4 leading-relaxed font-light line-clamp-2">
                                    {heroArticle.excerpt}
                                </p>
                                <div className="mt-5 flex items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                                    <span className="text-slate-900 font-bold">By {heroArticle.author}</span>
                                    <span>•</span>
                                    <time dateTime={heroArticle.rawDate}>{timeAgo(heroArticle.rawDate)}</time>
                                </div>
                            </div>
                        </article>

                        {/* Right: Top Stories Sidebar (4 cols) */}
                        <aside className="lg:col-span-4 flex flex-col pt-8 lg:pt-0 lg:pl-8">
                            <div className="flex flex-col gap-6">
                                {topStories.map((item, idx) => (
                                    <article key={idx} className="flex gap-5 group relative">
                                        <div className="flex flex-col flex-1">
                                            <Link href={`/sectors/${slugify(item.sector)}`} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 relative z-20 hover:underline">
                                                {item.sector}
                                            </Link>
                                            <Link href={`/news/${item.slug}`} className="before:absolute before:inset-0 z-10">
                                                <h4 className="font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-3">
                                                    {item.title}
                                                </h4>
                                            </Link>
                                            <div className="mt-2 text-[10px] text-slate-500 font-medium">
                                                <time dateTime={item.rawDate}>{timeAgo(item.rawDate)}</time>
                                            </div>
                                        </div>
                                        <div className="relative w-28 sm:w-36 aspect-[4/3] shrink-0 overflow-hidden bg-slate-200 rounded-sm border border-slate-100">
                                            {item.image ? (
                                                <Image src={item.image} alt="" fill sizes="(max-width: 640px) 112px, 144px" className="object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                                            ) : (
                                                <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                                    <Zap size={16} className="text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </aside>
                    </section>
                )}

                {/* 3 & 4. PRIMARY NEWS STREAM (Filter Bar + Asymmetric Grid) */}
                <NewsFeedClient 
                    initialArticles={gridArticles} 
                    page={page} 
                    totalPages={totalPages} 
                    isFirstPage={isFirstPage} 
                    sidebarAd={<AdRenderer placement="new_sidebar" variant="card" />}
                    mobileTopAd={<AdRenderer placement="new_sidebar" variant="card" adIndex={0} />}
                    mobileFeedAd={<AdRenderer placement="new_sidebar" variant="card" adIndex={1} />}
                    latestIssue={latestIssue}
                />

            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .mask-image-edges {
                    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                }
                `
            }} />
        </div>
    );
}
