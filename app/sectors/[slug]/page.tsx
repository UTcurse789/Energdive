"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Clock, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ================================
   STRAPI CONFIG & HELPERS
================================ */
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

async function fetchSectorWithChildren(slug: string) {
    try {
        const url = `${STRAPI}/api/sectors?filters[slug][$eq]=${slug}&populate=children`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        return json?.data?.[0] || null;
    } catch (err) {
        return null;
    }
}

async function fetchSectorArticles(slug: string) {
    try {
        const url = `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Articles&filters[sectors][slug][$eq]=${slug}&populate=*`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        return json?.data || [];
    } catch (err) {
        return [];
    }
}

function formatDate(dateStr: string) {
    if (!dateStr) return "Recent";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/* ================================
   MAIN PAGE COMPONENT
================================ */
export default function SectorIntelligencePage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [articles, setArticles] = useState<any[]>([]);
    const [childSectors, setChildSectors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");

    useEffect(() => {
        if (!slug) return;
        fetchSectorWithChildren(slug).then((sector) => setChildSectors(sector?.children || []));
        fetchSectorArticles(slug).then((data) => {
            const formatted = data.map((item: any) => ({
                id: item.id,
                title: item.Title,
                slug: item.slug,
                date: item.Date,
                sectors: item.sectors || [],
                image: item?.FeaturedImage?.url ? `${STRAPI}${item.FeaturedImage.url}` : "/placeholder.jpg",
                excerpt: item.Excerpt?.[0]?.children?.[0]?.text || "",
            }));
            setArticles(formatted);
        });
    }, [slug]);

    const sectorMeta = useMemo(() => {
        const title = slug?.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return {
            title: title || "Sector Intelligence",
            description: "Deep-dive proprietary market data and critical infrastructure insights mapping the global energy transition.",
            heroImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
        };
    }, [slug]);

    const subCategories = useMemo(() => {
        const children = childSectors.map((c: any) => c.name?.toUpperCase());
        return ["ALL", ...children];
    }, [childSectors]);

    const filteredReports = useMemo(() => {
        return articles.filter((report) => {
            const matchesTab = activeTab === "ALL" || report.sectors?.some((s: any) => s?.name?.toUpperCase() === activeTab);
            const matchesSearch = report.title?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchQuery, articles]);

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#121212] selection:bg-[#00C6A7]/30">

            {/* HERO SECTION */}
            <section className="relative h-[65vh] flex items-center overflow-hidden bg-black">
                <Image
                    src={sectorMeta.heroImage}
                    alt={sectorMeta.title}
                    fill
                    className="object-cover opacity-40 grayscale scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

                <div className="container mx-auto px-6 lg:px-16 relative z-10">
                    <motion.nav
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-[10px] font-black text-[#00C6A7] uppercase tracking-[0.2em] mb-12"
                    >
                        <Link href="/" className="hover:text-white transition">EnergDive</Link>
                        <ChevronRight size={10} className="text-gray-600" />
                        <span className="text-white/50">Intelligence</span>
                    </motion.nav>

                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl md:text-[120px] font-black uppercase leading-[0.85] tracking-tighter text-white mb-8"
                    >
                        {sectorMeta.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-400 max-w-xl border-l-2 border-[#00C6A7] pl-8 font-light leading-relaxed"
                    >
                        {sectorMeta.description}
                    </motion.p>
                </div>
            </section>

            {/* STICKY NAVIGATION & FILTER */}
            <section className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6">
                <div className="container mx-auto px-6 lg:px-16 flex flex-col lg:flex-row gap-8 justify-between items-center">

                    {/* Horizontal Scroller for Tabs */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar w-full lg:w-auto pb-2 lg:pb-0 pr-6 scroll-px-6 snap-x">
                        {subCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${activeTab === cat
                                    ? "bg-black text-white border-black scale-105 shadow-lg shadow-black/10"
                                    : "bg-transparent border-gray-200 text-gray-400 hover:border-black hover:text-black"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sophisticated Search Bar */}
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#00C6A7] transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search through ${sectorMeta.title.toLowerCase()}...`}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-full py-4 pl-12 pr-6 text-sm focus:bg-white focus:ring-4 focus:ring-[#00C6A7]/5 transition-all outline-none"
                        />
                    </div>
                </div>
            </section>

            {/* MAIN CONTENT GRID */}
            <section className="container mx-auto px-6 lg:px-16 py-24 min-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                    <AnimatePresence mode="popLayout">
                        {filteredReports.map((report, idx) => (
                            <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link
                                    href={`/articles/${report.slug}`}
                                    className="group block relative"
                                >
                                    {/* Card Image Wrapper */}
                                    <div className="relative aspect-16/10 rounded-2xl overflow-hidden mb-6 bg-gray-200 shadow-sm transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                                        <Image
                                            src={report.image}
                                            alt={report.title}
                                            fill
                                            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                                        />
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <ArrowUpRight size={18} className="text-black" />
                                        </div>
                                    </div>

                                    {/* Card Metadata */}
                                    <div className="space-y-3 px-1">
                                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-[#00C6A7]">
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDate(report.date)}
                                            </span>
                                            <span className="h-1px w-4 bg-gray-200" />
                                            <span>Insight Report</span>
                                        </div>

                                        <h3 className="text-2xl font-bold leading-tight tracking-tight text-[#1a1a1a] group-hover:text-[#00C6A7] transition-colors duration-300">
                                            {report.title}
                                        </h3>

                                        <p className="text-sm text-gray-500 line-clamp-2 font-light leading-relaxed">
                                            {report.excerpt}
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* EMPTY STATE */}
                {filteredReports.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-40 text-center flex flex-col items-center justify-center"
                    >
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-300">No Intelligence Found</h2>
                        <p className="text-gray-400 mt-2">Adjust your filters or try a different search term.</p>
                    </motion.div>
                )}
            </section>

            {/* SPACING COMPONENT FOR FOOTER GAP */}
            <div className="h-32 lg:h-48" aria-hidden="true" />
        </div>
    );
}