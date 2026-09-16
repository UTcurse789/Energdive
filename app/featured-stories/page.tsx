import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Zap } from "lucide-react";
import { formatContentDate, toIsoDate } from "@/lib/date";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getLatestIssue } from "@/lib/api/getLatestIssue";
import { slugify } from "@/lib/utils";
import NewsFeedClient from "@/app/news/NewsFeedClient";
import { ORGANIZATION_SCHEMA } from "@/lib/organization-schema";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

function estimateReadingTime(text: string) {
    const wordsPerMinute = 225;
    const words = text ? text.split(/\s+/).length : 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(2, minutes);
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const pageStr = Array.isArray(params.page) ? params.page[0] : params.page;
    const page = parseInt(pageStr || "1", 10);
    return {
        title: `ENERGDIVE Featured Stories${page > 1 ? ` - Page ${page}` : ''} | ENERGDIVE`,
        description: "Curated long-form energy journalism, in-depth reports, and signature feature stories from ENERGDIVE.",
        alternates: {
            canonical: page === 1 ? "/featured-stories" : `/featured-stories?page=${page}`,
        }
    };
}

export default async function FeaturedStoriesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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
        const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=Featured Stories&populate=*&pagination[start]=${start}&pagination[limit]=${limit}&sort[0]=Date:desc&sort[1]=publishedAt:desc&sort[2]=createdAt:desc`;
        const res = await fetch(url, { next: { revalidate: 60 } });
        const json = await res.json();
        
        totalCount = json?.meta?.pagination?.total || 0;

        if (json.data) {
            articles = json.data.map((item: any) => {
                const attrs = item.attributes || item;

                let excerptText = "Signature long-form energy journalism and in-depth reporting.";
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

                const rawDateVal = attrs.Date || attrs.publishedAt || attrs.createdAt;

                return {
                    id: item.id,
                    title: attrs.TITLE || attrs.Title || "Untitled",
                    slug: attrs.slug,
                    image: finalImage,
                    excerpt: excerptText,
                    category: attrs.type_of_content?.data?.attributes?.name || "FEATURED STORIES",
                    sector: (
                        attrs.sectors?.[0]?.name ||
                        attrs.sectors?.data?.[0]?.attributes?.name ||
                        attrs.sector?.name ||
                        attrs.sector?.data?.attributes?.name ||
                        "Energy"
                    ),
                    date: formatContentDate(rawDateVal),
                    rawDate: rawDateVal,
                    author: attrs.Author?.name || "ENERGDIVE Editorial",
                    readingTime: estimateReadingTime(excerptText + " " + (attrs.CONTENT || "")),
                };
            });
            
            const getTimestamp = (d: any) => {
                if (!d) return 0;
                const t = new Date(d).getTime();
                return isNaN(t) ? 0 : t;
            };

            articles.sort((a: any, b: any) => {
                return getTimestamp(b.rawDate) - getTimestamp(a.rawDate);
            });
        }
    } catch (error) {
        console.error("Error fetching featured stories:", error);
    }

    if (articles.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="min-h-[50vh] flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-slate-500">No featured stories found.</p>
                    {page > 1 && (
                        <Link href="/featured-stories" className="mt-4 text-emerald-600 hover:underline font-bold">
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
            { "@type": "ListItem", "position": 2, "name": "Featured Stories", "item": "https://www.energdive.com/featured-stories" }
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
                    "url": `https://www.energdive.com/featured-stories/${a.slug}`,
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

    const featuredStoriesGraphSchema = {
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(featuredStoriesGraphSchema).replace(/</g, '\\u003c') }} />
            
            {/* Inject Pagination Links */}
            {page > 1 && <link rel="prev" href={page === 2 ? "/featured-stories" : `/featured-stories?page=${page - 1}`} />}
            {hasMore && <link rel="next" href={`/featured-stories?page=${page + 1}`} />}

            <Header />

            <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-6 pb-8">
                <h1 className="sr-only">Energy Dive Featured Stories - In-Depth Energy Journalism & Market Intelligence</h1>

                {/* 2. HERO / FEATURED STORIES SECTION (3:1 Asymmetric Grid) */}
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
                                <Link href={`/featured-stories/${heroArticle.slug}`} className="before:absolute before:inset-0 z-10">
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
                                    <time dateTime={heroArticle.rawDate}>{heroArticle.date}</time>
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
                                            <Link href={`/featured-stories/${item.slug}`} className="before:absolute before:inset-0 z-10">
                                                <h4 className="font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-3">
                                                    {item.title}
                                                </h4>
                                            </Link>
                                            <div className="mt-2 text-[10px] text-slate-500 font-medium">
                                                <time dateTime={item.rawDate}>{item.date}</time>
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

                {/* 3 & 4. PRIMARY FEATURED STORIES STREAM */}
                <NewsFeedClient 
                    initialArticles={gridArticles} 
                    page={page} 
                    totalPages={totalPages} 
                    isFirstPage={isFirstPage} 
                    latestIssue={latestIssue}
                    basePath="/featured-stories"
                    hideAds={true}
                    allTopicLabel="All Stories"
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
