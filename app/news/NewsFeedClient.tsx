"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, List, Bookmark, Share2, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { slugify } from "@/lib/utils";
import { AdBanner } from "@/components/ads/AdBanner";
import { LatestIssueWidget } from "@/components/news/LatestIssueWidget";
import { SidebarNewsletterForm } from "@/components/news/SidebarNewsletterForm";
import { StickySidebar } from "@/components/ui/StickySidebar";
import type { LatestIssueData } from "@/lib/api/getLatestIssue";

export default function NewsFeedClient({ 
    initialArticles, 
    page, 
    totalPages,
    isFirstPage,
    sidebarAd,
    mobileTopAd,
    mobileFeedAd,
    latestIssue
}: { 
    initialArticles: any[]; 
    page: number; 
    totalPages: number;
    isFirstPage: boolean;
    sidebarAd?: React.ReactNode;
    mobileTopAd?: React.ReactNode;
    mobileFeedAd?: React.ReactNode;
    latestIssue?: LatestIssueData | null;
}) {
    const TOPICS = useMemo(() => {
        const sectors = new Set<string>();
        initialArticles.forEach(a => {
            if (a.sector && a.sector !== "Energy") {
                sectors.add(a.sector);
            }
        });
        return ["All News", ...Array.from(sectors)];
    }, [initialArticles]);

    const [activeTopic, setActiveTopic] = useState("All News");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

    const filteredArticles = useMemo(() => {
        let filtered = initialArticles;
        
        if (activeTopic !== "All News") {
            // Very simplistic filtering since categories might not match exactly.
            // In a real app, mapping topics to Strapi tags/sectors would be more precise.
            const topicSlug = slugify(activeTopic);
            filtered = filtered.filter(a => 
                slugify(a.sector).includes(topicSlug) || 
                slugify(a.category).includes(topicSlug) ||
                topicSlug.includes(slugify(a.sector))
            );
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(query) || 
                (a.excerpt && a.excerpt.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [initialArticles, activeTopic, searchQuery]);

    return (
        <section className="flex flex-col">
            {/* Mobile Only Ad: Before Filter Bar (Top Mobile Ad) */}
            {mobileTopAd && (
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
                                onClick={() => setActiveTopic(topic)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
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
                                placeholder="Filter news..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-full w-full md:w-56 pl-10 pr-4 bg-white border border-slate-200 rounded-full text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 leading-normal flex items-center"
                            />
                        </div>
                        <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                aria-label="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode("compact")}
                                className={`p-1.5 rounded-full transition-colors ${viewMode === 'compact' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                aria-label="Compact List View"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRIMARY NEWS STREAM (8:4 Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Left Column (8 cols - News Stream) */}
                <div className="lg:col-span-8">
                    
                    {filteredArticles.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No articles match your filter</h3>
                            <p className="text-slate-500 text-sm">Try adjusting your category or search terms.</p>
                            <button 
                                onClick={() => { setActiveTopic("All News"); setSearchQuery(""); }}
                                className="mt-6 text-emerald-600 font-bold text-sm hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className={`grid gap-6 lg:gap-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {filteredArticles.map((item, idx) => (
                                <React.Fragment key={idx}>
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
                                                <Link href={`/sectors/${slugify(item.sector)}`} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors">
                                                    {item.sector}
                                                </Link>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <button className="hover:text-emerald-600 transition-colors"><Bookmark size={14} /></button>
                                                    <button className="hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                                                </div>
                                            </div>
                                            
                                            <Link href={`/news/${item.slug}`} className="before:absolute before:inset-0 z-10">
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
                                    {idx === 5 && mobileFeedAd && (
                                        <div className="col-span-full block lg:hidden my-8 py-4 px-4 flex justify-center bg-slate-50/70 border-y border-slate-200/80 rounded-xl">
                                            {mobileFeedAd}
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {activeTopic === "All News" && !searchQuery && totalPages > 1 && (
                        <div className="mt-12 mb-16 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-8">
                            {/* Prev Button */}
                            <Link 
                                href={page === 2 ? "/news" : `/news?page=${page - 1}`}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 transition-all ${page > 1 ? 'hover:border-emerald-600 hover:text-emerald-600 text-slate-700' : 'opacity-40 pointer-events-none text-slate-400'}`}
                            >
                                <ArrowRight size={16} className="rotate-180" />
                            </Link>

                            {/* Numbers */}
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const p = i + 1;
                                // Show first, last, and window around current page
                                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                                    return (
                                        <Link 
                                            key={p}
                                            href={p === 1 ? "/news" : `/news?page=${p}`}
                                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${page === p ? 'bg-slate-900 text-white shadow-md' : 'border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600'}`}
                                        >
                                            {p}
                                        </Link>
                                    );
                                }
                                // Ellipsis markers
                                if (p === page - 3 || p === page + 3) {
                                    return <span key={p} className="text-slate-400 px-1 font-bold">...</span>;
                                }
                                return null;
                            })}
                            
                            {/* Next Button */}
                            <Link 
                                href={`/news?page=${page + 1}`}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 transition-all ${page < totalPages ? 'hover:border-emerald-600 hover:text-emerald-600 text-slate-700' : 'opacity-40 pointer-events-none text-slate-400'}`}
                            >
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (4 cols - Sticky Widgets, Desktop Only) */}
                <aside className="hidden lg:block lg:col-span-4 relative">
                    <StickySidebar className="flex flex-col space-y-8 pb-12 pr-2 lg:pr-4">

                        {/* AD: new_sidebar */}
                        <div>
                            {sidebarAd || <AdBanner placement="new_sidebar" variant="card" />}
                        </div>

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
