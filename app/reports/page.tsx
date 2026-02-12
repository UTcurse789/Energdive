"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ARTICLES } from "@/data/dummy";
import { ReportCard } from "@/components/ui/report-card";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, X, SlidersHorizontal, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const { scrollY } = useScroll();

    // Parallax effect for hero content
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    const categories = ["All", ...Array.from(new Set(ARTICLES.map(a => a.category)))];

    const filteredReports = useMemo(() => {
        return ARTICLES.filter((report) => {
            const matchesCategory = selectedCategory === "All" || report.category === selectedCategory;
            const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#121212] selection:bg-[#00A651] selection:text-white font-sans">
            <Header />

            {/* Added padding bottom to main to prevent footer collision */}
            <main className="relative pb-24">
                {/* 1. HERO SECTION */}
                <section className="relative w-full min-h-[80vh] flex items-center bg-[#0a0a0a] overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <motion.div
                            style={{ y: y1 }}
                            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-40 scale-110"
                        />
                        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-[#F8F9FA]" />
                    </div>

                    <div className="container mx-auto px-6 lg:px-12 relative z-10 pt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            style={{ opacity }}
                            className="max-w-5xl"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <motion.span
                                    initial={{ width: 0 }}
                                    animate={{ width: "3rem" }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="h-[2px] bg-[#00A651]"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60">
                                    Intelligence & Forecasting
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight text-white leading-[0.85] uppercase mb-10">
                                Strategic <br />
                                <span className="text-[#00A651] italic">Reports</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl leading-relaxed mb-12">
                                Proprietary data and deep-sector expertise mapping the
                                <span className="text-white font-medium"> future of energy infrastructure.</span>
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "#00A651", color: "#ffffff" }}
                                whileTap={{ scale: 0.95 }}
                                className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all"
                            >
                                Browse All Data <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </motion.div>
                    </div>
                </section>

                {/* 2. STICKY FILTERS */}
                <section className="sticky top-[64px] md:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 py-4 shadow-sm">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                {categories.map((cat) => (
                                    <motion.button
                                        key={cat}
                                        whileHover={{ y: -2 }}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "relative px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300",
                                            selectedCategory === cat
                                                ? "bg-black text-white shadow-lg"
                                                : "bg-transparent text-zinc-500 hover:text-black hover:bg-zinc-100"
                                        )}
                                    >
                                        {cat}
                                        {selectedCategory === cat && (
                                            <motion.div layoutId="activeCat" className="absolute inset-0 border-2 border-[#00A651] rounded-full" />
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="relative group w-full lg:max-w-xs">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#00A651] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-100/50 border border-zinc-200/50 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#00A651]/20 focus:border-[#00A651] transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. GRID SECTION - Added padding bottom */}
                <section className="container mx-auto px-6 lg:px-12 py-20 pb-32">
                    <div className="flex items-baseline justify-between mb-12 border-b border-zinc-100 pb-6">
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                            {selectedCategory} <span className="text-[#00A651]">Analysis.</span>
                        </h2>
                    </div>

                    <AnimatePresence mode="popLayout">
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
                        >
                            {filteredReports.map((report, idx) => (
                                <motion.div
                                    key={report.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Variant fixed to "featured" to avoid Type Error */}
                                    <ReportCard article={report} variant="featured" baseUrl="/reports" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </section>

                {/* 4. PREMIUM CTA - Added bottom margin to separate from footer */}
                <section className="container mx-auto px-6 mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative bg-zinc-900 rounded-2rem p-12 md:p-20 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-[#00A651]/20 to-transparent pointer-events-none" />
                        <div className="relative z-10 max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-6">
                                Custom Market <br /><span className="text-[#00A651]">Intelligence.</span>
                            </h2>
                            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                                Need a deep dive into a specific region or technology? Our analysts provide bespoke reporting for institutional investors.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-[#00A651] text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#00A651]/20"
                                >
                                    Request Bespoke Report
                                </motion.button>
                                <motion.button
                                    whileHover={{ backgroundColor: "rgba(255,255,255,1)", color: "#000" }}
                                    className="border border-white/20 text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    View Data Samples
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>
        </div>
    );
}