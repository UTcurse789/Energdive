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
}"use client";

import { Search, Filter, ChevronRight, Download } from "lucide-react";
import { useState } from "react";

const ReportsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const reports = [
    {
      id: 1,
      title: "The Next Frontier: Advancing HSE to Achieve Global SDGs",
      date: "December 2023",
      category: "HSE",
      desc: "The future of innovation is intrinsically linked to the future of Health, Safety, and Environment (HSE). This report explores the definitive conclusions shaping next-generation sustainability.",
      image:
        "https://via.placeholder.com/600x400/e2e8f0/475569?text=HSE+Report",
    },
    {
      id: 2,
      title:
        "The Next Horizon: Downstream 2030, Innovations for a Low-Carbon Future",
      date: "January 2024",
      category: "Oil & Gas",
      desc: "India's downstream sector is reacting to change; it's leading it by hardwiring sustainability into refineries and petrochemicals for a low-carbon economy.",
      image:
        "https://via.placeholder.com/600x400/e2e8f0/475569?text=Energy+Report",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      
      {/* HEADER */}
      <header className="border-b border-slate-200 pt-10 pb-14 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Modern Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 mb-10">
            <a
              href="/"
              className="hover:text-teal-600 transition font-medium"
            >
              Home
            </a>

            <ChevronRight size={14} className="mx-2 text-slate-400" />

            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 shadow-sm">
              Reports
            </span>
          </nav>

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Reports
              </h1>
            </div>
            <div className="md:w-1/3 text-slate-600 leading-relaxed text-sm md:text-base">
              Explore our in-depth research insights, policy reviews, and market intelligence shaping the global energy landscape.
            </div>
          </div>
        </div>
      </header>

      {/* FILTER + SEARCH */}
      <section className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Filter */}
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-full text-sm font-medium hover:bg-slate-50 transition">
            <Filter size={16} />
            <span>Filter Options</span>
          </button>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
          </div>
        </div>
      </section>

      {/* REPORTS LIST */}
      <main className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 gap-10">
          {reports.map((report) => (
            <div
              key={report.id}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="flex flex-col md:flex-row">

                {/* Image */}
                <div className="relative md:w-80 overflow-hidden">
                  <img
                    src={report.image}
                    alt={report.title}
                    className="w-full h-64 md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Category Badge */}
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-teal-700 rounded-full shadow">
                    {report.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                      {report.date}
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 group-hover:text-teal-600 transition-colors duration-300">
                      {report.title}
                    </h2>

                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                      {report.desc}
                    </p>
                  </div>

                  <div className="mt-6">
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-white hover:bg-teal-600 px-5 py-2.5 border border-teal-600 rounded-lg transition-all duration-300">
                      View Report
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
