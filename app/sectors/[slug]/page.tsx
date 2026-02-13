"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ARTICLES, SECTORS } from "@/data/dummy";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SectorIntelligencePage() {
    const params = useParams();
    const slug = params?.slug as string;

    // 1. DYNAMIC DATA FETCHING
    // Pulls the correct sector metadata based on the URL slug
    const sectorData = useMemo(() => {
        const found = SECTORS.find((s) => s.slug === slug);
        return found || {
            title: "Sector Intelligence",
            description: "Proprietary market data and infrastructure insights mapping the future of energy.",
            heroImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072"
        };
    }, [slug]);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");

    // 2. FILTERING LOGIC
    // Filters by: Current Sector -> Active Sub-Category -> Search Query
    const filteredReports = useMemo(() => {
        return ARTICLES.filter((report) => {
            const isCorrectSector = report.category?.toLowerCase() === sectorData.title.toLowerCase();
            const matchesTab = activeTab === "ALL" || report.subCategory?.toUpperCase() === activeTab;
            const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
            return isCorrectSector && matchesTab && matchesSearch;
        });
    }, [activeTab, searchQuery, sectorData.title]);

    // 3. DYNAMIC SUB-CATEGORIES
    // Generates filter pills based on available data for this sector
    const subCategories = useMemo(() => {
        const subs = ARTICLES.filter(a => a.category?.toLowerCase() === sectorData.title.toLowerCase())
            .map(a => a.subCategory?.toUpperCase())
            .filter((s): s is string => !!s);
        return ["ALL", ...Array.from(new Set(subs))];
    }, [sectorData.title]);

    return (
        <div className="min-h-screen bg-white text-[#121212] font-sans selection:bg-[#00C6A7]/20">

            {/* SECTION 1 — HERO: DYNAMICALLY GENERATED */}
            <section className="relative h-[55vh] flex items-center bg-[#FDFDFD] overflow-hidden border-b border-gray-50">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={sectorData.heroImage || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072"}
                        alt={sectorData.title}
                        fill
                        className="object-cover opacity-[0.15] grayscale"
                        priority
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-white/10 via-white/80 to-white" />
                </div>

                <div className="container mx-auto px-6 lg:px-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl"
                    >
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                            <Link href="/" className="hover:text-black transition-colors">EnergDive</Link>
                            <ChevronRight size={10} />
                            <span className="text-[#00C6A7]">Intelligence</span>
                        </nav>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase mb-8">
                            {sectorData.title.split(' ')[0]} <br />
                            <span className="text-[#00C6A7] italic">{sectorData.title.split(' ').slice(1).join(' ') || "REPORTS"}</span>
                        </h1>

                        <p className="text-xl text-gray-500 font-light max-w-2xl leading-relaxed border-l-4 border-[#00C6A7]/20 pl-8">
                            {sectorData.description}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* SECTION 2 — FILTER BAR: UNIFIED & STICKY */}
            <section className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 py-5">
                <div className="container mx-auto px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Category Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                        {subCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === cat
                                    ? "bg-[#121212] border-[#121212] text-white shadow-lg"
                                    : "bg-transparent border-gray-200 text-gray-500 hover:border-black hover:text-black"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Box */}
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#00C6A7] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${sectorData.title} analysis...`}
                            className="w-full bg-gray-50 border border-gray-100 rounded-full py-3.5 pl-12 pr-6 text-xs focus:ring-4 focus:ring-[#00C6A7]/5 focus:border-[#00C6A7] outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </section>

            {/* SECTION 3 — THE GRID: STANDARDIZED 3-COLUMN LAYOUT */}
            <section className="container mx-auto px-6 lg:px-16 py-20 mb-20">
                <div className="mb-10 border-b border-gray-100 pb-4 pt-4 flex items-end justify-between">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter italic">
                            All <span className="text-[#00C6A7]">Analysis.</span>
                        </h2>
                        <div className="w-16 h-1.5 bg-[#00C6A7] mt-3" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
                        Displaying {filteredReports.length} Insights
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredReports.map((report) => (
                            <motion.div
                                layout
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                {/* Image */}
                                <Link href={`/news/${report.slug}`} className="relative aspect-4/3 overflow-hidden bg-gray-50">
                                    <Image
                                        src={report.image}
                                        alt={report.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </Link>

                                {/* Content */}
                                <div className="flex flex-col flex-1 p-6">
                                    <Link href={`/news/${report.slug}`}>
                                        <h3 className="text-lg font-bold leading-tight mb-4 group-hover:text-[#00C6A7] transition-colors line-clamp-3">
                                            {report.title}
                                        </h3>
                                    </Link>

                                    {/* Metadata Footer */}
                                    <div className="mt-auto pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Team ENERGDIVE</span>
                                            <span className="mx-2">|</span>
                                            <span>{report.date || "February 12, 2026"}</span>
                                            <span className="mx-2">|</span>
                                            <span className="font-semibold">News</span>
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State Handler */}
                {filteredReports.length === 0 && (
                    <div className="py-40 text-center rounded-[3rem] border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 italic font-light">No intelligence reports found matching your criteria.</p>
                        <button onClick={() => { setActiveTab("ALL"); setSearchQuery("") }} className="mt-4 text-[#00C6A7] text-xs font-bold uppercase tracking-widest underline">Reset Filters</button>
                    </div>
                )}
            </section>
        </div>
    );
}