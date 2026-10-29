"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, List, Bookmark, Share2, ShieldCheck, Zap, ArrowRight, RotateCcw } from "lucide-react";
import { slugify } from "@/lib/utils";
import { getSectorSlugForTagOrCategory } from "@/lib/sector-mapping";
import { AdBanner } from "@/components/ads/AdBanner";
import { SidebarAdSlider } from "@/components/ads/SidebarAdSlider";
import { LatestIssueWidget } from "@/components/news/LatestIssueWidget";
import { SidebarNewsletterForm } from "@/components/news/SidebarNewsletterForm";
import { StickySidebar } from "@/components/ui/StickySidebar";
import type { LatestIssueData } from "@/lib/api/getLatestIssue";

const SECTOR_RELATIONS: Record<string, string[]> = {
    "oil-gas": ["upstream", "midstream", "downstream", "lng", "cgd", "refining", "petrochemicals", "oil markets", "crude", "oil", "gas", "petroleum", "pipelines"],
    "power-generation": ["thermal", "hydro", "nuclear", "gas to power", "gas-to-power", "cogeneration", "power generation", "power"],
    "renewables": ["solar", "wind", "hydro", "biopower", "waste to energy", "waste-to-energy", "clean energy", "renewable energy", "renewables", "green energy"],
    "solar": ["solar", "solar power", "solar energy", "pv"],
    "wind": ["wind", "wind power", "wind energy", "offshore wind", "onshore wind"],
    "transmission": ["hvdc", "interconnectors", "grid infrastructure", "smart grid", "transmission", "grid", "interconnected grids"],
    "distribution": ["smart meters", "smart meters & ami", "smart meters and ami", "ev charging", "ev", "electric vehicles", "data centres", "smart cities", "rural electrification", "distribution", "utilities"],
    "electricity-markets": ["power markets", "carbon markets", "rco", "power exchange", "electricity markets", "power trading", "energy trading"],
    "new-energies": ["green hydrogen", "green ammonia", "e fuels", "e-fuels", "ccus", "biofuels", "hydrogen", "new energies", "alternative fuel"],
    "energy-storage": ["bess", "battery", "batteries", "pumped hydro", "caes", "flywheel", "thermal storage", "energy storage", "energy storage systems"],
    "sustainability": ["sustainability & safety", "sustainability", "sustainability-and-safety", "esg", "hsse", "safety", "net zero", "environment", "energy efficiency", "energy conservation", "climate finance", "occupational health"],
    "sustainability-and-safety": ["sustainability & safety", "sustainability", "sustainability-and-safety", "esg", "hsse", "safety", "net zero", "environment", "energy efficiency", "energy conservation", "climate finance", "occupational health"],
};

const PREFERRED_TOPICS = [
    "Oil & Gas",
    "Energy Storage",
    "Sustainability",
    "Renewables",
    "Solar",
    "Power Generation",
    "Transmission",
    "Distribution",
    "Electricity Markets",
    "New Energies",
];

function articleMatchesTopic(article: any, topic: string, allTopicLabel: string): boolean {
    if (!topic || topic === allTopicLabel) return true;
    
    const topicSlug = slugify(topic);
    const mappedTopicSector = getSectorSlugForTagOrCategory(topic);
    const relatedSubsectors = [
        ...(SECTOR_RELATIONS[topicSlug] || []),
        ...(SECTOR_RELATIONS[mappedTopicSector] || [])
    ].map(s => slugify(s));

    const terms: string[] = [];
    if (article.sector) terms.push(article.sector);
    if (article.category) terms.push(article.category);
    if (Array.isArray(article.sectors)) {
        article.sectors.forEach((s: any) => {
            if (typeof s === "string") terms.push(s);
            else if (s?.name) terms.push(s.name);
        });
    }
    if (Array.isArray(article.tags)) {
        article.tags.forEach((t: any) => {
            const name = typeof t === "string" ? t : t?.name || t?.attributes?.name;
            if (name) terms.push(name);
        });
    }

    return terms.some(term => {
        if (!term) return false;
        const termSlug = slugify(term);
        const termMappedSector = getSectorSlugForTagOrCategory(term);

        if (termSlug === topicSlug) return true;

        if (mappedTopicSector && termMappedSector && mappedTopicSector === termMappedSector) {
            if (topicSlug === "solar") return termSlug.includes("solar");
            if (topicSlug === "wind") return termSlug.includes("wind");
            return true;
        }

        if (relatedSubsectors.includes(termSlug)) return true;

        if (termSlug.includes(topicSlug) || topicSlug.includes(termSlug)) return true;

        return false;
    });
}

const ITEMS_PER_PAGE = 12;

export default function NewsFeedClient({ 
    initialArticles, 
    allArticles,
    page, 
    totalPages,
    isFirstPage,
    sidebarAd,
    sidebarBottomAd,
    mobileTopAd,
    mobileFeedAd,
    latestIssue,
    basePath = "/news",
    hideAds = false,
    allTopicLabel = "All News"
}: { 
    initialArticles: any[]; 
    allArticles?: any[];
    page: number; 
    totalPages: number;
    isFirstPage: boolean;
    sidebarAd?: React.ReactNode;
    sidebarBottomAd?: React.ReactNode;
    mobileTopAd?: React.ReactNode;
    mobileFeedAd?: React.ReactNode;
    latestIssue?: LatestIssueData | null;
    basePath?: string;
    hideAds?: boolean;
    allTopicLabel?: string;
}) {
    const articlesPool = useMemo(() => {
        return (allArticles && allArticles.length > 0) ? allArticles : initialArticles;
    }, [allArticles, initialArticles]);

    const TOPICS = useMemo(() => {
        const topicsList: string[] = [allTopicLabel];
        const addedSlugs = new Set<string>();

        // 1. Add preferred prominent topics that have matching articles
        PREFERRED_TOPICS.forEach(topic => {
            const slug = slugify(topic);
            const hasArticles = articlesPool.some(a => articleMatchesTopic(a, topic, allTopicLabel));
            if (hasArticles && !addedSlugs.has(slug)) {
                topicsList.push(topic);
                addedSlugs.add(slug);
            }
        });

        // 2. Also discover any other unique sectors from the news articles
        articlesPool.forEach(a => {
            const rawList = Array.isArray(a.sectors) ? a.sectors : [a.sector];
            rawList.forEach((s: any) => {
                const name = typeof s === "string" ? s : s?.name;
                if (!name) return;
                const cleanName = name.trim();
                const slug = slugify(cleanName);
                if (
                    slug &&
                    slug !== "energy" && 
                    slug !== "news" && 
                    slug !== "featured-stories" && 
                    !addedSlugs.has(slug)
                ) {
                    const hasArticles = articlesPool.some(art => articleMatchesTopic(art, cleanName, allTopicLabel));
                    if (hasArticles) {
                        topicsList.push(cleanName);
                        addedSlugs.add(slug);
                    }
                }
            });
        });

        return topicsList;
    }, [articlesPool, allTopicLabel]);

    const [activeTopic, setActiveTopic] = useState(allTopicLabel);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
    const [clientPage, setClientPage] = useState(1);

    // Reset client page whenever topic or search changes
    useEffect(() => {
        setClientPage(1);
    }, [activeTopic, searchQuery]);

    const isFiltered = activeTopic !== allTopicLabel || Boolean(searchQuery.trim());

    const filteredArticles = useMemo(() => {
        let pool = isFiltered ? articlesPool : initialArticles;
        
        if (activeTopic !== allTopicLabel) {
            pool = articlesPool.filter(a => articleMatchesTopic(a, activeTopic, allTopicLabel));
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            pool = pool.filter(a => {
                const titleMatch = a.title?.toLowerCase().includes(query);
                const excerptMatch = a.excerpt && a.excerpt.toLowerCase().includes(query);
                const sectorMatch = (a.sectors || [a.sector]).some((s: any) => {
                    const str = typeof s === "string" ? s : s?.name;
                    return str && str.toLowerCase().includes(query);
                });
                return Boolean(titleMatch || excerptMatch || sectorMatch);
            });
        }

        return pool;
    }, [isFiltered, articlesPool, initialArticles, activeTopic, searchQuery, allTopicLabel]);

    const totalFilteredPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;

    const displayedArticles = useMemo(() => {
        if (!isFiltered) {
            return initialArticles;
        }
        const startIdx = (clientPage - 1) * ITEMS_PER_PAGE;
        return filteredArticles.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    }, [isFiltered, initialArticles, filteredArticles, clientPage]);

    const scrollToFeedTop = () => {
        const el = document.getElementById("news-feed-header");
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <section id="news-feed-header" className="flex flex-col">
            {/* Mobile Only Ad: Before Filter Bar (Top Mobile Ad) */}
            {!hideAds && mobileTopAd && (
                <div className="block lg:hidden my-6 py-3 px-4 flex justify-center bg-slate-50/70 border-y border-slate-200/80 rounded-lg">
                    {mobileTopAd}
                </div>
            )}

            {/* INTERACTIVE TOPIC FILTER BAR */}
            <div className="bg-white pb-3 pt-2 border-b border-slate-200 mb-6">
                <div className="bg-white p-2 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Pill Tabs */}
                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0 scroll-smooth">
                        {TOPICS.map(topic => (
                            <button 
                                key={topic}
                                onClick={() => {
                                    setActiveTopic(topic);
                                    setClientPage(1);
                                }}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                                    activeTopic === topic 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                                }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>

                    {/* Right Controls: Search & Layout Switcher */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="relative group flex items-center h-10">
                            <Search size={16} className="absolute left-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors z-10" />
                            <input 
                                type="text"
                                placeholder="Filter stories..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setClientPage(1);
                                }}
                                className="h-full w-full md:w-56 pl-10 pr-4 bg-white border border-slate-200 rounded-full text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 leading-normal flex items-center"
                            />
                        </div>
                        <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                aria-label="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode("compact")}
                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${viewMode === 'compact' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                aria-label="Compact List View"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Status Badge */}
            {isFiltered && (
                <div className="flex items-center justify-between pb-4 text-xs font-semibold text-slate-500">
                    <div>
                        Showing <span className="font-bold text-slate-900">{filteredArticles.length}</span> {filteredArticles.length === 1 ? 'article' : 'articles'} in <span className="font-bold text-emerald-600 uppercase">{activeTopic}</span>
                        {searchQuery.trim() && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
                    </div>
                    <button 
                        onClick={() => { setActiveTopic(allTopicLabel); setSearchQuery(""); setClientPage(1); }}
                        className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        Clear filter
                    </button>
                </div>
            )}

            {/* PRIMARY STREAM (8:4 Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Left Column (8 cols - News/Stories Stream) */}
                <div className="lg:col-span-8">
                    
                    {displayedArticles.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No articles match your filter</h3>
                            <p className="text-slate-500 text-sm">Try adjusting your sector or search terms.</p>
                            <button 
                                onClick={() => { setActiveTopic(allTopicLabel); setSearchQuery(""); setClientPage(1); }}
                                className="mt-6 text-emerald-600 font-bold text-sm hover:underline cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className={`grid gap-6 lg:gap-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {displayedArticles.map((item, idx) => (
                                <React.Fragment key={item.id || idx}>
                                    <article 
                                        className={`group flex bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative ${viewMode === 'compact' ? 'flex-row items-center p-4 gap-6' : 'flex-col'}`}
                                    >
                                        {/* Image */}
                                        <div className={`relative bg-slate-900 shrink-0 overflow-hidden ${viewMode === 'compact' ? 'w-32 h-32 sm:w-48 sm:h-32 rounded-lg' : 'w-full aspect-[16/10] mb-4'}`}>
                                            {item.image ? (
                                                <Image src={item.image} alt={item.title} fill sizes={viewMode === 'compact' ? "192px" : "(max-width: 768px) 100vw, 50vw"} className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                            ) : (
                                                <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                                    <Zap size={32} className="text-white/10" />
                                                </div>
                                            )}
                                            {viewMode === 'grid' && (
                                                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                            )}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className={`flex flex-col flex-1 space-y-3 ${viewMode === 'compact' ? 'py-1' : 'px-5 pb-5 md:px-6 md:pb-6'}`}>
                                            <div className="flex items-center justify-between relative z-20">
                                                <Link href={`/sectors/${getSectorSlugForTagOrCategory(item.sector)}`} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors">
                                                    {item.sector}
                                                </Link>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <button className="hover:text-emerald-600 transition-colors"><Bookmark size={14} /></button>
                                                    <button className="hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                                                </div>
                                            </div>
                                            
                                            <Link href={`${basePath}/${item.slug}`} className="before:absolute before:inset-0 z-10">
                                                <h3 className={`font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors ${viewMode === 'compact' ? 'text-[15px] line-clamp-2' : 'text-base line-clamp-3'}`}>
                                                    {item.title}
                                                </h3>
                                            </Link>
                                            
                                            {viewMode === 'grid' && (
                                                <p className="text-sm text-slate-500 line-clamp-2 font-light leading-relaxed">
                                                    {item.excerpt}
                                                </p>
                                            )}

                                            <div className={`mt-auto flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-100 pt-3 relative z-20 pointer-events-none ${viewMode === 'compact' ? 'mt-3' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                                                        <ShieldCheck size={12} className="text-emerald-500" />
                                                        {item.author}
                                                    </span>
                                                </div>
                                                <time dateTime={item.rawDate} className="bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100 text-[10px] tracking-wider uppercase">
                                                    {item.date}
                                                </time>
                                            </div>
                                        </div>
                                    </article>

                                    {/* Mobile Only: Inline Ad after 6th news item (Middle Mobile Ad) */}
                                    {!hideAds && idx === 5 && mobileFeedAd && (
                                        <div className="col-span-full block lg:hidden my-8 py-4 px-4 flex justify-center bg-slate-50/70 border-y border-slate-200/80 rounded-xl">
                                            {mobileFeedAd}
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Pagination for All News (Server Paginated Links) */}
                    {!isFiltered && totalPages > 1 && (
                        <div className="mt-12 mb-16 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-8">
                            {/* Prev Button */}
                            <Link 
                                href={page === 2 ? basePath : `${basePath}?page=${page - 1}`}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 transition-all ${page > 1 ? 'hover:border-emerald-600 hover:text-emerald-600 text-slate-700' : 'opacity-40 pointer-events-none text-slate-400'}`}
                            >
                                <ArrowRight size={16} className="rotate-180" />
                            </Link>

                            {/* Numbers */}
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const p = i + 1;
                                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                                    return (
                                        <Link 
                                            key={p}
                                            href={p === 1 ? basePath : `${basePath}?page=${p}`}
                                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${page === p ? 'bg-slate-900 text-white shadow-md' : 'border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600'}`}
                                        >
                                            {p}
                                        </Link>
                                    );
                                }
                                if (p === page - 3 || p === page + 3) {
                                    return <span key={p} className="text-slate-400 px-1 font-bold">...</span>;
                                }
                                return null;
                            })}
                            
                            {/* Next Button */}
                            <Link 
                                href={`${basePath}?page=${page + 1}`}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 transition-all ${page < totalPages ? 'hover:border-emerald-600 hover:text-emerald-600 text-slate-700' : 'opacity-40 pointer-events-none text-slate-400'}`}
                            >
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}

                    {/* Pagination for Filtered Results (Client Instant Pagination) */}
                    {isFiltered && totalFilteredPages > 1 && (
                        <div className="mt-12 mb-16 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-8">
                            <button 
                                type="button"
                                onClick={() => {
                                    setClientPage(p => Math.max(1, p - 1));
                                    scrollToFeedTop();
                                }}
                                disabled={clientPage === 1}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 transition-all ${clientPage > 1 ? 'hover:border-emerald-600 hover:text-emerald-600 text-slate-700 cursor-pointer' : 'opacity-40 pointer-events-none text-slate-400'}`}
                                aria-label="Previous Page"
                            >
                                <ArrowRight size={16} className="rotate-180" />
                            </button>

                            {Array.from({ length: totalFilteredPages }).map((_, i) => {
                                const p = i + 1;
                                if (p === 1 || p === totalFilteredPages || (p >= clientPage - 2 && p <= clientPage + 2)) {
                                    return (
                                        <button 
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                setClientPage(p);
                                                scrollToFeedTop();
                                            }}
                                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all cursor-pointer ${clientPage === p ? 'bg-slate-900 text-white shadow-md' : 'border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600'}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                                if (p === clientPage - 3 || p === clientPage + 3) {
                                    return <span key={p} className="text-slate-400 px-1 font-bold">...</span>;
                                }
                                return null;
                            })}

                            <button 
                                type="button"
                                onClick={() => {
                                    setClientPage(p => Math.min(totalFilteredPages, p + 1));
                                    scrollToFeedTop();
                                }}
                                disabled={clientPage >= totalFilteredPages}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 transition-all ${clientPage < totalFilteredPages ? 'hover:border-emerald-600 hover:text-emerald-600 text-slate-700 cursor-pointer' : 'opacity-40 pointer-events-none text-slate-400'}`}
                                aria-label="Next Page"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (4 cols - Sticky Widgets, Desktop Only) */}
                <aside className="hidden lg:block lg:col-span-4 relative">
                    <StickySidebar className="flex flex-col space-y-8 pb-12 pr-2 lg:pr-4">

                        {/* Both Sidebar AD slots at the TOP */}
                        {!hideAds && (
                            <div className="flex flex-col space-y-6">
                                <div>
                                    {sidebarAd || <SidebarAdSlider slot="top" placement="new_sidebar" />}
                                </div>
                                <div>
                                    {sidebarBottomAd || <SidebarAdSlider slot="bottom" placement="new_sidebar" />}
                                </div>
                            </div>
                        )}

                        {/* Widget: Latest Issue */}
                        {latestIssue && <LatestIssueWidget latestIssue={latestIssue} />}

                        {/* Widget 2: Newsletter */}
                        <SidebarNewsletterForm />

                    </StickySidebar>
                </aside>

            </div>
        </section>
    );
}
